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

// 実際の緯度経度をそのまま縮尺すると都心部が密集し、路線が判別しにくい。
// 乗換駅・終端・曲がり角だけを共有グリッド上に固定し、その間の駅は線形補間する。
// 東京の東西南北関係を保ちながら、ゲーム画面用の独自模式図にする。
// 韓国版と同程度の駅間余白を確保するため、設計グリッドを広めに展開する。
const SCHEMATIC_SCALE = 1.6;
const SCHEMATIC_ANCHORS = {
  // 北西部（有楽町線・副都心線の共用区間）
  "和光市": [100, 100], "地下鉄成増": [140, 120], "地下鉄赤塚": [180, 140],
  "平和台": [220, 160], "氷川台": [260, 180], "小竹向原": [300, 200],
  "千川": [340, 220], "要町": [380, 240], "池袋": [420, 260],

  // 新宿・渋谷・西側
  "荻窪": [40, 600], "中野": [80, 360], "中野坂上": [220, 540],
  "方南町": [160, 680], "都庁前": [260, 500], "新宿": [300, 560],
  "新宿三丁目": [350, 530], "東新宿": [360, 440], "明治神宮前〈原宿〉": [380, 700],
  "代々木上原": [180, 790], "渋谷": [360, 800], "表参道": [430, 730],
  "青山一丁目": [500, 660], "赤坂見附": [570, 590], "四ツ谷": [520, 520],

  // 北・都心北側
  "赤羽岩淵": [700, 0], "西高島平": [460, 0], "光が丘": [120, 300],
  "北綾瀬": [1160, 0], "北千住": [1100, 80], "西日暮里": [920, 160],
  "上野": [950, 280], "後楽園": [710, 320], "春日": [730, 330],
  "本郷三丁目": [760, 300], "飯田橋": [660, 390], "九段下": [700, 430],
  "市ケ谷": [590, 450], "神保町": [750, 420], "新御茶ノ水": [790, 400],

  // 皇居・丸の内・銀座
  "永田町": [610, 560], "国会議事堂前": [650, 610], "溜池山王": [630, 630],
  "赤坂": [620, 680], "霞ケ関": [700, 640], "日比谷": [750, 600],
  "大手町": [800, 460], "東京": [810, 540], "銀座": [790, 620],
  "銀座一丁目": [820, 660], "有楽町": [770, 620], "桜田門": [690, 590],
  "三越前": [860, 440], "日本橋": [870, 500], "茅場町": [900, 530],
  "人形町": [930, 480], "東銀座": [840, 640], "新橋": [730, 690],

  // 南側
  "六本木": [580, 740], "麻布十番": [620, 800], "白金高輪": [650, 870],
  "白金台": [640, 920], "目黒": [630, 970], "中目黒": [430, 900],
  "三田": [720, 820], "大門": [750, 750], "泉岳寺": [690, 880],
  "五反田": [680, 980], "西馬込": [720, 1100],

  // 隅田川・東側
  "月島": [930, 700], "新木場": [1160, 820], "門前仲町": [990, 600],
  "清澄白河": [1020, 540], "森下": [1030, 500], "住吉": [1120, 470],
  "本八幡": [1500, 450], "西船橋": [1540, 560], "蔵前": [1060, 340],
  "浅草": [1120, 280], "押上〈スカイツリー前〉": [1280, 320],
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

for (const key of Object.keys(SCHEMATIC_ANCHORS)) {
  if (!meta.has(key)) throw new Error(`schematic anchor does not match a station: ${key}`);
}
const anchors = Object.fromEntries(
  Object.entries(SCHEMATIC_ANCHORS).map(([key, [x, y]]) => [
    key,
    [Math.round(x * SCHEMATIC_SCALE), Math.round(y * SCHEMATIC_SCALE)],
  ])
);

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
