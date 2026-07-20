const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("Japanese UI keeps Tokyo scope, adds custom selection and has no Korean/reverse controls", () => {
  const html = read("index.html");
  assert.match(html, /lang="ja"/);
  assert.match(html, /サブウェイ・ゲッサー/);
  assert.match(html, /全13路線・216駅/);
  assert.doesNotMatch(html, /[가-힣]/);
  assert.match(html, /カスタム|id="custom-lines"|id="vs-custom-lines"/);
  assert.doesNotMatch(html, /reverse|거꾸로|地域を選択/i);
  assert.match(html, /js\/account-ui\.js/);
});

test("runtime supports Tokyo all/custom and preserves 60/120/300 modes", () => {
  const game = read("js/game.js");
  const versus = read("js/versus.js");
  assert.match(game, /region: "tokyo"/);
  assert.match(game, /mode === "custom"/);
  assert.match(game, /resolveLineIds\(_region, mode, customLines\)/);
  assert.match(versus, /p_custom_lines:/);
  assert.doesNotMatch(game + versus, /playMode\s*===\s*"reverse"|"seoul"|"nationwide"/);
  assert.match(versus, /const GAME_DURATIONS = \[60, 120, 300\]/);
  assert.match(versus, /p_region: "tokyo"/);
});

test("shared Supabase schema isolates all Japan data and RPCs behind jp_ names", () => {
  const sql = read("supabase/schema.sql");
  for (const token of [
    "create table if not exists public.jp_profiles",
    "create table if not exists public.jp_plays",
    "jp_all_time_ranking_by_duration",
    "create table if not exists public.jp_rooms",
    "create table if not exists public.jp_room_messages",
    "create table if not exists public.jp_game_states",
    "create or replace function public.jp_vs_claim",
    "create or replace function public.jp_room_report_message",
  ]) assert.ok(sql.toLowerCase().includes(token), token);
  assert.doesNotMatch(sql, /(?:create|alter|insert into|update|delete from)\s+(?:table\s+(?:if not exists\s+)?)?public\.(?:profiles|plays|rooms|room_messages|room_message_reports|game_states)\b/i);
  assert.doesNotMatch(sql, /function\s+public\.(?:room_|vs_|all_time_ranking_by_duration)/i);
  assert.match(sql, /duration_sec in \(60,120,300\)|duration_sec in \(60, 120, 300\)/);
  assert.match(sql, /p_limit integer default 100/);
  assert.match(sql, /mode in \('all', 'custom'\)/);
  assert.match(sql, /invalid custom lines/);
  assert.match(sql, /not between 1 and 13/);
  assert.doesNotMatch(sql, /interval\s+'7 days'|date_trunc\s*\(\s*'week'/i);
  assert.doesNotMatch(sql, /'reverse'|'seoul'|'busan'|'nationwide'/);
});

test("Google and LINE login coexist and LINE share uses the supported endpoint", () => {
  const backend = read("js/backend.js");
  const accountUi = read("js/account-ui.js");
  assert.match(backend, /provider:\s*"google"/);
  assert.match(backend, /provider:.*LINE_AUTH_PROVIDER/);
  assert.match(accountUi, /signInWithGoogle/);
  assert.match(accountUi, /signInWithLine/);
  const config = read("js/supabase-config.js");
  assert.match(config, /zsamoefsfjkhqiinwepu\.supabase\.co/);
  assert.match(config, /custom:line/);
  assert.match(read("js/game.js"), /social-plugins\.line\.me\/lineit\/share/);
});

test("frontend only reads and mutates Japan-prefixed database objects", () => {
  const backend = read("js/backend.js");
  const versus = read("js/versus.js");
  for (const token of ["jp_profiles", "jp_plays", "jp_rooms", "jp_all_time_ranking_by_duration"]) {
    assert.ok((backend + versus).includes(token), token);
  }
  assert.match(versus, /table: "jp_rooms"/);
  assert.match(versus, /table: "jp_game_states"/);
  assert.match(versus, /rpc\("jp_room_/);
  assert.match(versus, /rpc\("jp_vs_/);
  assert.doesNotMatch(backend, /\.from\("(?:profiles|plays|rooms)"\)/);
  assert.doesNotMatch(versus, /rpc\("(?:room_|vs_)/);
});

test("custom single-player records are excluded from the all-lines ranking", () => {
  assert.match(read("js/account-ui.js"), /mode !== "all"/);
});
