# 🚇 サブウェイ・ゲッサー

東京メトロ9路線と都営地下鉄4路線の路線図を見て、駅名を当てるブラウザーゲームです。

## 遊び方

- タイムアタック：60秒・120秒・300秒。制限時間ごとに歴代ランキングを集計
- エンドレス：1問間違えるまで連続正解に挑戦
- カスタム：東京の地下鉄13路線から好きな路線だけを選択（オンライン対戦にも対応）
- 学習モード：路線図を自由に移動・拡大して全駅名を確認
- オンライン対戦：公開／非公開ルーム、招待コード、リアルタイム得点、チャットと通報
- 日本語入力：漢字・ひらがな・カタカナ・ローマ字・駅ナンバリングで候補検索
- ヒント：駅名のよみがなを1文字おきに表示
- Google／LINEログイン、LINE／Web Share／X／リンクコピーで結果を共有

基本の出題範囲は東京の地下鉄全13路線・216駅で、カスタムでは選択路線だけに絞れます。JR・私鉄・直通先の駅は含みません。公式ランキングは条件を揃えるため全13路線のタイムアタックのみ集計します。

## セットアップ

ゲーム本体は静的サイトとして動作します。韓国版と同じSupabase／Googleログインを共有し、日本版のDBオブジェクトは`jp_`接頭辞で分離します。詳しくは[韓国語セットアップ手順](docs/SETUP_KO.md)をご覧ください。

1. `supabase/schema.sql`を韓国版SupabaseプロジェクトのSQL Editorで実行
2. SupabaseのRedirect URLsに`https://kkigon.github.io/subwayjp/`を追加
3. Googleは韓国版の既存Providerをそのまま利用
4. LINE LoginをCustom OIDC Provider（`custom:line`）として追加

秘密情報（Google Client secret、LINE Channel secret、Supabase service role key）はリポジトリに保存しないでください。

## データとライセンス

- 駅名・よみ・駅番号・座標の基礎データ：[Seo-4d696b75/station_database](https://github.com/Seo-4d696b75/station_database)（CC BY 4.0）
- 路線・駅の現況確認：[東京メトロ](https://www.tokyometro.jp/station/index.html)、[東京都交通局](https://www.kotsu.metro.tokyo.jp/subway/stations/)
- `scripts/generate-tokyo-data.mjs`で取得元データから`js/data.js`を再生成できます。

ゲームのソースコードはリポジトリのライセンス条件に従います。駅データを再利用する場合は、元データのCC BY 4.0表示を維持してください。

## 開発

```bash
node --test tests/*.test.js
node scripts/generate-tokyo-data.mjs
node scripts/build-supabase-schema.mjs
```

`supabase/schema.sql`は分割SQLから自動生成されます。DBを変更するときは分割ファイルを編集し、最後に生成スクリプトを実行してください。
