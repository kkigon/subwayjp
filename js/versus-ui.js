/* オンライン対戦の画面制御。ゲーム範囲は東京・全13路線に固定。 */
(() => {
  const $ = selector => document.querySelector(selector);
  const escapeHtml = value => String(value || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));

  let publicRoomTimer = null;
  let publicRoomRequest = 0;
  let settingsSaveTimer = null;
  let settingsWired = false;
  let unreadChat = 0;
  let lastChatMessageId = null;
  const vsSettings = { duration: 60 };

  function showScreen(selector) {
    document.querySelectorAll(".vs-screen").forEach(screen => screen.classList.remove("show"));
    if (selector) $(selector)?.classList.add("show");
    document.body.classList.toggle("in-versus", Boolean(selector));
  }

  function ensureAccountReady(timeoutMs = 2500) {
    return new Promise(resolve => {
      if (Account.isReady?.()) return resolve();
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      Account.onChange?.(() => { if (Account.isReady?.()) finish(); });
      setTimeout(finish, timeoutMs);
    });
  }

  function setRoomUrl(code) {
    try { history.replaceState(null, "", `${location.pathname}?room=${code}`); } catch (error) {}
  }

  function openEntry() {
    if (!Account.isConfigured?.()) {
      alert("オンライン対戦にはSupabaseの設定が必要です。");
      return;
    }
    if (Account.isReady?.() && !Account.isAvailable?.()) {
      alert("Supabaseに接続できません。Project URLとPublishable keyをご確認ください。");
      return;
    }
    $("#vs-entry-error").textContent = "";
    $("#vs-code-input").value = "";
    const title = $("#vs-room-title");
    if (title && !title.value.trim()) {
      title.value = `${Versus.resolveMyName()}のルーム`.slice(0, 30);
      const initial = title.value;
      ensureAccountReady().then(() => {
        if (title.value === initial) title.value = `${Versus.resolveMyName()}のルーム`.slice(0, 30);
      });
    }
    if ($("#vs-room-public")) $("#vs-room-public").checked = true;
    showScreen("#vs-entry-screen");
    startPublicRoomBrowser();
  }

  function closeVersus() {
    stopPublicRoomBrowser();
    if (settingsSaveTimer) clearTimeout(settingsSaveTimer);
    settingsSaveTimer = null;
    closeChat();
    document.body.classList.remove("vs-room-connected", "in-versus", "versus-mode");
    showScreen(null);
    if (typeof State !== "undefined") State.versus = false;
    if (typeof goHome === "function") goHome();
    else {
      document.body.classList.remove("in-game", "at-end", "studying", "endless-mode");
      document.body.classList.add("at-home");
    }
  }

  async function doCreate() {
    const button = $("#vs-create-btn");
    button.disabled = true;
    button.textContent = "作成中…";
    await ensureAccountReady();
    const result = await Versus.createRoom({
      title: $("#vs-room-title")?.value,
      isPublic: $("#vs-room-public")?.checked !== false,
    });
    button.disabled = false;
    button.textContent = "ルームを作成";
    if (!result.ok) {
      $("#vs-entry-error").textContent = result.message || "ルームを作成できませんでした。";
      return;
    }
    setRoomUrl(result.code);
    enterLobby();
  }

  async function doJoin(codeOverride, fromUrl = false) {
    const code = codeOverride || $("#vs-code-input")?.value;
    const button = $("#vs-join-btn");
    if (button) { button.disabled = true; button.textContent = "参加中…"; }
    await ensureAccountReady();
    const result = await Versus.joinRoom(code);
    if (button) { button.disabled = false; button.textContent = "参加"; }
    if (!result.ok) {
      if ($("#vs-entry-error")) $("#vs-entry-error").textContent = result.message || "参加できませんでした。";
      if (fromUrl) {
        try { history.replaceState(null, "", location.pathname); } catch (error) {}
        showScreen("#vs-entry-screen");
        startPublicRoomBrowser();
      }
      return;
    }
    setRoomUrl(result.code);
    enterLobby();
  }

  function stopPublicRoomBrowser() {
    if (publicRoomTimer) clearInterval(publicRoomTimer);
    publicRoomTimer = null;
  }

  function startPublicRoomBrowser() {
    stopPublicRoomBrowser();
    refreshPublicRooms();
    publicRoomTimer = setInterval(refreshPublicRooms, 10000);
  }

  function renderPublicRooms(rooms) {
    const box = $("#vs-public-rooms");
    if (!box) return;
    if (!rooms.length) {
      box.innerHTML = '<p class="muted">参加できる公開ルームはありません。<br>新しいルームを作ってみましょう！</p>';
      return;
    }
    box.innerHTML = rooms.map(room => `<article class="vs-room-item">
      <div class="vs-room-main">
        <strong class="vs-room-title">${escapeHtml(room.room_title || "名前のないルーム")}</strong>
        <div class="vs-room-meta">
          <span>👑 ${escapeHtml(room.host_name || "ゲスト")}</span>
          <span>🚇 東京・全13路線</span>
          <span>⏱ ${Number(room.duration_sec) || 60}秒</span>
          <span>👥 ${Math.max(1, Number(room.member_count) || 1)}人</span>
        </div>
      </div>
      <button class="vs-room-join" type="button" data-room-code="${escapeHtml(room.code)}">参加</button>
    </article>`).join("");
    box.querySelectorAll(".vs-room-join").forEach(button => {
      button.addEventListener("click", async () => {
        button.disabled = true;
        button.textContent = "参加中…";
        await doJoin(button.dataset.roomCode);
        if (button.isConnected) { button.disabled = false; button.textContent = "参加"; }
      });
    });
  }

  async function refreshPublicRooms() {
    const requestId = ++publicRoomRequest;
    const refresh = $("#vs-room-refresh");
    refresh?.classList.add("loading");
    const result = await Versus.listPublicRooms(30);
    if (requestId !== publicRoomRequest) return;
    refresh?.classList.remove("loading");
    if (result.ok) renderPublicRooms(result.rooms || []);
    else if ($("#vs-public-rooms")) {
      $("#vs-public-rooms").innerHTML = `<p class="muted">ルーム一覧を取得できませんでした。<br>${escapeHtml(result.message || "しばらくしてからお試しください。")}</p>`;
    }
  }

  function lineColor(id) {
    return (typeof LINES !== "undefined" && LINES.find(line => line.id === id)?.color) || "#9aa0a6";
  }

  function playerTag(player) {
    const me = player.id === Versus.myId();
    const host = player.id === Versus.getHostId();
    const transfer = Versus.isHost() && !me && !host
      ? `<button class="vs-give-host" type="button" data-give="${escapeHtml(player.id)}" title="ホストを譲る">👑 譲る</button>` : "";
    return `<div class="vs-player-tag${me ? " me" : ""}">
      <span class="vs-player-dot" style="background:${lineColor(player.themeLine)}"></span>
      <span>${escapeHtml(player.name)}</span>
      ${host ? '<span class="vs-crown" title="ホスト">👑</span>' : ""}
      ${me ? '<span class="vs-me">自分</span>' : ""}${transfer}
    </div>`;
  }

  function renderPlayers(players) {
    const box = $("#vs-players");
    if (!box) return;
    if (!players?.length) {
      box.innerHTML = '<p class="muted">参加者を待っています…</p>';
      return;
    }
    box.innerHTML = `<div class="vs-players-count">現在 ${players.length}人が参加中</div><div class="vs-players-list">${players.map(playerTag).join("")}</div>`;
    box.querySelectorAll(".vs-give-host").forEach(button => {
      button.addEventListener("click", () => confirmTransfer(button.dataset.give));
    });
  }

  async function confirmTransfer(targetId) {
    const target = Versus.getPlayers().find(player => player.id === targetId);
    if (!target || !confirm(`「${target.name}」さんにホストを譲りますか？`)) return;
    const result = await Versus.transferHost(targetId);
    if (!result.ok) alert(result.message || "ホストを変更できませんでした。");
  }

  function syncSettingsFromRoom() {
    const duration = Number(Versus.Room.data?.duration_sec);
    vsSettings.duration = [60, 120, 300].includes(duration) ? duration : 60;
    document.querySelectorAll("#vs-set-duration .vs-seg-btn").forEach(button => {
      button.classList.toggle("active", Number(button.dataset.dur) === vsSettings.duration);
    });
  }

  function queueSettingsSave() {
    if (!Versus.isHost() || !Versus.Room.code) return;
    if (settingsSaveTimer) clearTimeout(settingsSaveTimer);
    settingsSaveTimer = setTimeout(async () => {
      settingsSaveTimer = null;
      const result = await Versus.updateSettings({ duration: vsSettings.duration });
      if (!result.ok) console.warn("[VersusUI] ルーム設定の保存に失敗", result.message || "unknown");
    }, 250);
  }

  function wireSettingsOnce() {
    if (settingsWired) return;
    settingsWired = true;
    $("#vs-set-duration")?.querySelectorAll(".vs-seg-btn").forEach(button => {
      button.addEventListener("click", () => {
        $("#vs-set-duration").querySelectorAll(".vs-seg-btn").forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        vsSettings.duration = Number(button.dataset.dur) || 60;
        queueSettingsSave();
      });
    });
    $("#vs-start-btn")?.addEventListener("click", doStartGame);
  }

  async function doStartGame() {
    const button = $("#vs-start-btn");
    button.disabled = true;
    button.textContent = "開始中…";
    const result = await Versus.startGame({ duration: vsSettings.duration });
    button.disabled = false;
    button.textContent = "対戦スタート";
    if (!result.ok) alert(result.message || "ゲームを開始できませんでした。");
  }

  function refreshRole() {
    const host = Versus.isHost();
    if ($("#vs-lobby-role")) $("#vs-lobby-role").textContent = host ? "ホスト" : "参加者";
    if ($("#vs-host-controls")) $("#vs-host-controls").style.display = host ? "" : "none";
    if ($("#vs-guest-note")) $("#vs-guest-note").style.display = host ? "none" : "";
    if (host) syncSettingsFromRoom();
    renderPlayers(Versus.getPlayers());
  }

  function renderScoreboard() {
    const box = $("#vs-scoreboard");
    if (!box) return;
    if (!window.VersusGame?.isVersus()) { box.classList.remove("show"); return; }
    const scores = VersusGame.getScores?.() || {};
    const winner = VersusGame.lastWinnerId?.();
    const players = [...Versus.getPlayers()].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0) || String(a.name).localeCompare(String(b.name), "ja"));
    box.innerHTML = players.map(player => `<div class="vs-sb-item${player.id === winner ? " winner" : ""}${player.id === Versus.myId() ? " me" : ""}">
      <span class="vs-sb-dot" style="background:${lineColor(player.themeLine)}"></span>
      <span class="vs-sb-name">${escapeHtml(player.name)}</span>
      <span class="vs-sb-score">${scores[player.id] || 0}</span>
      ${player.typing ? '<span class="vs-sb-typing">入力中…</span>' : ""}
    </div>`).join("");
    box.classList.add("show");
  }

  function showResult(data) {
    const ranking = data?.ranking || [];
    const myId = data?.myId || Versus.myId();
    const medals = ["🥇", "🥈", "🥉"];
    $("#vs-result-list").innerHTML = ranking.map((result, index) => `<div class="vs-result-item${result.id === myId ? " me" : ""}${index === 0 ? " first" : ""}">
      <span class="vs-result-rank">${medals[index] || `<span class="vs-rank-num">${index + 1}</span>`}</span>
      <span class="vs-sb-dot" style="background:${lineColor(result.themeLine)}"></span>
      <span class="vs-result-name">${escapeHtml(result.name)}${result.id === myId ? "（自分）" : ""}</span>
      <span class="vs-result-score">${result.score}点</span>
    </div>`).join("");
    $("#vs-again-btn").textContent = "ロビーへ戻る";
    $("#vs-result-note").textContent = Versus.isHost()
      ? "戻ると、全員をロビーへ移動します。"
      : "自分だけロビーへ戻ります。ホストが再開できます。";
    showScreen("#vs-result-screen");
    document.body.classList.remove("at-end");
  }

  function backToLobbyUI() {
    document.body.classList.remove("in-game", "at-end", "versus-mode");
    $("#vs-scoreboard")?.classList.remove("show");
    enterLobby();
  }

  function enterLobby() {
    const room = Versus.Room;
    stopPublicRoomBrowser();
    document.body.classList.add("vs-room-connected");
    $("#vs-lobby-code").textContent = room.code;
    $("#vs-lobby-link").value = Versus.inviteLink(room.code);
    const roomTitle = room.data?.room_title || `${room.data?.host_name || room.myName}のルーム`;
    $("#vs-lobby-title").textContent = roomTitle;
    $("#vs-chat-room-name").textContent = roomTitle;
    const isPublic = room.data?.is_public !== false;
    $("#vs-lobby-visibility").textContent = isPublic ? "公開" : "非公開";
    $("#vs-lobby-visibility").classList.toggle("private", !isPublic);
    $("#vs-my-name").textContent = room.myName;
    wireSettingsOnce();
    syncSettingsFromRoom();
    refreshRole();
    renderChat(Versus.getMessages());
    showScreen("#vs-lobby-screen");
  }

  async function doLeave() {
    try { await Versus.leaveRoom(); } catch (error) {}
    if (location.search.includes("room=")) {
      try { history.replaceState(null, "", location.pathname); } catch (error) {}
    }
    document.body.classList.remove("vs-room-connected");
    closeChat();
    lastChatMessageId = null;
    closeVersus();
  }

  async function copyLink() {
    const input = $("#vs-lobby-link");
    try { await navigator.clipboard.writeText(input.value); }
    catch (error) { input.select(); document.execCommand("copy"); }
    const button = $("#vs-copy-link");
    const original = button.textContent;
    button.textContent = "コピーしました！";
    setTimeout(() => { button.textContent = original; }, 1500);
  }

  function updateUnread() {
    const badge = $("#vs-chat-unread");
    if (!badge) return;
    badge.hidden = unreadChat <= 0;
    badge.textContent = unreadChat > 99 ? "99+" : String(unreadChat);
  }

  function openChat() {
    if (!Versus.Room.code) return;
    $("#vs-chat-panel")?.classList.add("open");
    $("#vs-chat-panel")?.setAttribute("aria-hidden", "false");
    $("#vs-chat-toggle")?.setAttribute("aria-expanded", "true");
    unreadChat = 0;
    updateUnread();
    renderChat(Versus.getMessages());
    setTimeout(() => $("#vs-chat-input")?.focus(), 0);
  }

  function closeChat() {
    $("#vs-chat-panel")?.classList.remove("open");
    $("#vs-chat-panel")?.setAttribute("aria-hidden", "true");
    $("#vs-chat-toggle")?.setAttribute("aria-expanded", "false");
  }

  function formatChatTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function renderChat(messages) {
    const box = $("#vs-chat-messages");
    if (!box) return;
    const list = Array.isArray(messages) ? messages : [];
    const newest = list.length ? String(list.at(-1).id) : null;
    if (lastChatMessageId !== null && newest !== lastChatMessageId && !$("#vs-chat-panel")?.classList.contains("open")) unreadChat += 1;
    lastChatMessageId = newest;
    updateUnread();
    if (!list.length) {
      box.innerHTML = '<p class="muted">メッセージはまだありません。<br>最初のあいさつを送ってみましょう！</p>';
      return;
    }
    box.innerHTML = list.map(message => {
      const mine = message.player_id === Versus.myId();
      return `<div class="vs-chat-message${mine ? " mine" : ""}"><div class="vs-chat-message-head">
        <b>${escapeHtml(message.player_name || "参加者")}</b><time>${escapeHtml(formatChatTime(message.created_at))}</time>
        ${mine ? "" : `<button class="vs-chat-report" type="button" data-message-id="${escapeHtml(message.id)}">通報</button>`}
      </div><div class="vs-chat-bubble">${escapeHtml(message.body)}</div></div>`;
    }).join("");
    box.querySelectorAll(".vs-chat-report").forEach(button => button.addEventListener("click", () => reportMessage(button.dataset.messageId)));
    box.scrollTop = box.scrollHeight;
  }

  async function reportMessage(messageId) {
    if (!confirm("このメッセージを不適切な内容として通報しますか？\n虚偽の通報はお控えください。")) return;
    const result = await Versus.reportChat(messageId, "不適切な内容");
    const message = $("#vs-chat-msg");
    if (message) {
      message.textContent = result.ok ? "通報を受け付けました。" : (result.message || "通報できませんでした。");
      message.className = `field-msg ${result.ok ? "ok" : "no"}`;
    }
  }

  async function sendChat(event) {
    event.preventDefault();
    const input = $("#vs-chat-input");
    const button = $("#vs-chat-send");
    const message = $("#vs-chat-msg");
    button.disabled = true;
    const result = await Versus.sendChat(input.value);
    button.disabled = false;
    if (result.ok) {
      input.value = "";
      if (message) { message.textContent = ""; message.className = "field-msg"; }
      input.focus();
    } else if (message) {
      message.textContent = result.message || "メッセージを送信できませんでした。";
      message.className = "field-msg no";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#btn-versus")?.addEventListener("click", openEntry);
    $("#vs-create-btn")?.addEventListener("click", doCreate);
    $("#vs-join-btn")?.addEventListener("click", () => doJoin());
    $("#vs-room-refresh")?.addEventListener("click", refreshPublicRooms);
    $("#vs-room-title")?.addEventListener("keydown", event => { if (event.key === "Enter") doCreate(); });
    window.addEventListener("pageshow", event => { if (event.persisted) Versus.retrack(); });
    Account.onChange?.(() => Versus.retrack());
    Versus.onPlayersChange(renderPlayers);
    Versus.onChatChange(renderChat);
    Versus.onHostChange(refreshRole);
    Versus.onRoomChange(() => {
      if (!document.body.classList.contains("vs-room-connected")) return;
      syncSettingsFromRoom();
      refreshRole();
    });
    Versus.onGameStart(config => window.VersusGame?.start(config));
    Versus.onState(snapshot => window.VersusGame?.applyState(snapshot));
    window.onVersusScoreUpdate = renderScoreboard;
    Versus.onPlayersChange(() => { if (window.VersusGame?.isVersus()) renderScoreboard(); });
    window.onVersusGameEnd = showResult;
    Versus.onBackToLobby(backToLobbyUI);
    $("#vs-again-btn")?.addEventListener("click", async () => {
      if (Versus.isHost()) await Versus.backToLobby(); else backToLobbyUI();
    });
    $("#vs-code-input")?.addEventListener("keydown", event => { if (event.key === "Enter") doJoin(); });
    $("#vs-code-input")?.addEventListener("input", event => {
      event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    });
    $("#vs-copy-link")?.addEventListener("click", copyLink);
    $("#vs-chat-toggle")?.addEventListener("click", openChat);
    $("#vs-chat-close")?.addEventListener("click", closeChat);
    $("#vs-chat-form")?.addEventListener("submit", sendChat);
    document.querySelectorAll(".vs-leave-btn").forEach(button => button.addEventListener("click", doLeave));
    $("#vs-entry-back")?.addEventListener("click", closeVersus);

    const roomCode = new URLSearchParams(location.search).get("room");
    if (roomCode) ensureAccountReady().then(() => doJoin(roomCode, true));
  });

  window.VersusUI = { openEntry, closeVersus };
})();
