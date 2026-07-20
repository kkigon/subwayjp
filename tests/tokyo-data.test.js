const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const root = path.join(__dirname, "..");
const context = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(root, "js/data.js"), "utf8"), context);
const lines = vm.runInContext("LINES", context);
const meta = vm.runInContext("STATION_META", context);
vm.runInContext(fs.readFileSync(path.join(root, "js/layout.js"), "utf8"), context);

test("Tokyo edition contains exactly the 13 subway lines", () => {
  assert.deepEqual(Array.from(lines, line => line.id), ["G","M","H","T","C","Y","Z","N","F","A","I","S","E"]);
  assert.equal(lines.every(line => line.region === "tokyo"), true);
});

test("all 216 unique stations have kana, numbering and coordinates", () => {
  const stationNames = new Set(lines.flatMap(line => line.segments.flat()));
  assert.equal(stationNames.size, 216);
  for (const name of stationNames) {
    assert.ok(meta[name], `missing metadata: ${name}`);
    assert.ok(meta[name].kana, `missing kana: ${name}`);
    assert.ok(meta[name].numbers.length, `missing station number: ${name}`);
  }
  assert.deepEqual(Array.from(meta["東京"].numbers), ["M17"]);
  assert.ok(meta["大手町"].numbers.includes("M18"));
  assert.ok(meta["大手町"].numbers.includes("T09"));
  assert.ok(meta["市ケ谷"].aliases.includes("市ヶ谷"));
  assert.ok(meta["押上〈スカイツリー前〉"].aliases.includes("押上"));
});

test("the complete game network builds with finite map coordinates", () => {
  const summary = vm.runInContext(`(() => {
    const network = buildNetwork(LINES.map(line => line.id));
    return {
      stations: network.stations.size,
      quizStations: network.quizStations.size,
      edges: network.edges.length,
      finite: [...network.stations.values()].every(station => Number.isFinite(station.x) && Number.isFinite(station.y)),
    };
  })()`, context);
  assert.equal(summary.stations, 216);
  assert.equal(summary.quizStations, 216);
  assert.ok(summary.edges > 200);
  assert.equal(summary.finite, true);
});

test("Marunouchi branch and Oedo loop are represented as separate segments", () => {
  const marunouchi = lines.find(line => line.id === "M");
  assert.equal(marunouchi.segments.length, 2);
  assert.equal(marunouchi.segments[1][0], "中野坂上");
  assert.equal(marunouchi.segments[1].at(-1), "方南町");
  assert.deepEqual(Array.from(meta["方南町"].numbers), ["Mb03"]);

  const oedo = lines.find(line => line.id === "E");
  assert.equal(oedo.segments.length, 2);
  assert.equal(oedo.segments[0][0], "都庁前");
  assert.equal(oedo.segments[0].at(-1), "都庁前");
  assert.equal(oedo.segments[1][0], "都庁前");
  assert.equal(oedo.segments[1].at(-1), "光が丘");
});
