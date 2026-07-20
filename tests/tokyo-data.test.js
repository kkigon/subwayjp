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
    const octilinearEdges = network.edges.filter(edge => {
      const points = [[edge.ax, edge.ay], ...(edge.via || []), [edge.bx, edge.by]];
      return points.slice(1).every((point, index) => {
        const previous = points[index];
        const dx = Math.abs(point[0] - previous[0]);
        const dy = Math.abs(point[1] - previous[1]);
        return dx < 0.001 || dy < 0.001 || Math.abs(dx - dy) < 0.001;
      });
    }).length;
    const bentEdges = network.edges.filter(edge => edge.via?.length).length;
    const stationDistances = network.edges.map(edge => Math.hypot(edge.bx - edge.ax, edge.by - edge.ay));
    return {
      octilinearRatio: octilinearEdges / network.edges.length,
      bentEdgeRatio: bentEdges / network.edges.length,
      minimumStationDistance: Math.min(...stationDistances),
      averageStationDistance: stationDistances.reduce((sum, value) => sum + value, 0) / stationDistances.length,
    };
  })()`, context);
  assert.ok(summary.octilinearRatio > 0.99);
  assert.ok(summary.bentEdgeRatio < 0.28);
  assert.ok(summary.minimumStationDistance >= 45);
  assert.ok(summary.averageStationDistance >= 45);
});

test("non-transfer stations and unrelated route sections never overlap", () => {
  const summary = vm.runInContext(`(() => {
    const network = buildNetwork(LINES.map(line => line.id));
    const edgeByPair = new Map(network.edges.map(edge => [
      [edge.from, edge.to].sort().join("||"), edge
    ]));
    const pieces = [];
    for (const line of LINES) {
      for (const segment of line.segments) {
        for (let i = 0; i < segment.length - 1; i++) {
          const from = segment[i], to = segment[i + 1];
          const key = [from, to].sort().join("||");
          const edge = edgeByPair.get(key);
          let points = [[edge.ax, edge.ay], ...(edge.via || []), [edge.bx, edge.by]];
          if (edge.from !== from) points = points.reverse();
          for (let p = 0; p < points.length - 1; p++) {
            pieces.push({ line: line.id, key, a: points[p], b: points[p + 1] });
          }
        }
      }
    }

    const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
    const pointOnPiece = (point, piece) => {
      const dx = piece.b[0] - piece.a[0], dy = piece.b[1] - piece.a[1];
      const lengthSquared = dx * dx + dy * dy;
      const t = ((point[0] - piece.a[0]) * dx + (point[1] - piece.a[1]) * dy) / lengthSquared;
      const x = piece.a[0] + t * dx, y = piece.a[1] + t * dy;
      return t > 0.02 && t < 0.98 && Math.hypot(point[0] - x, point[1] - y) < 0.5;
    };
    const collinearOverlap = (a, b) => {
      const u = [a.b[0] - a.a[0], a.b[1] - a.a[1]];
      const v = [b.b[0] - b.a[0], b.b[1] - b.a[1]];
      if (Math.abs(cross(u, v)) > 0.01 ||
          Math.abs(cross(u, [b.a[0] - a.a[0], b.a[1] - a.a[1]])) > 0.01) return 0;
      const length = Math.hypot(...u);
      const direction = [u[0] / length, u[1] / length];
      const first = [0, length];
      const second = [
        (b.a[0] - a.a[0]) * direction[0] + (b.a[1] - a.a[1]) * direction[1],
        (b.b[0] - a.a[0]) * direction[0] + (b.b[1] - a.a[1]) * direction[1],
      ];
      return Math.max(0,
        Math.min(Math.max(...first), Math.max(...second)) -
        Math.max(Math.min(...first), Math.min(...second))
      );
    };

    let stationHits = 0;
    for (const station of network.stations.values()) {
      for (const piece of pieces) {
        if (!station.lines.includes(piece.line) && pointOnPiece([station.x, station.y], piece)) {
          stationHits++;
        }
      }
    }

    let unrelatedOverlaps = 0;
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        if (pieces[i].line === pieces[j].line || pieces[i].key === pieces[j].key) continue;
        if (collinearOverlap(pieces[i], pieces[j]) > 8) unrelatedOverlaps++;
      }
    }
    return { stationHits, unrelatedOverlaps };
  })()`, context);

  assert.equal(summary.stationHits, 0);
  assert.equal(summary.unrelatedOverlaps, 0);
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
