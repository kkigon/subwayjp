/*
 * 東京の地下鉄データ生成スクリプト
 *
 * 出典: Seo-4d696b75/station_database (CC BY 4.0)
 * https://github.com/Seo-4d696b75/station_database
 *
 * 路線名・駅ナンバリングは東京メトロ／東京都交通局の公式案内とも照合する。
 */

import { writeFile } from "node:fs/promises";

const SOURCE_ROOT = "https://raw.githubusercontent.com/Seo-4d696b75/station_database/main/out/main/line";
const LINE_SPECS = [
  { code: 28001, id: "G",  name: "銀座線",   badge: "G",  color: "#F39700", darkText: true,  operator: "東京メトロ" },
  { code: 28002, id: "M",  name: "丸ノ内線", badge: "M",  color: "#E60012", darkText: false, operator: "東京メトロ" },
  { code: 28003, id: "H",  name: "日比谷線", badge: "H",  color: "#9CAEB7", darkText: true,  operator: "東京メトロ" },
  { code: 28004, id: "T",  name: "東西線",   badge: "T",  color: "#00A7DB", darkText: false, operator: "東京メトロ" },
  { code: 28005, id: "C",  name: "千代田線", badge: "C",  color: "#009944", darkText: false, operator: "東京メトロ" },
  { code: 28006, id: "Y",  name: "有楽町線", badge: "Y",  color: "#D7C447", darkText: true,  operator: "東京メトロ" },
  { code: 28008, id: "Z",  name: "半蔵門線", badge: "Z",  color: "#8F76D6", darkText: false, operator: "東京メトロ" },
  { code: 28009, id: "N",  name: "南北線",   badge: "N",  color: "#00ADA9", darkText: false, operator: "東京メトロ" },
  { code: 28010, id: "F",  name: "副都心線", badge: "F",  color: "#9C5E31", darkText: false, operator: "東京メトロ" },
  { code: 99302, id: "A",  name: "浅草線",   badge: "A",  color: "#E85298", darkText: false, operator: "都営地下鉄" },
  { code: 99303, id: "I",  name: "三田線",   badge: "I",  color: "#0079C2", darkText: false, operator: "都営地下鉄" },
  { code: 99304, id: "S",  name: "新宿線",   badge: "S",  color: "#6CBB5A", darkText: true,  operator: "都営地下鉄" },
  { code: 99301, id: "E",  name: "大江戸線", badge: "E",  color: "#B6007A", darkText: false, operator: "都営地下鉄" },
];

const DISPLAY_OVERRIDES = {
  "四ツ谷(四ッ谷)": "四ツ谷",
  "市ケ谷(市ヶ谷)": "市ケ谷",
  "市ヶ谷": "市ケ谷",
  "二重橋前": "二重橋前〈丸の内〉",
  "押上": "押上〈スカイツリー前〉",
  "押上（スカイツリー前）": "押上〈スカイツリー前〉",
};

const EXTRA_ALIASES = {
  "四ツ谷": ["四ッ谷"],
  "市ケ谷": ["市ヶ谷"],
  "二重橋前〈丸の内〉": ["二重橋前"],
  "押上〈スカイツリー前〉": ["押上", "押上スカイツリー前"],
  "明治神宮前〈原宿〉": ["明治神宮前", "原宿"],
};

function canonicalName(raw) {
  return DISPLAY_OVERRIDES[raw] || raw;
}

function numberingOf(station, lineId) {
  const raw = (station.numbering || []).find(number => {
    if (lineId === "M" && /^\d{2}$/.test(number)) return true;
    return new RegExp(`^${lineId}\\d{2}$`, "i").test(number);
  });
  if (!raw) return "";
  if (lineId === "M" && /^\d{2}$/.test(raw)) return `Mb${raw}`;
  return raw.toUpperCase();
}

function compactStation(station, lineId) {
  const name = canonicalName(station.original_name || station.name);
  return {
    key: name,
    name,
    kana: station.name_kana,
    number: numberingOf(station, lineId),
    lat: Number(station.lat),
    lng: Number(station.lng),
  };
}

