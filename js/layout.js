/* ============================================================
   路線図レイアウト
   - 主要駅を共有グリッドに固定し、その間を補間
   - 同じキーの駅は全路線で同じ座標を共有
   - 主要駅間は長い水平・垂直・45度区間として配置
   ============================================================ */

function stationDisplayName(key) {
  return DISPLAY_NAME[key] || key;
}

/* ------------------------------------------------------------
   구간 우회 경로(ROUTE_VIA)
   특정 두 역 사이 구간을, 직선이 아니라 지정한 중간점들을 거쳐
   곡선으로 그리고 싶을 때 사용한다.
   - 예: GTX-A의 대곡~연신내 구간은 3호선과 같은 높이(y=530)라
     직선으로 그리면 완전히 겹친다. 살짝 위로 띄워 우회시킨다.
   - 키는 "정렬된키A||정렬된키B", from은 points가 향하는 시작 역.
   - lines를 지정하면 그 노선이 포함된 구간에만 적용.
   ------------------------------------------------------------ */
const ROUTE_VIA = {
  // 同じ乗換駅から別方向へ向かう路線が重なる区間を、短く平行移動させる。
  "国会議事堂前||赤坂見附": { from: "赤坂見附", lines: ["M"], offset: -18 },
  "永田町||麹町": { from: "永田町", lines: ["Y"], offset: -18 },
  "三越前||水天宮前": { from: "三越前", lines: ["Z"], offset: -18 },
  "大手町||竹橋": { from: "大手町", lines: ["T"], offset: -18 },
  "内幸町||日比谷": { from: "日比谷", lines: ["I"], offset: 18 },
  "大手町||日比谷": {
    from: "大手町", lines: ["I"], points: [[1384, 872], [1256, 1016], [1256, 1088]]
  },
  "江戸川橋||飯田橋": { from: "飯田橋", lines: ["Y"], offset: 18 },
  "九段下||市ケ谷": { from: "九段下", lines: ["S"], offset: -18 },
  "四ツ谷||市ケ谷": { from: "市ケ谷", lines: ["N"], offset: -18 },
  "三田||白金高輪": { from: "三田", lines: ["I"], offset: 18 },
  "新宿三丁目||曙橋": { from: "新宿三丁目", lines: ["S"], offset: -18 },
  "表参道||青山一丁目": { from: "表参道", lines: ["Z"], offset: 18 },
  "日比谷||銀座": { from: "日比谷", lines: ["H"], offset: -18 },
  "大手町||新御茶ノ水": { from: "大手町", lines: ["C"], offset: 18 },
  "二重橋前〈丸の内〉||大手町": { from: "大手町", lines: ["C"], offset: 26 },
  "二重橋前〈丸の内〉||日比谷": {
    from: "日比谷", lines: ["C"], points: [[1280, 1060], [1344, 996]]
  },
  "有楽町||桜田門": { from: "桜田門", lines: ["Y"], offset: -18 },
  "明治神宮前〈原宿〉||渋谷": { from: "渋谷", lines: ["F"], offset: -18 },
  "内幸町||御成門": { from: "内幸町", lines: ["I"], offset: -18 },
  "東池袋||池袋": { from: "池袋", lines: ["Y"], offset: 14 },
  "春日||飯田橋": { from: "飯田橋", lines: ["E"], offset: 18 },

  // 非乗換駅の点が他路線上に載る箇所では、駅を持たない側の線だけを避ける。
  "根津||湯島": { from: "根津", lines: ["C"], offset: 18 },
  "上野広小路||末広町": { from: "上野広小路", lines: ["G"], offset: -18 },
  "上野御徒町||本郷三丁目": { from: "本郷三丁目", lines: ["E"], offset: -18 },
  "京橋||銀座": { from: "銀座", lines: ["G"], offset: 18 },
  "宝町||日本橋": { from: "日本橋", lines: ["A"], offset: -18 },
  "人形町||日本橋": { from: "日本橋", lines: ["A"], offset: 18 },
  "人形町||茅場町": { from: "人形町", lines: ["H"], offset: -18 },
  "日本橋||茅場町": { from: "日本橋", lines: ["T"], offset: -18 },
  "茅場町||門前仲町": { from: "茅場町", lines: ["T"], offset: 18 },
  "新富町||銀座一丁目": { from: "銀座一丁目", lines: ["Y"], offset: 18 },
  "小川町||岩本町": { from: "小川町", lines: ["S"], offset: -18 },
  "宝町||東銀座": { from: "東銀座", lines: ["A"], offset: 18 },
  "新橋||東銀座": { from: "東銀座", lines: ["A"], offset: -18 },
  "東銀座||銀座": { from: "銀座", lines: ["H"], offset: 18 },
  "後楽園||本郷三丁目": { from: "後楽園", lines: ["M"], offset: -18 },
};

