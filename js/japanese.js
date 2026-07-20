/* ============================================================
   日本語入力ユーティリティ
   - 漢字・ひらがな・カタカナ・ローマ字・駅ナンバリングを横断検索
   - IMEで確定前の文字列は game.js 側で送信しない
   ============================================================ */

function katakanaToHiragana(value) {
  return String(value || "").replace(/[ァ-ヶ]/g, char =>
    String.fromCharCode(char.charCodeAt(0) - 0x60)
  );
}

function hiraganaToKatakana(value) {
  return String(value || "").replace(/[ぁ-ゖ]/g, char =>
    String.fromCharCode(char.charCodeAt(0) + 0x60)
  );
}

// 比較用表記。全角英数、空白、記号、「駅」を吸収する。
function normalizeName(value) {
  return katakanaToHiragana(String(value || "").normalize("NFKC"))
    .trim()
    .toLowerCase()
    .replace(/[āăâä]/g, "a").replace(/[īĭîï]/g, "i")
    .replace(/[ūŭûü]/g, "u").replace(/[ēĕêë]/g, "e").replace(/[ōŏôö]/g, "o")
    .replace(/駅$/u, "")
    .replace(/[\s・･·.。,.，、'’`\-‐‑‒–—―()（）[\]【】〈〉<>]/gu, "");
}

const ROMAJI_DIGRAPHS = {
  きゃ: "kya", きゅ: "kyu", きょ: "kyo",
  しゃ: "sha", しゅ: "shu", しょ: "sho",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho",
  にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
  みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo",
  ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  じゃ: "ja", じゅ: "ju", じょ: "jo",
  びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
};

const ROMAJI_MONOGRAPHS = {
  あ:"a",い:"i",う:"u",え:"e",お:"o",
  か:"ka",き:"ki",く:"ku",け:"ke",こ:"ko",
  さ:"sa",し:"shi",す:"su",せ:"se",そ:"so",
  た:"ta",ち:"chi",つ:"tsu",て:"te",と:"to",
  な:"na",に:"ni",ぬ:"nu",ね:"ne",の:"no",
  は:"ha",ひ:"hi",ふ:"fu",へ:"he",ほ:"ho",
  ま:"ma",み:"mi",む:"mu",め:"me",も:"mo",
  や:"ya",ゆ:"yu",よ:"yo",
  ら:"ra",り:"ri",る:"ru",れ:"re",ろ:"ro",
  わ:"wa",を:"o",ん:"n",
  が:"ga",ぎ:"gi",ぐ:"gu",げ:"ge",ご:"go",
  ざ:"za",じ:"ji",ず:"zu",ぜ:"ze",ぞ:"zo",
  だ:"da",ぢ:"ji",づ:"zu",で:"de",ど:"do",
  ば:"ba",び:"bi",ぶ:"bu",べ:"be",ぼ:"bo",
  ぱ:"pa",ぴ:"pi",ぷ:"pu",ぺ:"pe",ぽ:"po",
  ゔ:"vu",ぁ:"a",ぃ:"i",ぅ:"u",ぇ:"e",ぉ:"o",
};

function kanaToRomaji(value) {
  const kana = [...katakanaToHiragana(String(value || "").normalize("NFKC"))];
  let result = "";
  let geminate = false;
  for (let index = 0; index < kana.length; index++) {
    const char = kana[index];
    if (char === "っ") { geminate = true; continue; }
    if (char === "ー") {
      const vowel = result.match(/[aeiou](?!.*[aeiou])/g)?.pop();
      if (vowel) result += vowel;
      continue;
    }
    const pair = char + (kana[index + 1] || "");
    let syllable = ROMAJI_DIGRAPHS[pair];
    if (syllable) index++;
    else syllable = ROMAJI_MONOGRAPHS[char] || char.toLowerCase();
    if (geminate && /^[a-z]/.test(syllable)) syllable = syllable[0] + syllable;
    geminate = false;
    result += syllable;
  }
  return result.replace(/[^a-z0-9]/g, "");
}

function romajiVariants(kana) {
  const base = kanaToRomaji(kana);
  const variants = new Set([base]);
  variants.add(base.replace(/n(?=[bmp])/g, "m"));
  const kunrei = base
    .replace(/sha/g, "sya").replace(/shu/g, "syu").replace(/sho/g, "syo")
    .replace(/cha/g, "tya").replace(/chu/g, "tyu").replace(/cho/g, "tyo")
    .replace(/ja/g, "zya").replace(/ju/g, "zyu").replace(/jo/g, "zyo")
    .replace(/shi/g, "si").replace(/chi/g, "ti").replace(/tsu/g, "tu")
    .replace(/fu/g, "hu").replace(/ji/g, "zi");
  variants.add(kunrei);
  variants.add(kunrei.replace(/n(?=[bmp])/g, "m"));
  const shortVowels = base.replace(/ou/g, "o").replace(/oo/g, "o").replace(/uu/g, "u");
  variants.add(shortVowels);
  variants.add(shortVowels.replace(/n(?=[bmp])/g, "m"));
  variants.add(kunrei.replace(/ou/g, "o").replace(/oo/g, "o").replace(/uu/g, "u"));
  return [...variants];
}

function stationMeta(displayName) {
  if (typeof STATION_META === "undefined") return null;
  if (STATION_META[displayName]) return STATION_META[displayName];
  return Object.values(STATION_META).find(meta => meta.name === displayName) || null;
}

function stationCandidates(displayName) {
  const meta = stationMeta(displayName);
  const names = new Set([displayName, meta?.name, ...(meta?.aliases || [])].filter(Boolean));
  const kana = meta?.kana || "";
  const values = new Set([...names]);
  if (kana) {
    values.add(kana);
    values.add(hiraganaToKatakana(kana));
    romajiVariants(kana).forEach(value => values.add(value));
  }
  (meta?.numbers || []).forEach(number => values.add(number));
  return [...values];
}

function nameAliases(displayName) {
  return stationCandidates(displayName).map(normalizeName);
}

function matchesAnswer(input, displayName) {
  const query = normalizeName(input);
  if (!query) return false;
  return stationCandidates(displayName).some(candidate => normalizeName(candidate) === query);
}

// 完全一致 > 前方一致 > 部分一致。駅番号とローマ字も同じ候補として扱う。
function searchScore(query, displayName) {
  const normalizedQuery = normalizeName(query);
  if (!normalizedQuery) return -1;
  let best = -1;
  for (const candidate of stationCandidates(displayName)) {
    const normalizedCandidate = normalizeName(candidate);
    if (normalizedCandidate === normalizedQuery) best = Math.max(best, 4);
    else if (normalizedCandidate.startsWith(normalizedQuery)) best = Math.max(best, 3);
    else if (normalizedCandidate.includes(normalizedQuery)) best = Math.max(best, 2);
  }
  return best;
}

function stationReading(displayName) {
  return stationMeta(displayName)?.kana || katakanaToHiragana(displayName);
}

function stationRomaji(displayName) {
  return kanaToRomaji(stationReading(displayName));
}

// 開発者SQだけに、現在の正解をローマ字で表示するための厳密な判定。
function developerAnswerRomaji(profile, displayName) {
  if (profile?.nickname !== "SQ") return "";
  return stationRomaji(displayName);
}

function stationNumbers(displayName) {
  return stationMeta(displayName)?.numbers || [];
}

// よみがなの1・3・5…文字目を見せる、日本語版のヒント。
function kanaHint(displayName) {
  return [...stationReading(displayName)]
    .map((char, index) => index % 2 === 0 ? char : "？")
    .join("");
}
