/* ============================================================
   サブウェイ・ゲッサー — 東京の地下鉄データ
   - 東京メトロ9路線 + 都営地下鉄4路線（直通先の私鉄・JRは対象外）
   - 駅名、よみがな、駅ナンバリング、座標を収録
   - 生成元: scripts/generate-tokyo-data.mjs
   - データ出典: Seo-4d696b75/station_database (CC BY 4.0)
   - 公式照合: 東京メトロ / 東京都交通局（2026年7月確認）
   ============================================================ */

const DISPLAY_NAME = {
  "浅草": "浅草",
  "田原町": "田原町",
  "稲荷町": "稲荷町",
  "上野": "上野",
  "上野広小路": "上野広小路",
  "末広町": "末広町",
  "神田": "神田",
  "三越前": "三越前",
  "日本橋": "日本橋",
  "京橋": "京橋",
  "銀座": "銀座",
  "新橋": "新橋",
  "虎ノ門": "虎ノ門",
  "溜池山王": "溜池山王",
  "赤坂見附": "赤坂見附",
  "青山一丁目": "青山一丁目",
  "外苑前": "外苑前",
  "表参道": "表参道",
  "渋谷": "渋谷",
  "池袋": "池袋",
  "新大塚": "新大塚",
  "茗荷谷": "茗荷谷",
  "後楽園": "後楽園",
  "本郷三丁目": "本郷三丁目",
  "御茶ノ水": "御茶ノ水",
  "淡路町": "淡路町",
  "大手町": "大手町",
  "東京": "東京",
  "霞ケ関": "霞ケ関",
  "国会議事堂前": "国会議事堂前",
  "四ツ谷": "四ツ谷",
  "四谷三丁目": "四谷三丁目",
  "新宿御苑前": "新宿御苑前",
  "新宿三丁目": "新宿三丁目",
  "新宿": "新宿",
  "西新宿": "西新宿",
  "中野坂上": "中野坂上",
  "新中野": "新中野",
  "東高円寺": "東高円寺",
  "新高円寺": "新高円寺",
  "南阿佐ケ谷": "南阿佐ケ谷",
  "荻窪": "荻窪",
  "中野新橋": "中野新橋",
  "中野富士見町": "中野富士見町",
  "方南町": "方南町",
  "北千住": "北千住",
  "南千住": "南千住",
  "三ノ輪": "三ノ輪",
  "入谷": "入谷",
  "仲御徒町": "仲御徒町",
  "秋葉原": "秋葉原",
  "小伝馬町": "小伝馬町",
  "人形町": "人形町",
  "茅場町": "茅場町",
  "八丁堀": "八丁堀",
  "築地": "築地",
  "東銀座": "東銀座",
  "日比谷": "日比谷",
  "虎ノ門ヒルズ": "虎ノ門ヒルズ",
  "神谷町": "神谷町",
  "六本木": "六本木",
  "広尾": "広尾",
  "恵比寿": "恵比寿",
  "中目黒": "中目黒",
  "中野": "中野",
  "落合": "落合",
  "高田馬場": "高田馬場",
  "早稲田": "早稲田",
  "神楽坂": "神楽坂",
  "飯田橋": "飯田橋",
  "九段下": "九段下",
  "竹橋": "竹橋",
  "門前仲町": "門前仲町",
  "木場": "木場",
  "東陽町": "東陽町",
  "南砂町": "南砂町",
  "西葛西": "西葛西",
  "葛西": "葛西",
  "浦安": "浦安",
  "南行徳": "南行徳",
  "行徳": "行徳",
  "妙典": "妙典",
  "原木中山": "原木中山",
  "西船橋": "西船橋",
  "北綾瀬": "北綾瀬",
  "綾瀬": "綾瀬",
  "町屋": "町屋",
  "西日暮里": "西日暮里",
  "千駄木": "千駄木",
  "根津": "根津",
  "湯島": "湯島",
  "新御茶ノ水": "新御茶ノ水",
  "二重橋前〈丸の内〉": "二重橋前〈丸の内〉",
  "赤坂": "赤坂",
  "乃木坂": "乃木坂",
  "明治神宮前〈原宿〉": "明治神宮前〈原宿〉",
  "代々木公園": "代々木公園",
  "代々木上原": "代々木上原",
  "和光市": "和光市",
  "地下鉄成増": "地下鉄成増",
  "地下鉄赤塚": "地下鉄赤塚",
  "平和台": "平和台",
  "氷川台": "氷川台",
  "小竹向原": "小竹向原",
  "千川": "千川",
  "要町": "要町",
  "東池袋": "東池袋",
  "護国寺": "護国寺",
  "江戸川橋": "江戸川橋",
  "市ケ谷": "市ケ谷",
  "麹町": "麹町",
  "永田町": "永田町",
  "桜田門": "桜田門",
  "有楽町": "有楽町",
  "銀座一丁目": "銀座一丁目",
  "新富町": "新富町",
  "月島": "月島",
  "豊洲": "豊洲",
  "辰巳": "辰巳",
  "新木場": "新木場",
  "半蔵門": "半蔵門",
  "神保町": "神保町",
  "水天宮前": "水天宮前",
  "清澄白河": "清澄白河",
  "住吉": "住吉",
  "錦糸町": "錦糸町",
  "押上〈スカイツリー前〉": "押上〈スカイツリー前〉",
  "赤羽岩淵": "赤羽岩淵",
  "志茂": "志茂",
  "王子神谷": "王子神谷",
  "王子": "王子",
  "西ケ原": "西ケ原",
  "駒込": "駒込",
  "本駒込": "本駒込",
  "東大前": "東大前",
  "六本木一丁目": "六本木一丁目",
  "麻布十番": "麻布十番",
  "白金高輪": "白金高輪",
  "白金台": "白金台",
  "目黒": "目黒",
  "雑司が谷": "雑司が谷",
  "西早稲田": "西早稲田",
  "東新宿": "東新宿",
  "北参道": "北参道",
  "西馬込": "西馬込",
  "馬込": "馬込",
  "中延": "中延",
  "戸越": "戸越",
  "五反田": "五反田",
  "高輪台": "高輪台",
  "泉岳寺": "泉岳寺",
  "三田": "三田",
  "大門": "大門",
  "宝町": "宝町",
  "東日本橋": "東日本橋",
  "浅草橋": "浅草橋",
  "蔵前": "蔵前",
  "本所吾妻橋": "本所吾妻橋",
  "芝公園": "芝公園",
  "御成門": "御成門",
  "内幸町": "内幸町",
  "水道橋": "水道橋",
  "春日": "春日",
  "白山": "白山",
  "千石": "千石",
  "巣鴨": "巣鴨",
  "西巣鴨": "西巣鴨",
  "新板橋": "新板橋",
  "板橋区役所前": "板橋区役所前",
  "板橋本町": "板橋本町",
  "本蓮沼": "本蓮沼",
  "志村坂上": "志村坂上",
  "志村三丁目": "志村三丁目",
  "蓮根": "蓮根",
  "西台": "西台",
  "高島平": "高島平",
  "新高島平": "新高島平",
  "西高島平": "西高島平",
  "曙橋": "曙橋",
  "小川町": "小川町",
  "岩本町": "岩本町",
  "馬喰横山": "馬喰横山",
  "浜町": "浜町",
  "森下": "森下",
  "菊川": "菊川",
  "西大島": "西大島",
  "大島": "大島",
  "東大島": "東大島",
  "船堀": "船堀",
  "一之江": "一之江",
  "瑞江": "瑞江",
  "篠崎": "篠崎",
  "本八幡": "本八幡",
  "都庁前": "都庁前",
  "新宿西口": "新宿西口",
  "若松河田": "若松河田",
  "牛込柳町": "牛込柳町",
  "牛込神楽坂": "牛込神楽坂",
  "上野御徒町": "上野御徒町",
  "新御徒町": "新御徒町",
  "両国": "両国",
  "勝どき": "勝どき",
  "築地市場": "築地市場",
  "汐留": "汐留",
  "赤羽橋": "赤羽橋",
  "国立競技場": "国立競技場",
  "代々木": "代々木",
  "西新宿五丁目": "西新宿五丁目",
  "東中野": "東中野",
  "中井": "中井",
  "落合南長崎": "落合南長崎",
  "新江古田": "新江古田",
  "練馬": "練馬",
  "豊島園": "豊島園",
  "練馬春日町": "練馬春日町",
  "光が丘": "光が丘"
};

