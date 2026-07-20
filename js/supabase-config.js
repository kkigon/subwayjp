/* ============================================================
   Supabase接続設定

   1. 新しいSupabaseプロジェクトを作成
   2. Project URLとPublishable keyを下へ入力
   3. Auth > ProvidersでCustom OIDC「custom:line」を有効化

   service_role keyやLINE Channel secretをここへ書かないこと。
   ============================================================ */

const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
const LINE_AUTH_PROVIDER = "custom:line";
