const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const root = path.join(__dirname, "..");
const context = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(root, "js/data.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(root, "js/japanese.js"), "utf8"), context);
const call = expression => vm.runInContext(expression, context);

test("answers accept kanji, hiragana, katakana, romaji, aliases and station numbers", () => {
  for (const input of ["東京", "東京駅", "とうきょう", "トウキョウ", "tokyo", "M17"]) {
    assert.equal(call(`matchesAnswer(${JSON.stringify(input)}, "東京")`), true, input);
  }
  assert.equal(call('matchesAnswer("shimbashi", "新橋")'), true);
  assert.equal(call('matchesAnswer("sinzyuku", "新宿")'), true);
  assert.equal(call('matchesAnswer("tōkyō", "東京")'), true);
  assert.equal(call('matchesAnswer("市ヶ谷", "市ケ谷")'), true);
  assert.equal(call('matchesAnswer("押上", "押上〈スカイツリー前〉")'), true);
  assert.equal(call('matchesAnswer("とう", "東京")'), false, "partial input must not count as an answer");
});

test("autocomplete ranks all supported writing systems", () => {
  assert.ok(call('searchScore("とうきょ", "東京")') > 0);
  assert.ok(call('searchScore("トウキョ", "東京")') > 0);
  assert.ok(call('searchScore("toky", "東京")') > 0);
  assert.ok(call('searchScore("M17", "東京")') > 0);
  assert.equal(call('searchScore("zzzz", "東京")'), -1);
});

test("hint reveals odd-position kana only", () => {
  assert.equal(call('kanaHint("東京")'), "と？き？う");
  assert.equal(call('kanaHint("新橋")'), "し？ば？");
});
