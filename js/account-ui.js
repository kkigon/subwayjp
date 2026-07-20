/* ============================================================
   LINEログイン・プロフィール・ランキングUI
   ============================================================ */

(() => {
  const $ = selector => document.querySelector(selector);
  const escapeHtml = value => String(value || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);

  function lineColor(id) { return lineById(id)?.color || "#149B5F"; }
  function lineDarkText(id) { return !!lineById(id)?.darkText; }

  function renderAccountButton() {
    const wrap = $("#account-area");
    if (!wrap) return;
    wrap.innerHTML = "";

    if (!Account.isLoggedIn()) {
      const button = document.createElement("button");
      button.className = "account-btn login line-login";
      button.type = "button";
      button.textContent = "LINEでログイン";
      button.addEventListener("click", async () => {
        if (!Account.isConfigured()) {
          if (typeof toast === "function") toast("LINEログインは現在準備中です。");
          return;
        }
        await Account.signInWithLine();
      });
      wrap.appendChild(button);
      return;
    }

    if (!Account.hasProfile()) {
      openProfileSetup();
      return;
    }

    const profile = Account.getProfile();
    const tag = document.createElement("button");
    tag.type = "button";
    tag.className = "nick-tag";
    tag.style.setProperty("--theme", lineColor(profile.theme_line));
    tag.innerHTML = `<span class="nick-dot"></span><span class="nick-text">${escapeHtml(profile.nickname)}</span>`;
    tag.title = "マイページを開く";
    tag.addEventListener("click", openMyPage);
    wrap.appendChild(tag);
  }

  function nickTagHTML(nickname, themeLine) {
    return `<span class="nick-tag static" style="--theme:${lineColor(themeLine)}">
      <span class="nick-dot"></span><span class="nick-text">${escapeHtml(nickname)}</span>
    </span>`;
  }

  function buildThemePicker(container, selectedId, onPick) {
    if (!container) return;
    container.innerHTML = "";
    for (const line of LINES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "theme-swatch" + (line.id === selectedId ? " selected" : "");
      button.style.setProperty("--c", line.color);
      button.style.setProperty("--t", line.darkText ? "#23262b" : "#fff");
      button.innerHTML = `<span class="theme-badge">${line.badge}</span><span class="theme-name">${line.name}</span>`;
      button.addEventListener("click", () => {
        container.querySelectorAll(".theme-swatch").forEach(item => item.classList.remove("selected"));
        button.classList.add("selected");
        onPick(line.id);
      });
      container.appendChild(button);
    }
  }

  function openProfileSetup() {
    if ($("#profile-modal")?.classList.contains("show")) return;
    let chosenTheme = "G";
    const input = $("#profile-nick");
    const error = $("#profile-error");
    input.value = "";
    error.textContent = "";
    buildThemePicker($("#profile-theme-grid"), chosenTheme, id => { chosenTheme = id; });

    $("#profile-save").onclick = async event => {
      const button = event.currentTarget;
      button.disabled = true;
      error.textContent = "";
      const result = await Account.createProfile(input.value, chosenTheme);
      button.disabled = false;
      if (result.ok) { closeModal("#profile-modal"); renderAccountButton(); }
      else error.textContent = result.message || "エラーが発生しました。";
    };
    $("#profile-cancel").onclick = async () => {
      await Account.signOut();
      closeModal("#profile-modal");
    };
    openModal("#profile-modal");
    input.focus();
  }

  async function openMyPage() {
    const profile = Account.getProfile();
    if (!profile) return;
    openModal("#mypage-modal");
    $("#mypage-nicktag").innerHTML = nickTagHTML(profile.nickname, profile.theme_line);
    $("#mypage-email").textContent = Account.getEmail() || "LINEアカウント";

    let chosen = profile.theme_line;
    buildThemePicker($("#mypage-theme-grid"), chosen, async id => {
      chosen = id;
      if (await Account.updateThemeLine(id)) {
        $("#mypage-nicktag").innerHTML = nickTagHTML(profile.nickname, id);
        renderAccountButton();
      }
    });

    const nickInput = $("#mypage-nick");
    nickInput.value = profile.nickname;
    $("#mypage-nick-save").onclick = async () => {
      const result = await Account.updateNickname(nickInput.value);
      const message = $("#mypage-nick-msg");
      message.textContent = result.ok ? "変更しました。" : result.message;
      message.className = `field-msg ${result.ok ? "ok" : "no"}`;
      if (result.ok) {
        $("#mypage-nicktag").innerHTML = nickTagHTML(nickInput.value.trim(), chosen);
        renderAccountButton();
      }
    };

    const best = await Account.myBest();
    const durations = [60, 120, 300];
    $("#mypage-best").innerHTML = durations
      .filter(duration => best[`tokyo:all:${duration}`] !== undefined)
      .map(duration => `<div class="best-card"><span class="best-mode">東京・${duration}秒</span><span class="best-score">${best[`tokyo:all:${duration}`]}</span><span class="best-unit">駅</span></div>`)
      .join("") || `<p class="muted">記録はまだありません。タイムアタックに挑戦しましょう！</p>`;

    const plays = await Account.myPlays(50);
    $("#mypage-plays").innerHTML = plays.length ? plays.map(play => {
      const date = new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(play.created_at));
      return `<div class="play-row"><span class="play-score">${play.score}駅</span><span class="play-mode">${escapeHtml(play.mode_label)}</span><span class="play-date">${date}</span></div>`;
    }).join("") : `<p class="muted">タイムアタックの記録がここに表示されます。</p>`;

    $("#mypage-logout").onclick = async () => {
      await Account.signOut();
      closeModal("#mypage-modal");
      renderAccountButton();
    };
  }

  let rankDuration = 60;
  let rankLoadRevision = 0;

  function openRanking() {
    openModal("#ranking-modal");
    const duration = [60, 120, 300].includes(State?.gameDuration) ? State.gameDuration : 60;
    setRankDuration(duration);
  }

  function setRankDuration(duration) {
    rankDuration = duration;
    document.querySelectorAll(".rank-duration-tab").forEach(tab =>
      tab.classList.toggle("active", Number(tab.dataset.duration) === duration));
    loadRanking();
  }

  async function loadRanking() {
    const revision = ++rankLoadRevision;
    const body = $("#ranking-body");
    body.innerHTML = `<p class="muted">読み込み中…</p>`;
    if (!Account.isConfigured()) {
      body.innerHTML = `<p class="muted">ランキングは現在準備中です。</p>`;
      return;
    }
    const result = await Account.allTimeRanking("tokyo:all", rankDuration, 100);
    if (revision !== rankLoadRevision) return;
    if (result.error) {
      body.innerHTML = `<p class="muted">ランキングを読み込めませんでした。しばらくしてからお試しください。</p>`;
      return;
    }
    const rows = result.rows;
    const myId = Account.getProfile()?.id;
    if (!rows.length) {
      body.innerHTML = `<p class="muted">記録はまだありません。最初のランカーになろう！</p>`;
      return;
    }
    body.innerHTML = rows.map(row => {
      const placement = rankingPlacementBadge(row.rank, row.percentile_bonus);
      const achievement = scoreAchievement(row.adjusted_score);
      const rank = placement
        ? `<span class="rank-placement rank-placement--${placement.key}"><span aria-hidden="true">${placement.icon}</span><small>${placement.label}</small></span>`
        : `<span class="rank-num">${row.rank}位</span>`;
      const mine = myId && row.user_id === myId ? " mine" : "";
      const exceptional = achievement.key === "95" ? " score-exceptional" : "";
      return `<div class="rank-row${mine}${exceptional}">${rank}
        <span class="rank-nick">${nickTagHTML(row.nickname, row.theme_line)}</span>
        <span class="rank-score">
          <strong class="score-achievement score-achievement--${achievement.key}"><span aria-hidden="true">${achievement.icon}</span>${Number(row.adjusted_score).toFixed(1)}点</strong>
          <span class="score-tier-label">${achievement.label}</span>
          <small>${row.best_score}駅・記録 ${Number(row.record_points).toFixed(1)} + パーセンタイル ${Number(row.percentile_bonus).toFixed(1)}</small>
        </span></div>`;
    }).join("");
  }

  function openModal(selector) {
    $(selector)?.classList.add("show");
    document.body.classList.add("modal-open");
  }
  function closeModal(selector) {
    $(selector)?.classList.remove("show");
    if (!document.querySelector(".modal-backdrop.show")) document.body.classList.remove("modal-open");
  }

  window.onPlayFinished = async ({ score, playMode, duration, theoreticalMax }) => {
    if (playMode !== "timed" || !Account.isLoggedIn() || !Account.hasProfile()) return;
    await Account.savePlay({
      score,
      modeLabel: `東京 地下鉄全13路線・${duration}秒`,
      duration,
      theoreticalMax,
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    $("#btn-ranking")?.addEventListener("click", openRanking);
    $("#btn-ranking-end")?.addEventListener("click", openRanking);
    document.querySelectorAll(".rank-duration-tab").forEach(tab =>
      tab.addEventListener("click", () => setRankDuration(Number(tab.dataset.duration))));
    document.querySelectorAll("[data-close-modal]").forEach(button =>
      button.addEventListener("click", () => closeModal(`#${button.dataset.closeModal}`)));
    document.querySelectorAll(".modal-backdrop").forEach(backdrop =>
      backdrop.addEventListener("click", event => { if (event.target === backdrop) closeModal(`#${backdrop.id}`); }));

    Account.onChange(renderAccountButton);
    Account.init().then(renderAccountButton);
  });

  window.AccountUI = { renderAccountButton, openRanking, openMyPage };
})();