function cross2d(a, b) {
  return a[0] * b[1] - a[1] * b[0];
}

function offsetRoutePoints(points, offset) {
  const clean = points.filter((p, i) =>
    i === 0 || Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) > 0.5
  );
  if (clean.length < 2) return clean;

  const directions = clean.slice(1).map((point, i) => {
    const dx = point[0] - clean[i][0], dy = point[1] - clean[i][1];
    const length = Math.hypot(dx, dy) || 1;
    return [dx / length, dy / length];
  });
  const normals = directions.map(([dx, dy]) => [-dy, dx]);
  const last = clean.length - 1;
  const entry = Math.abs(offset);
  const result = [clean[0]];
  result.push([
    clean[0][0] + directions[0][0] * entry + normals[0][0] * offset,
    clean[0][1] + directions[0][1] * entry + normals[0][1] * offset,
  ]);

  for (let i = 1; i < clean.length - 1; i++) {
    const before = [clean[i][0] + normals[i - 1][0] * offset, clean[i][1] + normals[i - 1][1] * offset];
    const after = [clean[i][0] + normals[i][0] * offset, clean[i][1] + normals[i][1] * offset];
    const denominator = cross2d(directions[i - 1], directions[i]);
    if (Math.abs(denominator) < 0.001) {
      result.push([(before[0] + after[0]) / 2, (before[1] + after[1]) / 2]);
    } else {
      const delta = [after[0] - before[0], after[1] - before[1]];
      const t = cross2d(delta, directions[i]) / denominator;
      result.push([before[0] + directions[i - 1][0] * t, before[1] + directions[i - 1][1] * t]);
    }
  }

  result.push([
    clean[last][0] - directions.at(-1)[0] * entry + normals.at(-1)[0] * offset,
    clean[last][1] - directions.at(-1)[1] * entry + normals.at(-1)[1] * offset,
  ]);
  result.push(clean[last]);
  return result;
}

function octilinearBend(a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (adx < 0.5 || ady < 0.5 || Math.abs(adx - ady) < 0.5) return null;
  const sx = Math.sign(dx), sy = Math.sign(dy);
  return adx > ady
    ? [a[0] + sx * (adx - ady), a[1]]
    : [a[0], a[1] + sy * (ady - adx)];
}