const STATION_META = {
  "綾瀬": {
    "name": "綾瀬",
    "kana": "あやせ",
    "aliases": [],
    "numbers": [
      "C19"
    ],
    "operator": "東京メトロ"
  },
  "一之江": {
    "name": "一之江",
    "kana": "いちのえ",
    "aliases": [],
    "numbers": [
      "S18"
    ],
    "operator": "都営地下鉄"
  },
  "稲荷町": {
    "name": "稲荷町",
    "kana": "いなりちょう",
    "aliases": [],
    "numbers": [
      "G17"
    ],
    "operator": "東京メトロ"
  },
  "浦安": {
    "name": "浦安",
    "kana": "うらやす",
    "aliases": [],
    "numbers": [
      "T18"
    ],
    "operator": "東京メトロ"
  },
  "永田町": {
    "name": "永田町",
    "kana": "ながたちょう",
    "aliases": [],
    "numbers": [
      "Y16",
      "Z04",
      "N07"
    ],
    "operator": "東京メトロ"
  },
  "押上〈スカイツリー前〉": {
    "name": "押上〈スカイツリー前〉",
    "kana": "おしあげ",
    "aliases": [
      "押上",
      "押上スカイツリー前"
    ],
    "numbers": [
      "Z14",
      "A20"
    ],
    "operator": "東京メトロ"
  },
  "王子": {
    "name": "王子",
    "kana": "おうじ",
    "aliases": [],
    "numbers": [
      "N16"
    ],
    "operator": "東京メトロ"
  },
  "王子神谷": {
    "name": "王子神谷",
    "kana": "おうじかみや",
    "aliases": [],
    "numbers": [
      "N17"
    ],
    "operator": "東京メトロ"
  },
  "荻窪": {
    "name": "荻窪",
    "kana": "おぎくぼ",
    "aliases": [],
    "numbers": [
      "M01"
    ],
    "operator": "東京メトロ"
  },
  "霞ケ関": {
    "name": "霞ケ関",
    "kana": "かすみがせき",
    "aliases": [],
    "numbers": [
      "M15",
      "H07",
      "C08"
    ],
    "operator": "東京メトロ"
  },
  "外苑前": {
    "name": "外苑前",
    "kana": "がいえんまえ",
    "aliases": [],
    "numbers": [
      "G03"
    ],
    "operator": "東京メトロ"
  },
  "葛西": {
    "name": "葛西",
    "kana": "かさい",
    "aliases": [],
    "numbers": [
      "T17"
    ],
    "operator": "東京メトロ"
  },
  "茅場町": {
    "name": "茅場町",
    "kana": "かやばちょう",
    "aliases": [],
    "numbers": [
      "H13",
      "T11"
    ],
    "operator": "東京メトロ"
  },
  "岩本町": {
    "name": "岩本町",
    "kana": "いわもとちょう",
    "aliases": [],
    "numbers": [
      "S08"
    ],
    "operator": "都営地下鉄"
  },
  "菊川": {
    "name": "菊川",
    "kana": "きくかわ",
    "aliases": [],
    "numbers": [
      "S12"
    ],
    "operator": "都営地下鉄"
  },
  "牛込神楽坂": {
    "name": "牛込神楽坂",
    "kana": "うしごめかぐらざか",
    "aliases": [],
    "numbers": [
      "E05"
    ],
    "operator": "都営地下鉄"
  },
  "牛込柳町": {
    "name": "牛込柳町",
    "kana": "うしごめやなぎちょう",
    "aliases": [],
    "numbers": [
      "E04"
    ],
    "operator": "都営地下鉄"
  },
  "京橋": {
    "name": "京橋",
    "kana": "きょうばし",
    "aliases": [],
    "numbers": [
      "G10"
    ],
    "operator": "東京メトロ"
  },
  "錦糸町": {
    "name": "錦糸町",
    "kana": "きんしちょう",
    "aliases": [],
    "numbers": [
      "Z13"
    ],
    "operator": "東京メトロ"
  },
  "銀座": {
    "name": "銀座",
    "kana": "ぎんざ",
    "aliases": [],
    "numbers": [
      "G09",
      "M16",
      "H09"
    ],
    "operator": "東京メトロ"
  },
  "銀座一丁目": {
    "name": "銀座一丁目",
    "kana": "ぎんざいっちょうめ",
    "aliases": [],
    "numbers": [
      "Y19"
    ],
    "operator": "東京メトロ"
  },
  "九段下": {
    "name": "九段下",
    "kana": "くだんした",
    "aliases": [],
    "numbers": [
      "T07",
      "Z06",
      "S05"
    ],
    "operator": "東京メトロ"
  },
  "駒込": {
    "name": "駒込",
    "kana": "こまごめ",
    "aliases": [],
    "numbers": [
      "N14"
    ],
    "operator": "東京メトロ"
  },
  "恵比寿": {
    "name": "恵比寿",
    "kana": "えびす",
    "aliases": [],
    "numbers": [
      "H02"
    ],
    "operator": "東京メトロ"
  },
  "月島": {
    "name": "月島",
    "kana": "つきしま",
    "aliases": [],
    "numbers": [
      "Y21",
      "E16"
    ],
    "operator": "東京メトロ"
  },
  "原木中山": {
    "name": "原木中山",
    "kana": "ばらきなかやま",
    "aliases": [],
    "numbers": [
      "T22"
    ],
    "operator": "東京メトロ"
  },
  "戸越": {
    "name": "戸越",
    "kana": "とごし",
    "aliases": [],
    "numbers": [
      "A04"
    ],
    "operator": "都営地下鉄"
  },
  "虎ノ門": {
    "name": "虎ノ門",
    "kana": "とらのもん",
    "aliases": [],
    "numbers": [
      "G07"
    ],
    "operator": "東京メトロ"
  },
  "虎ノ門ヒルズ": {
    "name": "虎ノ門ヒルズ",
    "kana": "とらのもんひるず",
    "aliases": [],
    "numbers": [
      "H06"
    ],
    "operator": "東京メトロ"
  },
  "五反田": {
    "name": "五反田",
    "kana": "ごたんだ",
    "aliases": [],
    "numbers": [
      "A05"
    ],
    "operator": "都営地下鉄"
  },
  "後楽園": {
    "name": "後楽園",
    "kana": "こうらくえん",
    "aliases": [],
    "numbers": [
      "M22",
      "N11"
    ],
    "operator": "東京メトロ"
  },
  "御成門": {
    "name": "御成門",
    "kana": "おなりもん",
    "aliases": [],
    "numbers": [
      "I06"
    ],
    "operator": "都営地下鉄"
  },
  "御茶ノ水": {
    "name": "御茶ノ水",
    "kana": "おちゃのみず",
    "aliases": [],
    "numbers": [
      "M20"
    ],
    "operator": "東京メトロ"
  },
  "護国寺": {
    "name": "護国寺",
    "kana": "ごこくじ",
    "aliases": [],
    "numbers": [
      "Y11"
    ],
    "operator": "東京メトロ"
  },
  "光が丘": {
    "name": "光が丘",
    "kana": "ひかりがおか",
    "aliases": [],
    "numbers": [
      "E38"
    ],
    "operator": "都営地下鉄"
  },
  "広尾": {
    "name": "広尾",
    "kana": "ひろお",
    "aliases": [],
    "numbers": [
      "H03"
    ],
    "operator": "東京メトロ"
  },
  "江戸川橋": {
    "name": "江戸川橋",
    "kana": "えどがわばし",
    "aliases": [],
    "numbers": [
      "Y12"
    ],
    "operator": "東京メトロ"
  },
  "行徳": {
    "name": "行徳",
    "kana": "ぎょうとく",
    "aliases": [],
    "numbers": [
      "T20"
    ],
    "operator": "東京メトロ"
  },
  "高田馬場": {
    "name": "高田馬場",
    "kana": "たかだのばば",
    "aliases": [],
    "numbers": [
      "T03"
    ],
    "operator": "東京メトロ"
  },
  "高島平": {
    "name": "高島平",
    "kana": "たかしまだいら",
    "aliases": [],
    "numbers": [
      "I25"
    ],
    "operator": "都営地下鉄"
  },
  "高輪台": {
    "name": "高輪台",
    "kana": "たかなわだい",
    "aliases": [],
    "numbers": [
      "A06"
    ],
    "operator": "都営地下鉄"
  },
  "麹町": {
    "name": "麹町",
    "kana": "こうじまち",
    "aliases": [],
    "numbers": [
      "Y15"
    ],
    "operator": "東京メトロ"
  },
  "国会議事堂前": {
    "name": "国会議事堂前",
    "kana": "こっかいぎじどうまえ",
    "aliases": [],
    "numbers": [
      "M14",
      "C07"
    ],
    "operator": "東京メトロ"
  },
  "国立競技場": {
    "name": "国立競技場",
    "kana": "こくりつきょうぎじょう",
    "aliases": [],
    "numbers": [
      "E25"
    ],
    "operator": "都営地下鉄"
  },
  "根津": {
    "name": "根津",
    "kana": "ねづ",
    "aliases": [],
    "numbers": [
      "C14"
    ],
    "operator": "東京メトロ"
  },
  "桜田門": {
    "name": "桜田門",
    "kana": "さくらだもん",
    "aliases": [],
    "numbers": [
      "Y17"
    ],
    "operator": "東京メトロ"
  },
  "雑司が谷": {
    "name": "雑司が谷",
    "kana": "ぞうしがや",
    "aliases": [],
    "numbers": [
      "F10"
    ],
    "operator": "東京メトロ"
  },
  "三ノ輪": {
    "name": "三ノ輪",
    "kana": "みのわ",
    "aliases": [],
    "numbers": [
      "H20"
    ],
    "operator": "東京メトロ"
  },
  "三越前": {
    "name": "三越前",
    "kana": "みつこしまえ",
    "aliases": [],
    "numbers": [
      "G12",
      "Z09"
    ],
    "operator": "東京メトロ"
  },
  "三田": {
    "name": "三田",
    "kana": "みた",
    "aliases": [],
    "numbers": [
      "A08",
      "I04"
    ],
    "operator": "都営地下鉄"
  },
  "四ツ谷": {
    "name": "四ツ谷",
    "kana": "よつや",
    "aliases": [
      "四ッ谷"
    ],
    "numbers": [
      "M12",
      "N08"
    ],
    "operator": "東京メトロ"
  },
  "四谷三丁目": {
    "name": "四谷三丁目",
    "kana": "よつやさんちょうめ",
    "aliases": [],
    "numbers": [
      "M11"
    ],
    "operator": "東京メトロ"
  },
  "市ケ谷": {
    "name": "市ケ谷",
    "kana": "いちがや",
    "aliases": [
      "市ヶ谷"
    ],
    "numbers": [
      "Y14",
      "N09",
      "S04"
    ],
    "operator": "東京メトロ"
  },
  "志村坂上": {
    "name": "志村坂上",
    "kana": "しむらさかうえ",
    "aliases": [],
    "numbers": [
      "I21"
    ],
    "operator": "都営地下鉄"
  },
  "志村三丁目": {
    "name": "志村三丁目",
    "kana": "しむらさんちょうめ",
    "aliases": [],
    "numbers": [
      "I22"
    ],
    "operator": "都営地下鉄"
  },
  "志茂": {
    "name": "志茂",
    "kana": "しも",
    "aliases": [],
    "numbers": [
      "N18"
    ],
    "operator": "東京メトロ"
  },
  "汐留": {
    "name": "汐留",
    "kana": "しおどめ",
    "aliases": [],
    "numbers": [
      "E19"
    ],
    "operator": "都営地下鉄"
  },
  "篠崎": {
    "name": "篠崎",
    "kana": "しのざき",
    "aliases": [],
    "numbers": [
      "S20"
    ],
    "operator": "都営地下鉄"
  },
  "芝公園": {
    "name": "芝公園",
    "kana": "しばこうえん",
    "aliases": [],
    "numbers": [
      "I05"
    ],
    "operator": "都営地下鉄"
  },
  "若松河田": {
    "name": "若松河田",
    "kana": "わかまつかわだ",
    "aliases": [],
    "numbers": [
      "E03"
    ],
    "operator": "都営地下鉄"
  },
  "秋葉原": {
    "name": "秋葉原",
    "kana": "あきはばら",
    "aliases": [],
    "numbers": [
      "H16"
    ],
    "operator": "東京メトロ"
  },
  "住吉": {
    "name": "住吉",
    "kana": "すみよし",
    "aliases": [],
    "numbers": [
      "Z12",
      "S13"
    ],
    "operator": "東京メトロ"
  },
  "渋谷": {
    "name": "渋谷",
    "kana": "しぶや",
    "aliases": [],
    "numbers": [
      "G01",
      "Z01",
      "F16"
    ],
    "operator": "東京メトロ"
  },
  "春日": {
    "name": "春日",
    "kana": "かすが",
    "aliases": [],
    "numbers": [
      "I12",
      "E07"
    ],
    "operator": "都営地下鉄"
  },
  "曙橋": {
    "name": "曙橋",
    "kana": "あけぼのばし",
    "aliases": [],
    "numbers": [
      "S03"
    ],
    "operator": "都営地下鉄"
  },
  "勝どき": {
    "name": "勝どき",
    "kana": "かちどき",
    "aliases": [],
    "numbers": [
      "E17"
    ],
    "operator": "都営地下鉄"
  },
  "小川町": {
    "name": "小川町",
    "kana": "おがわまち",
    "aliases": [],
    "numbers": [
      "S07"
    ],
    "operator": "都営地下鉄"
  },
  "小竹向原": {
    "name": "小竹向原",
    "kana": "こたけむかいはら",
    "aliases": [],
    "numbers": [
      "Y06",
      "F06"
    ],
    "operator": "東京メトロ"
  },
  "小伝馬町": {
    "name": "小伝馬町",
    "kana": "こでんまちょう",
    "aliases": [],
    "numbers": [
      "H15"
    ],
    "operator": "東京メトロ"
  },
  "上野": {
    "name": "上野",
    "kana": "うえの",
    "aliases": [],
    "numbers": [
      "G16",
      "H18"
    ],
    "operator": "東京メトロ"
  },
  "上野御徒町": {
    "name": "上野御徒町",
    "kana": "うえのおかちまち",
    "aliases": [],
    "numbers": [
      "E09"
    ],
    "operator": "都営地下鉄"
  },
  "上野広小路": {
    "name": "上野広小路",
    "kana": "うえのひろこうじ",
    "aliases": [],
    "numbers": [
      "G15"
    ],
    "operator": "東京メトロ"
  },
  "新橋": {
    "name": "新橋",
    "kana": "しんばし",
    "aliases": [],
    "numbers": [
      "G08",
      "A10"
    ],
    "operator": "東京メトロ"
  },
  "新御茶ノ水": {
    "name": "新御茶ノ水",
    "kana": "しんおちゃのみず",
    "aliases": [],
    "numbers": [
      "C12"
    ],
    "operator": "東京メトロ"
  },
  "新御徒町": {
    "name": "新御徒町",
    "kana": "しんおかちまち",
    "aliases": [],
    "numbers": [
      "E10"
    ],
    "operator": "都営地下鉄"
  },
  "新江古田": {
    "name": "新江古田",
    "kana": "しんえごた",
    "aliases": [],
    "numbers": [
      "E34"
    ],
    "operator": "都営地下鉄"
  },
  "新高円寺": {
    "name": "新高円寺",
    "kana": "しんこうえんじ",
    "aliases": [],
    "numbers": [
      "M03"
    ],
    "operator": "東京メトロ"
  },
  "新高島平": {
    "name": "新高島平",
    "kana": "しんたかしまだいら",
    "aliases": [],
    "numbers": [
      "I26"
    ],
    "operator": "都営地下鉄"
  },
  "新宿": {
    "name": "新宿",
    "kana": "しんじゅく",
    "aliases": [],
    "numbers": [
      "M08",
      "S01",
      "E27"
    ],
    "operator": "東京メトロ"
  },
  "新宿御苑前": {
    "name": "新宿御苑前",
    "kana": "しんじゅくぎょえんまえ",
    "aliases": [],
    "numbers": [
      "M10"
    ],
    "operator": "東京メトロ"
  },
  "新宿三丁目": {
    "name": "新宿三丁目",
    "kana": "しんじゅくさんちょうめ",
    "aliases": [],
    "numbers": [
      "M09",
      "F13",
      "S02"
    ],
    "operator": "東京メトロ"
  },
  "新宿西口": {
    "name": "新宿西口",
    "kana": "しんじゅくにしぐち",
    "aliases": [],
    "numbers": [
      "E01"
    ],
    "operator": "都営地下鉄"
  },
  "新大塚": {
    "name": "新大塚",
    "kana": "しんおおつか",
    "aliases": [],
    "numbers": [
      "M24"
    ],
    "operator": "東京メトロ"
  },
  "新中野": {
    "name": "新中野",
    "kana": "しんなかの",
    "aliases": [],
    "numbers": [
      "M05"
    ],
    "operator": "東京メトロ"
  },
  "新板橋": {
    "name": "新板橋",
    "kana": "しんいたばし",
    "aliases": [],
    "numbers": [
      "I17"
    ],
    "operator": "都営地下鉄"
  },
  "新富町": {
    "name": "新富町",
    "kana": "しんとみちょう",
    "aliases": [],
    "numbers": [
      "Y20"
    ],
    "operator": "東京メトロ"
  },
  "新木場": {
    "name": "新木場",
    "kana": "しんきば",
    "aliases": [],
    "numbers": [
      "Y24"
    ],
    "operator": "東京メトロ"
  },
  "森下": {
    "name": "森下",
    "kana": "もりした",
    "aliases": [],
    "numbers": [
      "S11",
      "E13"
    ],
    "operator": "都営地下鉄"
  },
  "神楽坂": {
    "name": "神楽坂",
    "kana": "かぐらざか",
    "aliases": [],
    "numbers": [
      "T05"
    ],
    "operator": "東京メトロ"
  },
  "神谷町": {
    "name": "神谷町",
    "kana": "かみやちょう",
    "aliases": [],
    "numbers": [
      "H05"
    ],
    "operator": "東京メトロ"
  },
  "神田": {
    "name": "神田",
    "kana": "かんだ",
    "aliases": [],
    "numbers": [
      "G13"
    ],
    "operator": "東京メトロ"
  },
  "神保町": {
    "name": "神保町",
    "kana": "じんぼうちょう",
    "aliases": [],
    "numbers": [
      "Z07",
      "I10",
      "S06"
    ],
    "operator": "東京メトロ"
  },
  "人形町": {
    "name": "人形町",
    "kana": "にんぎょうちょう",
    "aliases": [],
    "numbers": [
      "H14",
      "A14"
    ],
    "operator": "東京メトロ"
  },
  "水天宮前": {
    "name": "水天宮前",
    "kana": "すいてんぐうまえ",
    "aliases": [],
    "numbers": [
      "Z10"
    ],
    "operator": "東京メトロ"
  },
  "水道橋": {
    "name": "水道橋",
    "kana": "すいどうばし",
    "aliases": [],
    "numbers": [
      "I11"
    ],
    "operator": "都営地下鉄"
  },
  "瑞江": {
    "name": "瑞江",
    "kana": "みずえ",
    "aliases": [],
    "numbers": [
      "S19"
    ],
    "operator": "都営地下鉄"
  },
  "清澄白河": {
    "name": "清澄白河",
    "kana": "きよすみしらかわ",
    "aliases": [],
    "numbers": [
      "Z11",
      "E14"
    ],
    "operator": "東京メトロ"
  },
  "西ケ原": {
    "name": "西ケ原",
    "kana": "にしがはら",
    "aliases": [],
    "numbers": [
      "N15"
    ],
    "operator": "東京メトロ"
  },
  "西葛西": {
    "name": "西葛西",
    "kana": "にしかさい",
    "aliases": [],
    "numbers": [
      "T16"
    ],
    "operator": "東京メトロ"
  },
  "西高島平": {
    "name": "西高島平",
    "kana": "にしたかしまだいら",
    "aliases": [],
    "numbers": [
      "I27"
    ],
    "operator": "都営地下鉄"
  },
  "西新宿": {
    "name": "西新宿",
    "kana": "にししんじゅく",
    "aliases": [],
    "numbers": [
      "M07"
    ],
    "operator": "東京メトロ"
  },
  "西新宿五丁目": {
    "name": "西新宿五丁目",
    "kana": "にししんじゅくごちょうめ",
    "aliases": [],
    "numbers": [
      "E29"
    ],
    "operator": "都営地下鉄"
  },
  "西船橋": {
    "name": "西船橋",
    "kana": "にしふなばし",
    "aliases": [],
    "numbers": [
      "T23"
    ],
    "operator": "東京メトロ"
  },
  "西早稲田": {
    "name": "西早稲田",
    "kana": "にしわせだ",
    "aliases": [],
    "numbers": [
      "F11"
    ],
    "operator": "東京メトロ"
  },
  "西巣鴨": {
    "name": "西巣鴨",
    "kana": "にしすがも",
    "aliases": [],
    "numbers": [
      "I16"
    ],
    "operator": "都営地下鉄"
  },
  "西台": {
    "name": "西台",
    "kana": "にしだい",
    "aliases": [],
    "numbers": [
      "I24"
    ],
    "operator": "都営地下鉄"
  },
  "西大島": {
    "name": "西大島",
    "kana": "にしおおじま",
    "aliases": [],
    "numbers": [
      "S14"
    ],
    "operator": "都営地下鉄"
  },
  "西日暮里": {
    "name": "西日暮里",
    "kana": "にしにっぽり",
    "aliases": [],
    "numbers": [
      "C16"
    ],
    "operator": "東京メトロ"
  },
  "西馬込": {
    "name": "西馬込",
    "kana": "にしまごめ",
    "aliases": [],
    "numbers": [
      "A01"
    ],
    "operator": "都営地下鉄"
  },
  "青山一丁目": {
    "name": "青山一丁目",
    "kana": "あおやまいっちょうめ",
    "aliases": [],
    "numbers": [
      "G04",
      "Z03",
      "E24"
    ],
    "operator": "東京メトロ"
  },
  "赤羽岩淵": {
    "name": "赤羽岩淵",
    "kana": "あかばねいわぶち",
    "aliases": [],
    "numbers": [
      "N19"
    ],
    "operator": "東京メトロ"
  },
  "赤羽橋": {
    "name": "赤羽橋",
    "kana": "あかばねばし",
    "aliases": [],
    "numbers": [
      "E21"
    ],
    "operator": "都営地下鉄"
  },
  "赤坂": {
    "name": "赤坂",
    "kana": "あかさか",
    "aliases": [],
    "numbers": [
      "C06"
    ],
    "operator": "東京メトロ"
  },
  "赤坂見附": {
    "name": "赤坂見附",
    "kana": "あかさかみつけ",
    "aliases": [],
    "numbers": [
      "G05",
      "M13"
    ],
    "operator": "東京メトロ"
  },
  "千石": {
    "name": "千石",
    "kana": "せんごく",
    "aliases": [],
    "numbers": [
      "I14"
    ],
    "operator": "都営地下鉄"
  },
  "千川": {
    "name": "千川",
    "kana": "せんかわ",
    "aliases": [],
    "numbers": [
      "Y07",
      "F07"
    ],
    "operator": "東京メトロ"
  },
  "千駄木": {
    "name": "千駄木",
    "kana": "せんだぎ",
    "aliases": [],
    "numbers": [
      "C15"
    ],
    "operator": "東京メトロ"
  },
  "泉岳寺": {
    "name": "泉岳寺",
    "kana": "せんがくじ",
    "aliases": [],
    "numbers": [
      "A07"
    ],
    "operator": "都営地下鉄"
  },
  "浅草": {
    "name": "浅草",
    "kana": "あさくさ",
    "aliases": [],
    "numbers": [
      "G19",
      "A18"
    ],
    "operator": "東京メトロ"
  },
  "浅草橋": {
    "name": "浅草橋",
    "kana": "あさくさばし",
    "aliases": [],
    "numbers": [
      "A16"
    ],
    "operator": "都営地下鉄"
  },
  "船堀": {
    "name": "船堀",
    "kana": "ふなぼり",
    "aliases": [],
    "numbers": [
      "S17"
    ],
    "operator": "都営地下鉄"
  },
  "早稲田": {
    "name": "早稲田",
    "kana": "わせだ",
    "aliases": [],
    "numbers": [
      "T04"
    ],
    "operator": "東京メトロ"
  },
  "巣鴨": {
    "name": "巣鴨",
    "kana": "すがも",
    "aliases": [],
    "numbers": [
      "I15"
    ],
    "operator": "都営地下鉄"
  },
  "蔵前": {
    "name": "蔵前",
    "kana": "くらまえ",
    "aliases": [],
    "numbers": [
      "A17",
      "E11"
    ],
    "operator": "都営地下鉄"
  },
  "代々木": {
    "name": "代々木",
    "kana": "よよぎ",
    "aliases": [],
    "numbers": [
      "E26"
    ],
    "operator": "都営地下鉄"
  },
  "代々木公園": {
    "name": "代々木公園",
    "kana": "よよぎこうえん",
    "aliases": [],
    "numbers": [
      "C02"
    ],
    "operator": "東京メトロ"
  },
  "代々木上原": {
    "name": "代々木上原",
    "kana": "よよぎうえはら",
    "aliases": [],
    "numbers": [
      "C01"
    ],
    "operator": "東京メトロ"
  },
  "大手町": {
    "name": "大手町",
    "kana": "おおてまち",
    "aliases": [],
    "numbers": [
      "M18",
      "T09",
      "C11",
      "Z08",
      "I09"
    ],
    "operator": "東京メトロ"
  },
  "大島": {
    "name": "大島",
    "kana": "おおじま",
    "aliases": [],
    "numbers": [
      "S15"
    ],
    "operator": "都営地下鉄"
  },
  "大門": {
    "name": "大門",
    "kana": "だいもん",
    "aliases": [],
    "numbers": [
      "A09",
      "E20"
    ],
    "operator": "都営地下鉄"
  },
  "辰巳": {
    "name": "辰巳",
    "kana": "たつみ",
    "aliases": [],
    "numbers": [
      "Y23"
    ],
    "operator": "東京メトロ"
  },
  "淡路町": {
    "name": "淡路町",
    "kana": "あわじちょう",
    "aliases": [],
    "numbers": [
      "M19"
    ],
    "operator": "東京メトロ"
  },
  "地下鉄成増": {
    "name": "地下鉄成増",
    "kana": "ちかてつなります",
    "aliases": [],
    "numbers": [
      "Y02",
      "F02"
    ],
    "operator": "東京メトロ"
  },
  "地下鉄赤塚": {
    "name": "地下鉄赤塚",
    "kana": "ちかてつあかつか",
    "aliases": [],
    "numbers": [
      "Y03",
      "F03"
    ],
    "operator": "東京メトロ"
  },
  "池袋": {
    "name": "池袋",
    "kana": "いけぶくろ",
    "aliases": [],
    "numbers": [
      "M25",
      "Y09",
      "F09"
    ],
    "operator": "東京メトロ"
  },
  "築地": {
    "name": "築地",
    "kana": "つきじ",
    "aliases": [],
    "numbers": [
      "H11"
    ],
    "operator": "東京メトロ"
  },
  "築地市場": {
    "name": "築地市場",
    "kana": "つきじしじょう",
    "aliases": [],
    "numbers": [
      "E18"
    ],
    "operator": "都営地下鉄"
  },
  "竹橋": {
    "name": "竹橋",
    "kana": "たけばし",
    "aliases": [],
    "numbers": [
      "T08"
    ],
    "operator": "東京メトロ"
  },
  "中井": {
    "name": "中井",
    "kana": "なかい",
    "aliases": [],
    "numbers": [
      "E32"
    ],
    "operator": "都営地下鉄"
  },
  "中延": {
    "name": "中延",
    "kana": "なかのぶ",
    "aliases": [],
    "numbers": [
      "A03"
    ],
    "operator": "都営地下鉄"
  },
  "中目黒": {
    "name": "中目黒",
    "kana": "なかめぐろ",
    "aliases": [],
    "numbers": [
      "H01"
    ],
    "operator": "東京メトロ"
  },
  "中野": {
    "name": "中野",
    "kana": "なかの",
    "aliases": [],
    "numbers": [
      "T01"
    ],
    "operator": "東京メトロ"
  },
  "中野坂上": {
    "name": "中野坂上",
    "kana": "なかのさかうえ",
    "aliases": [],
    "numbers": [
      "M06",
      "E30"
    ],
    "operator": "東京メトロ"
  },
  "中野新橋": {
    "name": "中野新橋",
    "kana": "なかのしんばし",
    "aliases": [],
    "numbers": [
      "Mb05"
    ],
    "operator": "東京メトロ"
  },
  "中野富士見町": {
    "name": "中野富士見町",
    "kana": "なかのふじみちょう",
    "aliases": [],
    "numbers": [
      "Mb04"
    ],
    "operator": "東京メトロ"
  },
  "仲御徒町": {
    "name": "仲御徒町",
    "kana": "なかおかちまち",
    "aliases": [],
    "numbers": [
      "H17"
    ],
    "operator": "東京メトロ"
  },
  "町屋": {
    "name": "町屋",
    "kana": "まちや",
    "aliases": [],
    "numbers": [
      "C17"
    ],
    "operator": "東京メトロ"
  },
  "田原町": {
    "name": "田原町",
    "kana": "たわらまち",
    "aliases": [],
    "numbers": [
      "G18"
    ],
    "operator": "東京メトロ"
  },
  "都庁前": {
    "name": "都庁前",
    "kana": "とちょうまえ",
    "aliases": [],
    "numbers": [
      "E28"
    ],
    "operator": "都営地下鉄"
  },
  "東京": {
    "name": "東京",
    "kana": "とうきょう",
    "aliases": [],
    "numbers": [
      "M17"
    ],
    "operator": "東京メトロ"
  },
  "東銀座": {
    "name": "東銀座",
    "kana": "ひがしぎんざ",
    "aliases": [],
    "numbers": [
      "H10",
      "A11"
    ],
    "operator": "東京メトロ"
  },
  "東高円寺": {
    "name": "東高円寺",
    "kana": "ひがしこうえんじ",
    "aliases": [],
    "numbers": [
      "M04"
    ],
    "operator": "東京メトロ"
  },
  "東新宿": {
    "name": "東新宿",
    "kana": "ひがししんじゅく",
    "aliases": [],
    "numbers": [
      "F12",
      "E02"
    ],
    "operator": "東京メトロ"
  },
  "東大前": {
    "name": "東大前",
    "kana": "とうだいまえ",
    "aliases": [],
    "numbers": [
      "N12"
    ],
    "operator": "東京メトロ"
  },
  "東大島": {
    "name": "東大島",
    "kana": "ひがしおおじま",
    "aliases": [],
    "numbers": [
      "S16"
    ],
    "operator": "都営地下鉄"
  },
  "東池袋": {
    "name": "東池袋",
    "kana": "ひがしいけぶくろ",
    "aliases": [],
    "numbers": [
      "Y10"
    ],
    "operator": "東京メトロ"
  },
  "東中野": {
    "name": "東中野",
    "kana": "ひがしなかの",
    "aliases": [],
    "numbers": [
      "E31"
    ],
    "operator": "都営地下鉄"
  },
  "東日本橋": {
    "name": "東日本橋",
    "kana": "ひがしにほんばし",
    "aliases": [],
    "numbers": [
      "A15"
    ],
    "operator": "都営地下鉄"
  },
  "東陽町": {
    "name": "東陽町",
    "kana": "とうようちょう",
    "aliases": [],
    "numbers": [
      "T14"
    ],
    "operator": "東京メトロ"
  },
  "湯島": {
    "name": "湯島",
    "kana": "ゆしま",
    "aliases": [],
    "numbers": [
      "C13"
    ],
    "operator": "東京メトロ"
  },
  "内幸町": {
    "name": "内幸町",
    "kana": "うちさいわいちょう",
    "aliases": [],
    "numbers": [
      "I07"
    ],
    "operator": "都営地下鉄"
  },
  "南阿佐ケ谷": {
    "name": "南阿佐ケ谷",
    "kana": "みなみあさがや",
    "aliases": [],
    "numbers": [
      "M02"
    ],
    "operator": "東京メトロ"
  },
  "南行徳": {
    "name": "南行徳",
    "kana": "みなみぎょうとく",
    "aliases": [],
    "numbers": [
      "T19"
    ],
    "operator": "東京メトロ"
  },
  "南砂町": {
    "name": "南砂町",
    "kana": "みなみすなまち",
    "aliases": [],
    "numbers": [
      "T15"
    ],
    "operator": "東京メトロ"
  },
  "南千住": {
    "name": "南千住",
    "kana": "みなみせんじゅ",
    "aliases": [],
    "numbers": [
      "H21"
    ],
    "operator": "東京メトロ"
  },
  "二重橋前〈丸の内〉": {
    "name": "二重橋前〈丸の内〉",
    "kana": "にじゅうばしまえ",
    "aliases": [
      "二重橋前"
    ],
    "numbers": [
      "C10"
    ],
    "operator": "東京メトロ"
  },
  "日比谷": {
    "name": "日比谷",
    "kana": "ひびや",
    "aliases": [],
    "numbers": [
      "H08",
      "C09",
      "I08"
    ],
    "operator": "東京メトロ"
  },
  "日本橋": {
    "name": "日本橋",
    "kana": "にほんばし",
    "aliases": [],
    "numbers": [
      "G11",
      "T10",
      "A13"
    ],
    "operator": "東京メトロ"
  },
  "入谷": {
    "name": "入谷",
    "kana": "いりや",
    "aliases": [],
    "numbers": [
      "H19"
    ],
    "operator": "東京メトロ"
  },
  "乃木坂": {
    "name": "乃木坂",
    "kana": "のぎざか",
    "aliases": [],
    "numbers": [
      "C05"
    ],
    "operator": "東京メトロ"
  },
  "馬喰横山": {
    "name": "馬喰横山",
    "kana": "ばくろよこやま",
    "aliases": [],
    "numbers": [
      "S09"
    ],
    "operator": "都営地下鉄"
  },
  "馬込": {
    "name": "馬込",
    "kana": "まごめ",
    "aliases": [],
    "numbers": [
      "A02"
    ],
    "operator": "都営地下鉄"
  },
  "白金高輪": {
    "name": "白金高輪",
    "kana": "しろかねたかなわ",
    "aliases": [],
    "numbers": [
      "N03",
      "I03"
    ],
    "operator": "東京メトロ"
  },
  "白金台": {
    "name": "白金台",
    "kana": "しろかねだい",
    "aliases": [],
    "numbers": [
      "N02",
      "I02"
    ],
    "operator": "東京メトロ"
  },
  "白山": {
    "name": "白山",
    "kana": "はくさん",
    "aliases": [],
    "numbers": [
      "I13"
    ],
    "operator": "都営地下鉄"
  },
  "八丁堀": {
    "name": "八丁堀",
    "kana": "はっちょうぼり",
    "aliases": [],
    "numbers": [
      "H12"
    ],
    "operator": "東京メトロ"
  },
  "半蔵門": {
    "name": "半蔵門",
    "kana": "はんぞうもん",
    "aliases": [],
    "numbers": [
      "Z05"
    ],
    "operator": "東京メトロ"
  },
  "板橋区役所前": {
    "name": "板橋区役所前",
    "kana": "いたばしくやくしょまえ",
    "aliases": [],
    "numbers": [
      "I18"
    ],
    "operator": "都営地下鉄"
  },
  "板橋本町": {
    "name": "板橋本町",
    "kana": "いたばしほんちょう",
    "aliases": [],
    "numbers": [
      "I19"
    ],
    "operator": "都営地下鉄"
  },
  "飯田橋": {
    "name": "飯田橋",
    "kana": "いいだばし",
    "aliases": [],
    "numbers": [
      "T06",
      "Y13",
      "N10",
      "E06"
    ],
    "operator": "東京メトロ"
  },
  "氷川台": {
    "name": "氷川台",
    "kana": "ひかわだい",
    "aliases": [],
    "numbers": [
      "Y05",
      "F05"
    ],
    "operator": "東京メトロ"
  },
  "表参道": {
    "name": "表参道",
    "kana": "おもてさんどう",
    "aliases": [],
    "numbers": [
      "G02",
      "C04",
      "Z02"
    ],
    "operator": "東京メトロ"
  },
  "浜町": {
    "name": "浜町",
    "kana": "はまちょう",
    "aliases": [],
    "numbers": [
      "S10"
    ],
    "operator": "都営地下鉄"
  },
  "平和台": {
    "name": "平和台",
    "kana": "へいわだい",
    "aliases": [],
    "numbers": [
      "Y04",
      "F04"
    ],
    "operator": "東京メトロ"
  },
  "宝町": {
    "name": "宝町",
    "kana": "たからちょう",
    "aliases": [],
    "numbers": [
      "A12"
    ],
    "operator": "都営地下鉄"
  },
  "方南町": {
    "name": "方南町",
    "kana": "ほうなんちょう",
    "aliases": [],
    "numbers": [
      "Mb03"
    ],
    "operator": "東京メトロ"
  },
  "豊洲": {
    "name": "豊洲",
    "kana": "とよす",
    "aliases": [],
    "numbers": [
      "Y22"
    ],
    "operator": "東京メトロ"
  },
  "豊島園": {
    "name": "豊島園",
    "kana": "としまえん",
    "aliases": [],
    "numbers": [
      "E36"
    ],
    "operator": "都営地下鉄"
  },
  "北綾瀬": {
    "name": "北綾瀬",
    "kana": "きたあやせ",
    "aliases": [],
    "numbers": [
      "C20"
    ],
    "operator": "東京メトロ"
  },
  "北参道": {
    "name": "北参道",
    "kana": "きたさんどう",
    "aliases": [],
    "numbers": [
      "F14"
    ],
    "operator": "東京メトロ"
  },
  "北千住": {
    "name": "北千住",
    "kana": "きたせんじゅ",
    "aliases": [],
    "numbers": [
      "H22",
      "C18"
    ],
    "operator": "東京メトロ"
  },
  "本郷三丁目": {
    "name": "本郷三丁目",
    "kana": "ほんごうさんちょうめ",
    "aliases": [],
    "numbers": [
      "M21",
      "E08"
    ],
    "operator": "東京メトロ"
  },
  "本駒込": {
    "name": "本駒込",
    "kana": "ほんこまごめ",
    "aliases": [],
    "numbers": [
      "N13"
    ],
    "operator": "東京メトロ"
  },
  "本所吾妻橋": {
    "name": "本所吾妻橋",
    "kana": "ほんじょあづまばし",
    "aliases": [],
    "numbers": [
      "A19"
    ],
    "operator": "都営地下鉄"
  },
  "本八幡": {
    "name": "本八幡",
    "kana": "もとやわた",
    "aliases": [],
    "numbers": [
      "S21"
    ],
    "operator": "都営地下鉄"
  },
  "本蓮沼": {
    "name": "本蓮沼",
    "kana": "もとはすぬま",
    "aliases": [],
    "numbers": [
      "I20"
    ],
    "operator": "都営地下鉄"
  },
  "麻布十番": {
    "name": "麻布十番",
    "kana": "あざぶじゅうばん",
    "aliases": [],
    "numbers": [
      "N04",
      "E22"
    ],
    "operator": "東京メトロ"
  },
  "末広町": {
    "name": "末広町",
    "kana": "すえひろちょう",
    "aliases": [],
    "numbers": [
      "G14"
    ],
    "operator": "東京メトロ"
  },
  "妙典": {
    "name": "妙典",
    "kana": "みょうでん",
    "aliases": [],
    "numbers": [
      "T21"
    ],
    "operator": "東京メトロ"
  },
  "明治神宮前〈原宿〉": {
    "name": "明治神宮前〈原宿〉",
    "kana": "めいじじんぐうまえ",
    "aliases": [
      "明治神宮前",
      "原宿"
    ],
    "numbers": [
      "C03",
      "F15"
    ],
    "operator": "東京メトロ"
  },
  "木場": {
    "name": "木場",
    "kana": "きば",
    "aliases": [],
    "numbers": [
      "T13"
    ],
    "operator": "東京メトロ"
  },
  "目黒": {
    "name": "目黒",
    "kana": "めぐろ",
    "aliases": [],
    "numbers": [
      "N01",
      "I01"
    ],
    "operator": "東京メトロ"
  },
  "門前仲町": {
    "name": "門前仲町",
    "kana": "もんぜんなかちょう",
    "aliases": [],
    "numbers": [
      "T12",
      "E15"
    ],
    "operator": "東京メトロ"
  },
  "有楽町": {
    "name": "有楽町",
    "kana": "ゆうらくちょう",
    "aliases": [],
    "numbers": [
      "Y18"
    ],
    "operator": "東京メトロ"
  },
  "要町": {
    "name": "要町",
    "kana": "かなめちょう",
    "aliases": [],
    "numbers": [
      "Y08",
      "F08"
    ],
    "operator": "東京メトロ"
  },
  "落合": {
    "name": "落合",
    "kana": "おちあい",
    "aliases": [],
    "numbers": [
      "T02"
    ],
    "operator": "東京メトロ"
  },
  "落合南長崎": {
    "name": "落合南長崎",
    "kana": "おちあいみなみながさき",
    "aliases": [],
    "numbers": [
      "E33"
    ],
    "operator": "都営地下鉄"
  },
  "溜池山王": {
    "name": "溜池山王",
    "kana": "ためいけさんのう",
    "aliases": [],
    "numbers": [
      "G06",
      "N06"
    ],
    "operator": "東京メトロ"
  },
  "両国": {
    "name": "両国",
    "kana": "りょうごく",
    "aliases": [],
    "numbers": [
      "E12"
    ],
    "operator": "都営地下鉄"
  },
  "練馬": {
    "name": "練馬",
    "kana": "ねりま",
    "aliases": [],
    "numbers": [
      "E35"
    ],
    "operator": "都営地下鉄"
  },
  "練馬春日町": {
    "name": "練馬春日町",
    "kana": "ねりまかすがちょう",
    "aliases": [],
    "numbers": [
      "E37"
    ],
    "operator": "都営地下鉄"
  },
  "蓮根": {
    "name": "蓮根",
    "kana": "はすね",
    "aliases": [],
    "numbers": [
      "I23"
    ],
    "operator": "都営地下鉄"
  },
  "六本木": {
    "name": "六本木",
    "kana": "ろっぽんぎ",
    "aliases": [],
    "numbers": [
      "H04",
      "E23"
    ],
    "operator": "東京メトロ"
  },
  "六本木一丁目": {
    "name": "六本木一丁目",
    "kana": "ろっぽんぎいっちょうめ",
    "aliases": [],
    "numbers": [
      "N05"
    ],
    "operator": "東京メトロ"
  },
  "和光市": {
    "name": "和光市",
    "kana": "わこうし",
    "aliases": [],
    "numbers": [
      "Y01",
      "F01"
    ],
    "operator": "東京メトロ"
  },
  "茗荷谷": {
    "name": "茗荷谷",
    "kana": "みょうがだに",
    "aliases": [],
    "numbers": [
      "M23"
    ],
    "operator": "東京メトロ"
  }
};