function segmentsFor(spec, stations) {
  if (spec.id === "M") {
    const main = stations.filter(station => /^M\d{2}$/.test(station.number));
    const branch = stations.filter(station => /^Mb\d{2}$/.test(station.number));
    const junction = main.find(station => station.key === "中野坂上");
    return [main, [junction, ...branch].filter(Boolean)];
  }
  if (spec.id === "E") {
    const byNumber = new Map(stations.map(station => [station.number, station]));
    const loop = [byNumber.get("E28")];
    for (let i = 1; i <= 27; i++) loop.push(byNumber.get(`E${String(i).padStart(2, "0")}`));
    loop.push(byNumber.get("E28"));
    const tail = [byNumber.get("E28")];
    for (let i = 29; i <= 38; i++) tail.push(byNumber.get(`E${i}`));
    return [loop.filter(Boolean), tail.filter(Boolean)];
  }
  return [stations];
}

const fetched = [];
for (const spec of LINE_SPECS) {
  const response = await fetch(`${SOURCE_ROOT}/${spec.code}.json`);
  if (!response.ok) throw new Error(`${spec.code}: HTTP ${response.status}`);
  const source = await response.json();
  fetched.push({ spec, stations: source.station_list.map(station => compactStation(station, spec.id)) });
}

const meta = new Map();
for (const { spec, stations } of fetched) {
  for (const station of stations) {
    const current = meta.get(station.key) || {
      name: station.name,
      kana: station.kana,
      aliases: [...(EXTRA_ALIASES[station.name] || [])],
      numbers: [],
      coordinates: [],
    };
    if (station.number && !current.numbers.includes(station.number)) current.numbers.push(station.number);
    current.coordinates.push([station.lng, station.lat]);
    current.operator ||= spec.operator;
    meta.set(station.key, current);
  }
}

const meanCoordinates = new Map();
for (const [key, station] of meta) {
  const count = station.coordinates.length;
  const lng = station.coordinates.reduce((sum, point) => sum + point[0], 0) / count;
  const lat = station.coordinates.reduce((sum, point) => sum + point[1], 0) / count;
  meanCoordinates.set(key, [lng, lat]);
  delete station.coordinates;
}

const allLng = [...meanCoordinates.values()].map(point => point[0]);
const allLat = [...meanCoordinates.values()].map(point => point[1]);
const minLng = Math.min(...allLng);
const maxLat = Math.max(...allLat);
const SCALE = 7200;
const anchors = Object.fromEntries([...meanCoordinates].map(([key, [lng, lat]]) => [
  key,
  [Math.round(140 + (lng - minLng) * SCALE), Math.round(140 + (maxLat - lat) * SCALE)],
]));

const lines = fetched.map(({ spec, stations }) => ({
  id: spec.id,
  name: spec.name,
  badge: spec.badge,
  color: spec.color,
  darkText: spec.darkText,
  operator: spec.operator,
  region: "tokyo",
  segments: segmentsFor(spec, stations).map(segment => segment.map(station => station.key)),
}));

const stationMeta = Object.fromEntries([...meta].sort(([a], [b]) => a.localeCompare(b, "ja")));
const displayNames = Object.fromEntries([...meta.keys()].map(key => [key, key]));

const banner = `/* ============================================================
   サブウェイ・ゲッサー — 東京の地下鉄データ
   - 東京メトロ9路線 + 都営地下鉄4路線（直通先の私鉄・JRは対象外）
   - 駅名、よみがな、駅ナンバリング、座標を収録
   - 生成元: scripts/generate-tokyo-data.mjs
   - データ出典: Seo-4d696b75/station_database (CC BY 4.0)
   - 公式照合: 東京メトロ / 東京都交通局（2026年7月確認）
   ============================================================ */\n\n`;

const output = `${banner}const DISPLAY_NAME = ${JSON.stringify(displayNames, null, 2)};\n\n`
  + `const STATION_META = ${JSON.stringify(stationMeta, null, 2)};\n\n`
  + `const REGION_LABELS = { tokyo: "東京" };\n\n`
  + `function linesForRegion() { return LINES; }\n`
  + `function regionSupportsCore() { return false; }\n\n`
  + `const LINES = ${JSON.stringify(lines, null, 2)};\n\n`
  + `const ANCHORS = ${JSON.stringify(anchors, null, 2)};\n`;

await writeFile(new URL("../js/data.js", import.meta.url), output, "utf8");
console.log(`generated ${lines.length} lines / ${meta.size} unique stations`);
