/* ============================================================
   backend.js — Supabase 연동 (로그인 / 프로필 / 기록 / 랭킹)
   ------------------------------------------------------------
   게임 로직(game.js)은 이 파일이 노출하는 Account 객체만 사용한다.
   Supabase가 설정 안 됐거나 오프라인이어도 게임 자체는 그대로 동작하도록,
   모든 함수는 실패 시 조용히 null/false를 돌려준다.
   ============================================================ */

const Account = (() => {
  let client = null;       // Supabase 클라이언트
  let session = null;      // 현재 로그인 세션 (없으면 null)
  let profile = null;      // 현재 사용자 프로필 {id, nickname, theme_line}
  let ready = false;       // 초기화 완료 여부
  let available = false;   // 키 검증/최초 API 호출까지 성공했는지
  const listeners = [];    // 로그인/프로필 변경 구독자

  function configured() {
    return typeof SUPABASE_URL === "string" &&
           SUPABASE_URL.startsWith("http") &&
           typeof SUPABASE_ANON_KEY === "string" &&
           SUPABASE_ANON_KEY.length > 20;
  }

  function notify() { listeners.forEach(fn => { try { fn(); } catch (e) {} }); }

  // 외부에서 로그인 상태 변화를 구독
  function onChange(fn) { listeners.push(fn); }

  async function init() {
    if (!configured()) {
      console.warn("[Account] Supabaseが未設定のため、ログインとランキングは無効です。");
      ready = true; notify(); return;
    }
    if (!window.supabase || !window.supabase.createClient) {
      console.warn("[Account] Supabaseライブラリを読み込めませんでした。");
      ready = true; notify(); return;
    }
    try {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // 최초 요청까지 성공해야 "설정됨"이 아니라 실제 "사용 가능"으로 본다.
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      const { error: healthError } = await client.from("jp_rooms").select("code").limit(1);
      if (healthError) throw healthError;
      available = true;
      session = data.session || null;
      if (session) await loadProfile();

      // 로그인/로그아웃 등 상태 변화 감지
      client.auth.onAuthStateChange(async (_event, newSession) => {
        session = newSession;
        profile = null;
        if (session) await loadProfile();
        notify();
      });
    } catch (e) {
      console.warn("[Account] Supabaseに接続できません。Project URLとPublishable keyを確認してください。", e && e.message ? e.message : e);
      client = null;
      session = null;
      profile = null;
      available = false;
    }

    ready = true;
    notify();
  }

  async function loadProfile() {
    if (!client || !session) { profile = null; return; }
    const { data, error } = await client
      .from("jp_profiles")
      .select("id, nickname, theme_line")
      .eq("id", session.user.id)
      .maybeSingle();
    if (error) { console.warn("[Account] プロフィールの取得に失敗", error.message); profile = null; return; }
    profile = data || null;
  }

  // SupabaseのCustom OIDC Provider経由でLINEログインを開始する。
  async function signInWithLine() {
    if (!client) return false;
    const redirectTo = location.href.split(/[?#]/)[0];
    const { error } = await client.auth.signInWithOAuth({
      provider: typeof LINE_AUTH_PROVIDER === "string" ? LINE_AUTH_PROVIDER : "custom:line",
      options: { redirectTo, scopes: "openid profile" },
    });
    if (error) { console.warn("[Account] LINEログインに失敗", error.message); return false; }
    return true;
  }

  // Supabaseの標準Google OAuth Providerでログインを開始する。
  async function signInWithGoogle() {
    if (!client) return false;
    const redirectTo = location.href.split(/[?#]/)[0];
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) { console.warn("[Account] Googleログインに失敗", error.message); return false; }
    return true;
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    session = null; profile = null;
    notify();
  }

  // 처음 로그인한 사용자의 프로필 생성 (닉네임 + 테마 노선)
  // 반환: { ok:true } 또는 { ok:false, reason:"duplicate"|"error", message }
  async function createProfile(nickname, themeLine) {
    if (!client || !session) return { ok: false, reason: "error", message: "ログインが必要です。" };
    nickname = (nickname || "").trim();
    if (nickname.length < 1 || nickname.length > 12) {
      return { ok: false, reason: "error", message: "ニックネームは1〜12文字で入力してください。" };
    }
    const { error } = await client.from("jp_profiles").insert({
      id: session.user.id,
      nickname,
      theme_line: themeLine || "G",
    });
    if (error) {
      // 닉네임 유니크 인덱스 위반(중복)
      if (error.code === "23505") return { ok: false, reason: "duplicate", message: "このニックネームは使用されています。" };
      return { ok: false, reason: "error", message: error.message };
    }
    await loadProfile();
    notify();
    return { ok: true };
  }

  // 테마 노선 변경 (마이페이지)
  async function updateThemeLine(themeLine) {
    if (!client || !session) return false;
    const { error } = await client
      .from("jp_profiles")
      .update({ theme_line: themeLine, updated_at: new Date().toISOString() })
      .eq("id", session.user.id);
    if (error) { console.warn("[Account] テーマ路線の変更に失敗", error.message); return false; }
    if (profile) profile.theme_line = themeLine;
    notify();
    return true;
  }

  // 닉네임 변경 (마이페이지)
  async function updateNickname(nickname) {
    if (!client || !session) return { ok: false, message: "ログインが必要です。" };
    nickname = (nickname || "").trim();
    if (nickname.length < 1 || nickname.length > 12) {
      return { ok: false, message: "ニックネームは1〜12文字で入力してください。" };
    }
    const { error } = await client
      .from("jp_profiles")
      .update({ nickname, updated_at: new Date().toISOString() })
      .eq("id", session.user.id);
    if (error) {
      if (error.code === "23505") return { ok: false, message: "このニックネームは使用されています。" };
      return { ok: false, message: error.message };
    }
    if (profile) profile.nickname = nickname;
    notify();
    return { ok: true };
  }

  // タイムアタックの記録を保存する（エンドレスは保存対象外）。
  async function savePlay({ score, modeLabel, duration, theoreticalMax }) {
    if (!client || !session) return false;
    const payload = {
      user_id: session.user.id,
      score,
      region: "tokyo",
      mode: "all",
      rank_mode: "tokyo:all",
      mode_label: modeLabel,
      duration_sec: duration,
      theoretical_max: theoreticalMax,
    };
    const { error } = await client.from("jp_plays").insert(payload);
    if (error) { console.warn("[Account] 記録の保存に失敗", error.message); return false; }
    return true;
  }

  // 내 플레이 기록 가져오기 (마이페이지)
  async function myPlays(limit = 50) {
    if (!client || !session) return [];
    const { data, error } = await client
      .from("jp_plays")
      .select("score, region, mode, mode_label, duration_sec, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) { console.warn("[Account] プレイ履歴の取得に失敗", error.message); return []; }
    return data || [];
  }

  // 내 최고점 (지역+모드+제한시간별) — 마이페이지 요약용
  async function myBest() {
    const plays = await myPlays(500);
    const best = {};
    for (const p of plays) {
      const key = `tokyo:all:${p.duration_sec || 60}`;
      if (best[key] === undefined || p.score > best[key]) best[key] = p.score;
    }
    return best;
  }

  // 制限時間別の歴代ランキング。
  async function allTimeRanking(mode, duration, limit = 100) {
    if (!client) {
      return { rows: [], error: "Supabaseに接続されていません。" };
    }
    const { data, error } = await client.rpc("jp_all_time_ranking_by_duration", {
      p_mode: "tokyo:all",
      p_duration: duration,
      p_limit: limit,
    });
    if (error) {
      const message = error.message || "不明なエラー";
      console.warn("[Account] ランキングの取得に失敗", message);
      return { rows: [], error: message };
    }
    return { rows: data || [], error: null };
  }

  return {
    init, onChange,
    isConfigured: configured,
    isReady: () => ready,
    isAvailable: () => available,
    isLoggedIn: () => !!session,
    hasProfile: () => !!profile,
    getProfile: () => profile,
    getEmail: () => session?.user?.email || session?.user?.user_metadata?.name || null,
    getUserId: () => session?.user?.id || null,
    getClient: () => client,          // 대전 모드(Realtime)에서 사용
    signInWithGoogle, signInWithLine, signOut,
    createProfile, updateThemeLine, updateNickname,
    savePlay, myPlays, myBest, allTimeRanking,
  };
})();
