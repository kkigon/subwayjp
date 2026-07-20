const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("Japanese UI has a fixed Tokyo scope and no Korean/reverse controls", () => {
  const html = read("index.html");
  assert.match(html, /lang="ja"/);
  assert.match(html, /サブウェイ・ゲッサー/);
  assert.match(html, /全13路線・216駅/);
  assert.doesNotMatch(html, /[가-힣]/);
  assert.doesNotMatch(html, /reverse|거꾸로|地域を選択|カスタム/i);
  assert.match(html, /LINEでログイン|js\/account-ui\.js/);
});

test("runtime fixes Tokyo/all/timed and preserves 60/120/300 modes", () => {
  const game = read("js/game.js");
  const versus = read("js/versus.js");
  assert.match(game, /region: "tokyo"/);
  assert.match(game, /resolveLineIds\(\) \{ return LINES\.map/);
  assert.doesNotMatch(game + versus, /playMode\s*===\s*"reverse"|"seoul"|"nationwide"/);
  assert.match(versus, /const GAME_DURATIONS = \[60, 120, 300\]/);
  assert.match(versus, /p_region: "tokyo"/);
});

test("fresh Supabase schema includes rankings, LINE profiles, rooms, chat and server state", () => {
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
  assert.doesNotMatch(sql, /interval\s+'7 days'|date_trunc\s*\(\s*'week'/i);
  assert.doesNotMatch(sql, /'reverse'|'seoul'|'busan'|'nationwide'/);
});

test("LINE login and share use the supported endpoints", () => {
  assert.match(read("js/backend.js"), /provider:.*LINE_AUTH_PROVIDER/);
  assert.match(read("js/supabase-config.js"), /custom:line/);
  assert.match(read("js/game.js"), /social-plugins\.line\.me\/lineit\/share/);
});
