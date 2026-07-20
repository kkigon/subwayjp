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

test("fresh Supabase schema includes rankings, social profiles, custom rooms, chat and server state", () => {
  const sql = read("supabase/schema.sql");
  for (const token of [
    "create table if not exists public.profiles",
    "create table if not exists public.plays",
    "all_time_ranking_by_duration",
    "create table if not exists public.rooms",
    "create table if not exists public.room_messages",
    "create table if not exists public.game_states",
    "create or replace function public.vs_claim",
    "create or replace function public.room_report_message",
  ]) assert.ok(sql.toLowerCase().includes(token), token);
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
  assert.match(read("js/supabase-config.js"), /custom:line/);
  assert.match(read("js/game.js"), /social-plugins\.line\.me\/lineit\/share/);
});

test("custom single-player records are excluded from the all-lines ranking", () => {
  assert.match(read("js/account-ui.js"), /mode !== "all"/);
});