function pointOnSegment(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// 主要駅同士を駅ごとの細かい折れ線にせず、区間全体で最大1回だけ曲げる。
// 中間駅があれば曲がり角をその駅に割り当て、長い0/45/90度の線を作る。
function layoutAnchorSpan(pts, keys, i0, i1, edgeVias) {
  const p0 = pts[i0], p1 = pts[i1];
  const intervals = i1 - i0;
  const bend = octilinearBend(p0, p1);

  if (!bend) {
    for (let i = i0 + 1; i < i1; i++) {
      pts[i] = pointOnSegment(p0, p1, (i - i0) / intervals);
    }
    return;
  }

  if (intervals === 1) {
    const edgeKey = [keys[i0], keys[i1]].sort().join("||");
    edgeVias.set(edgeKey, { from: keys[i0], points: [bend] });
    return;
  }

  const firstLength = Math.hypot(bend[0] - p0[0], bend[1] - p0[1]);
  const secondLength = Math.hypot(p1[0] - bend[0], p1[1] - bend[1]);
  const bendOffset = Math.max(1, Math.min(
    intervals - 1,
    Math.round(intervals * firstLength / (firstLength + secondLength))
  ));
  pts[i0 + bendOffset] = bend;

  for (let offset = 1; offset < bendOffset; offset++) {
    pts[i0 + offset] = pointOnSegment(p0, bend, offset / bendOffset);
  }
  for (let offset = bendOffset + 1; offset < intervals; offset++) {
    pts[i0 + offset] = pointOnSegment(
      bend,
      p1,
      (offset - bendOffset) / (intervals - bendOffset)
    );
  }
}

// 한 세그먼트(역 키 배열)의 좌표 배열 계산
function layoutSegment(keys) {
  const pts = new Array(keys.length).fill(null);
  const edgeVias = new Map();
  keys.forEach((k, i) => { if (ANCHORS[k]) pts[i] = [...ANCHORS[k]]; });

  const anchorIdx = [];
  pts.forEach((p, i) => { if (p) anchorIdx.push(i); });

  if (anchorIdx.length === 0) {
    // 앵커가 전혀 없으면 (이론상 없음) 한 줄로 나열
    return { points: keys.map((_, i) => [100 + i * 56, 100]), edgeVias };
  }

  // 첫 앵커 이전 구간: 첫 두 앵커 방향으로 역방향 외삽
  const first = anchorIdx[0];
  if (first > 0) {
    const a = pts[anchorIdx[0]];
    const b = pts[anchorIdx[1] ?? anchorIdx[0]] || a;
    const dx = (b[0] - a[0]) || 20, dy = (b[1] - a[1]) || 0;
    for (let i = 0; i < first; i++) {
      const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
      const d = (first - i) * 56;
      pts[i] = [a[0] - Math.cos(angle) * d, a[1] - Math.sin(angle) * d];
    }
  }
  // 마지막 앵커 이후 구간: 외삽
  const last = anchorIdx[anchorIdx.length - 1];
  if (last < keys.length - 1) {
    const a = pts[last];
    const b = pts[anchorIdx[anchorIdx.length - 2] ?? last] || a;
    const dx = (a[0] - b[0]) || 20, dy = (a[1] - b[1]) || 0;
    for (let i = last + 1; i < keys.length; i++) {
      const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
      const d = (i - last) * 56;
      pts[i] = [a[0] + Math.cos(angle) * d, a[1] + Math.sin(angle) * d];
    }
  }
  // 앵커 사이 보간
  for (let a = 0; a < anchorIdx.length - 1; a++) {
    const i0 = anchorIdx[a], i1 = anchorIdx[a + 1];
    layoutAnchorSpan(pts, keys, i0, i1, edgeVias);
  }
  return { points: pts, edgeVias };
}

/**
 * 선택된 노선들로 네트워크 구성
 * @returns {
 *   stations: Map<key, {key, name, x, y, lines: lineId[]}>,
 *   paths: [{line, points: [[x,y],...]}],
 *   bounds: {minX, minY, maxX, maxY}
 * }
 */


function buildNetwork(lineIds, options = {}) {
  const stations = new Map();
  const paths = [];
  const autoRouteVia = new Map();

  // lineIds: 실제 게임 출제 대상 노선
  // displayLineIds: 화면에 표시할 노선
  // 지정하지 않으면 기존처럼 lineIds만 표시
  const activeSet = new Set(lineIds);
  const displayLineIds = options.displayLineIds || lineIds;
  const selected = LINES.filter(l => displayLineIds.includes(l.id));

  for (const line of selected) {
    const isActiveLine = activeSet.has(line.id);

    for (const seg of line.segments) {
      const layout = layoutSegment(seg);
      const pts = layout.points;
      for (const [key, route] of layout.edgeVias) autoRouteVia.set(key, route);
      // 노선은 항상 원래 색으로 그릴 것이므로 active 정보는 필요 없음
      paths.push({ line, points: pts });

      seg.forEach((key, i) => {
        if (!stations.has(key)) {
          const meta = typeof STATION_META !== "undefined" ? STATION_META[key] : null;
          stations.set(key, {
            key,
            name: stationDisplayName(key),
            kana: meta?.kana || "",
            numbers: meta?.numbers || [],
            aliases: meta?.aliases || [],
            x: pts[i][0],
            y: pts[i][1],
            lines: [],
            activeLines: []
          });
        }

        const st = stations.get(key);

        // 화면 표시용 전체 노선 정보
        if (!st.lines.includes(line.id)) {
          st.lines.push(line.id);
        }

        // 실제 문제 출제 대상 노선 정보
        if (isActiveLine && !st.activeLines.includes(line.id)) {
          st.activeLines.push(line.id);
        }
      });
    }
  }

  // 문제 출제용 역 목록: 선택한 노선에 포함된 역만
  const quizStations = new Map(
    [...stations.entries()].filter(([, st]) => st.activeLines.length > 0)
  );

  // ---- 구간(edge)별 노선 목록 집계 ----
  // 같은 두 역을 잇는 구간을 여러 노선이 공유하면(예: 4호선·수인분당선 안산~오이도),
  // 한 구간에 두 노선 색을 나란히 그리기 위해 edge 단위로 모은다.
  const edgeMap = new Map(); // "keyA||keyB" -> { ax, ay, bx, by, lines: [lineId,...] }
  for (const line of selected) {
    for (const seg of line.segments) {
      for (let i = 0; i < seg.length - 1; i++) {
        const a = seg[i], b = seg[i + 1];
        const sa = stations.get(a), sb = stations.get(b);
        if (!sa || !sb) continue;
        const k = [a, b].sort().join("||");
        if (!edgeMap.has(k)) {
          edgeMap.set(k, {
            from: a, to: b,
            ax: sa.x, ay: sa.y, bx: sb.x, by: sb.y, lines: []
          });
        }
        const e = edgeMap.get(k);
        if (!e.lines.includes(line.id)) e.lines.push(line.id);
      }
    }
  }
  // 표시 순서를 일정하게 (노선 정의 순서 따라)
  const lineOrder = new Map(LINES.map((l, i) => [l.id, i]));
  const edges = [...edgeMap.entries()].map(([k, e]) => {
    const out = {
      ...e,
      lines: e.lines.slice().sort((x, y) => lineOrder.get(x) - lineOrder.get(y))
    };
    // 특정 구간은 곡선 우회 경로(via)를 부여해 다른 노선과 겹치지 않게 한다.
    const manualRoute = ROUTE_VIA[k];
    const automaticRoute = autoRouteVia.get(k);
    let route = manualRoute || automaticRoute;
    if (manualRoute?.offset) {
      const forward = manualRoute.from === out.from;
      const start = forward ? [out.ax, out.ay] : [out.bx, out.by];
      const end = forward ? [out.bx, out.by] : [out.ax, out.ay];
      let automaticPoints = automaticRoute?.points?.map(point => [...point]) || [];
      if (automaticRoute && automaticRoute.from !== manualRoute.from) automaticPoints.reverse();
      const detour = offsetRoutePoints([start, ...automaticPoints, end], manualRoute.offset);
      route = { ...manualRoute, points: detour.slice(1, -1) };
    }
    if (route && options.regionLayout !== "nationwide") {
      // route.lines가 있으면 해당 노선이 이 구간에 포함될 때만 적용
      const applies = !route.lines || route.lines.some(id => out.lines.includes(id));
      if (applies) {
        const forward = route.from === out.from;
        out.via = forward ? route.points.map(p => [...p])
                          : route.points.map(p => [...p]).reverse();
      }
    }
    return out;
  });

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const st of stations.values()) {
    minX = Math.min(minX, st.x);
    maxX = Math.max(maxX, st.x);
    minY = Math.min(minY, st.y);
    maxY = Math.max(maxY, st.y);
  }

  return {
    stations,
    quizStations,
    paths,
    edges,
    bounds: { minX, minY, maxX, maxY }
  };
}


// 전체 데이터셋 기준, 역 키 → 소속 노선 전부 (환승 표시용)
const ALL_STATION_LINES = (() => {
  const map = new Map();
  for (const line of LINES) {
    for (const seg of line.segments) {
      for (const key of seg) {
        if (!map.has(key)) map.set(key, []);
        const arr = map.get(key);
        if (!arr.includes(line.id)) arr.push(line.id);
      }
    }
  }
  return map;
})();

function lineById(id) {
  return LINES.find(l => l.id === id);
}