const REGION_LABELS = { tokyo: "東京" };

function linesForRegion() { return LINES; }
function regionSupportsCore() { return false; }

const LINES = [
  {
    "id": "G",
    "name": "銀座線",
    "badge": "G",
    "color": "#F39700",
    "darkText": true,
    "operator": "東京メトロ",
    "region": "tokyo",
    "segments": [
      [
        "浅草",
        "田原町",
        "稲荷町",
        "上野",
        "上野広小路",
        "末広町",
        "神田",
        "三越前",
        "日本橋",
        "京橋",
        "銀座",
        "新橋",
        "虎ノ門",
        "溜池山王",
        "赤坂見附",
        "青山一丁目",
        "外苑前",
        "表参道",
        "渋谷"
      ]
    ]
  },
  {
    "id": "M",
    "name": "丸ノ内線",
    "badge": "M",
    "color": "#E60012",
    "darkText": false,
    "operator": "東京メトロ",
    "region": "tokyo",
    "segments": [
      [
        "池袋",
        "新大塚",
        "茗荷谷",
        "後楽園",
        "本郷三丁目",
        "御茶ノ水",
        "淡路町",
        "大手町",
        "東京",
        "銀座",
        "霞ケ関",
        "国会議事堂前",
        "赤坂見附",
        "四ツ谷",
        "四谷三丁目",
        "新宿御苑前",
        "新宿三丁目",
        "新宿",
        "西新宿",
        "中野坂上",
        "新中野",
        "東高円寺",
        "新高円寺",
        "南阿佐ケ谷",
        "荻窪"
      ],
      [
        "中野坂上",
        "中野新橋",
        "中野富士見町",
        "方南町"
      ]
    ]
  },
  {
    "id": "H",
    "name": "日比谷線",
    "badge": "H",
    "color": "#9CAEB7",
    "darkText": true,
    "operator": "東京メトロ",
    "region": "tokyo",
    "segments": [
      [
        "北千住",
        "南千住",
        "三ノ輪",
        "入谷",
        "上野",
        "仲御徒町",
        "秋葉原",
        "小伝馬町",
        "人形町",
        "茅場町",
        "八丁堀",
        "築地",
        "東銀座",
        "銀座",
        "日比谷",
        "霞ケ関",
        "虎ノ門ヒルズ",
        "神谷町",
        "六本木",
        "広尾",
        "恵比寿",
        "中目黒"
      ]
    ]
  },
  {
    "id": "T",
    "name": "東西線",
    "badge": "T",
    "color": "#00A7DB",
    "darkText": false,
    "operator": "東京メトロ",
    "region": "tokyo",
    "segments": [
      [
        "中野",
        "落合",
        "高田馬場",
        "早稲田",
        "神楽坂",
        "飯田橋",
        "九段下",
        "竹橋",
        "大手町",
        "日本橋",
        "茅場町",
        "門前仲町",
        "木場",
        "東陽町",
        "南砂町",
        "西葛西",
        "葛西",
        "浦安",
        "南行徳",
        "行徳",
        "妙典",
        "原木中山",
        "西船橋"
      ]
    ]
  },
  {
    "id": "C",
    "name": "千代田線",
    "badge": "C",
    "color": "#009944",
    "darkText": false,
    "operator": "東京メトロ",
    "region": "tokyo",
    "segments": [
      [
        "北綾瀬",
        "綾瀬",
        "北千住",
        "町屋",
        "西日暮里",
        "千駄木",
        "根津",
        "湯島",
        "新御茶ノ水",
        "大手町",
        "二重橋前〈丸の内〉",
        "日比谷",
        "霞ケ関",
        "国会議事堂前",
        "赤坂",
        "乃木坂",
        "表参道",
        "明治神宮前〈原宿〉",
        "代々木公園",
        "代々木上原"
      ]
    ]
  },
  {
    "id": "Y",
    "name": "有楽町線",
    "badge": "Y",
    "color": "#D7C447",
    "darkText": true,
    "operator": "東京メトロ",
    "region": "tokyo",
    "segments": [
      [
        "和光市",
        "地下鉄成増",
        "地下鉄赤塚",
        "平和台",
        "氷川台",
        "小竹向原",
        "千川",
        "要町",
        "池袋",
        "東池袋",
        "護国寺",
        "江戸川橋",
        "飯田橋",
        "市ケ谷",
        "麹町",
        "永田町",
        "桜田門",
        "有楽町",
        "銀座一丁目",
        "新富町",
        "月島",
        "豊洲",
        "辰巳",
        "新木場"
      ]
    ]
  },
  {
    "id": "Z",
    "name": "半蔵門線",
    "badge": "Z",
    "color": "#8F76D6",
    "darkText": false,
    "operator": "東京メトロ",
    "region": "tokyo",
    "segments": [
      [
        "渋谷",
        "表参道",
        "青山一丁目",
        "永田町",
        "半蔵門",
        "九段下",
        "神保町",
        "大手町",
        "三越前",
        "水天宮前",
        "清澄白河",
        "住吉",
        "錦糸町",
        "押上〈スカイツリー前〉"
      ]
    ]
  },
  {
    "id": "N",
    "name": "南北線",
    "badge": "N",
    "color": "#00ADA9",
    "darkText": false,
    "operator": "東京メトロ",
    "region": "tokyo",
    "segments": [
      [
        "赤羽岩淵",
        "志茂",
        "王子神谷",
        "王子",
        "西ケ原",
        "駒込",
        "本駒込",
        "東大前",
        "後楽園",
        "飯田橋",
        "市ケ谷",
        "四ツ谷",
        "永田町",
        "溜池山王",
        "六本木一丁目",
        "麻布十番",
        "白金高輪",
        "白金台",
        "目黒"
      ]
    ]
  },
  {
    "id": "F",
    "name": "副都心線",
    "badge": "F",
    "color": "#9C5E31",
    "darkText": false,
    "operator": "東京メトロ",
    "region": "tokyo",
    "segments": [
      [
        "和光市",
        "地下鉄成増",
        "地下鉄赤塚",
        "平和台",
        "氷川台",
        "小竹向原",
        "千川",
        "要町",
        "池袋",
        "雑司が谷",
        "西早稲田",
        "東新宿",
        "新宿三丁目",
        "北参道",
        "明治神宮前〈原宿〉",
        "渋谷"
      ]
    ]
  },
  {
    "id": "A",
    "name": "浅草線",
    "badge": "A",
    "color": "#E85298",
    "darkText": false,
    "operator": "都営地下鉄",
    "region": "tokyo",
    "segments": [
      [
        "西馬込",
        "馬込",
        "中延",
        "戸越",
        "五反田",
        "高輪台",
        "泉岳寺",
        "三田",
        "大門",
        "新橋",
        "東銀座",
        "宝町",
        "日本橋",
        "人形町",
        "東日本橋",
        "浅草橋",
        "蔵前",
        "浅草",
        "本所吾妻橋",
        "押上〈スカイツリー前〉"
      ]
    ]
  },
  {
    "id": "I",
    "name": "三田線",
    "badge": "I",
    "color": "#0079C2",
    "darkText": false,
    "operator": "都営地下鉄",
    "region": "tokyo",
    "segments": [
      [
        "目黒",
        "白金台",
        "白金高輪",
        "三田",
        "芝公園",
        "御成門",
        "内幸町",
        "日比谷",
        "大手町",
        "神保町",
        "水道橋",
        "春日",
        "白山",
        "千石",
        "巣鴨",
        "西巣鴨",
        "新板橋",
        "板橋区役所前",
        "板橋本町",
        "本蓮沼",
        "志村坂上",
        "志村三丁目",
        "蓮根",
        "西台",
        "高島平",
        "新高島平",
        "西高島平"
      ]
    ]
  },
  {
    "id": "S",
    "name": "新宿線",
    "badge": "S",
    "color": "#6CBB5A",
    "darkText": true,
    "operator": "都営地下鉄",
    "region": "tokyo",
    "segments": [
      [
        "新宿",
        "新宿三丁目",
        "曙橋",
        "市ケ谷",
        "九段下",
        "神保町",
        "小川町",
        "岩本町",
        "馬喰横山",
        "浜町",
        "森下",
        "菊川",
        "住吉",
        "西大島",
        "大島",
        "東大島",
        "船堀",
        "一之江",
        "瑞江",
        "篠崎",
        "本八幡"
      ]
    ]
  },
  {
    "id": "E",
    "name": "大江戸線",
    "badge": "E",
    "color": "#B6007A",
    "darkText": false,
    "operator": "都営地下鉄",
    "region": "tokyo",
    "segments": [
      [
        "都庁前",
        "新宿西口",
        "東新宿",
        "若松河田",
        "牛込柳町",
        "牛込神楽坂",
        "飯田橋",
        "春日",
        "本郷三丁目",
        "上野御徒町",
        "新御徒町",
        "蔵前",
        "両国",
        "森下",
        "清澄白河",
        "門前仲町",
        "月島",
        "勝どき",
        "築地市場",
        "汐留",
        "大門",
        "赤羽橋",
        "麻布十番",
        "六本木",
        "青山一丁目",
        "国立競技場",
        "代々木",
        "新宿",
        "都庁前"
      ],
      [
        "都庁前",
        "西新宿五丁目",
        "中野坂上",
        "東中野",
        "中井",
        "落合南長崎",
        "新江古田",
        "練馬",
        "豊島園",
        "練馬春日町",
        "光が丘"
      ]
    ]
  }
];

