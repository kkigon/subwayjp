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
const anchors = vm.runInContext("ANCHORS", context);
vm.runInContext(fs.readFileSync(path.join(root, "js/layout.js"), "utf8"), context);

test("Tokyo edition contains exactly the 13 subway lines", () => {
  assert.deepEqual(Array.from(lines, line => line.id), ["G","M","H","T","C","Y","Z","N","F","A","I","S","E"]);
  assert.equal(lines.every(line => line.region === "tokyo"), true);
});

test("all 216 unique stations have kana and numbering", () => {
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

test("schematic layout uses long octilinear route sections", () => {
  const stationNames = new Set(lines.flatMap(line => line.segments.flat()));
  assert.ok(Object.keys(anchors).length >= 60);
  assert.ok(Object.keys(anchors).length < stationNames.size);
  const summary = vm.runInContext(`(() => {
    const network = buildNetwork(LINES.map(line => line.id));
    const octilinear = network.edges.every(edge => {
      const points = [[edge.ax, edge.ay], ...(edge.via || []), [edge.bx, edge.by]];
      return points.slice(1).every((point, index) => {
        const previous = points[index];
        const dx = Math.abs(point[0] - previous[0]);
        const dy = Math.abs(point[1] - previous[1]);
        return dx < 0.001 || dy < 0.001 || Math.abs(dx - dy) < 0.001;
      });
    });
    const bentEdges = network.edges.filter(edge => edge.via?.length).length;
    const stationDistances = network.edges.map(edge => Math.hypot(edge.bx - edge.ax, edge.by - edge.ay));
    return {
      octilinear,
      bentEdgeRatio: bentEdges / network.edges.length,
      minimumStationDistance: Math.min(...stationDistances),
      averageStationDistance: stationDistances.reduce((sum, value) => sum + value, 0) / stationDistances.length,
    };
  })()`, context);
  assert.equal(summary.octilinear, true);
  assert.ok(summary.bentEdgeRatio < 0.18);
  assert.ok(summary.minimumStationDistance >= 45);
  assert.ok(summary.averageStationDistance >= 45);
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