const ANCHORS = {
  "和光市": [
    160,
    160
  ],
  "地下鉄成増": [
    224,
    192
  ],
  "地下鉄赤塚": [
    288,
    224
  ],
  "平和台": [
    352,
    256
  ],
  "氷川台": [
    416,
    288
  ],
  "小竹向原": [
    480,
    320
  ],
  "千川": [
    544,
    352
  ],
  "要町": [
    608,
    384
  ],
  "池袋": [
    672,
    416
  ],
  "荻窪": [
    64,
    960
  ],
  "中野": [
    128,
    576
  ],
  "中野坂上": [
    320,
    896
  ],
  "方南町": [
    256,
    1088
  ],
  "都庁前": [
    416,
    800
  ],
  "新宿": [
    512,
    896
  ],
  "新宿三丁目": [
    576,
    832
  ],
  "東新宿": [
    576,
    704
  ],
  "明治神宮前〈原宿〉": [
    608,
    1120
  ],
  "代々木上原": [
    288,
    1264
  ],
  "渋谷": [
    576,
    1280
  ],
  "表参道": [
    688,
    1168
  ],
  "青山一丁目": [
    800,
    1056
  ],
  "赤坂見附": [
    912,
    944
  ],
  "四ツ谷": [
    832,
    832
  ],
  "赤羽岩淵": [
    1120,
    0
  ],
  "西高島平": [
    704,
    0
  ],
  "光が丘": [
    192,
    480
  ],
  "北綾瀬": [
    1888,
    0
  ],
  "北千住": [
    1760,
    128
  ],
  "西日暮里": [
    1472,
    256
  ],
  "上野": [
    1536,
    448
  ],
  "後楽園": [
    1120,
    512
  ],
  "春日": [
    1216,
    512
  ],
  "本郷三丁目": [
    1280,
    512
  ],
  "飯田橋": [
    1088,
    640
  ],
  "九段下": [
    1216,
    704
  ],
  "市ケ谷": [
    960,
    768
  ],
  "神保町": [
    1344,
    704
  ],
  "新御茶ノ水": [
    1408,
    640
  ],
  "永田町": [
    1088,
    960
  ],
  "国会議事堂前": [
    1152,
    1088
  ],
  "溜池山王": [
    1152,
    1152
  ],
  "赤坂": [
    1088,
    1216
  ],
  "霞ケ関": [
    1216,
    1152
  ],
  "日比谷": [
    1280,
    1088
  ],
  "大手町": [
    1408,
    832
  ],
  "東京": [
    1408,
    1024
  ],
  "銀座": [
    1408,
    1280
  ],
  "銀座一丁目": [
    1536,
    1280
  ],
  "有楽町": [
    1472,
    1216
  ],
  "桜田門": [
    1280,
    960
  ],
  "三越前": [
    1536,
    768
  ],
  "日本橋": [
    1536,
    960
  ],
  "茅場町": [
    1664,
    1088
  ],
  "人形町": [
    1728,
    896
  ],
  "東銀座": [
    1536,
    1344
  ],
  "新橋": [
    1280,
    1408
  ],
  "六本木": [
    1088,
    1472
  ],
  "麻布十番": [
    1216,
    1600
  ],
  "白金高輪": [
    1344,
    1728
  ],
  "白金台": [
    1344,
    1856
  ],
  "目黒": [
    1344,
    1984
  ],
  "中目黒": [
    896,
    1920
  ],
  "三田": [
    1536,
    1664
  ],
  "大門": [
    1408,
    1536
  ],
  "泉岳寺": [
    1472,
    1792
  ],
  "五反田": [
    1408,
    1984
  ],
  "西馬込": [
    1472,
    2240
  ],
  "月島": [
    1920,
    1472
  ],
  "新木場": [
    2304,
    1728
  ],
  "門前仲町": [
    1920,
    1280
  ],
  "清澄白河": [
    1920,
    1152
  ],
  "森下": [
    1920,
    960
  ],
  "住吉": [
    2112,
    960
  ],
  "本八幡": [
    2688,
    960
  ],
  "西船橋": [
    2944,
    1280
  ],
  "蔵前": [
    1856,
    640
  ],
  "浅草": [
    1984,
    512
  ],
  "押上〈スカイツリー前〉": [
    2304,
    512
  ]
};
