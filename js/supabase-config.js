/* ============================================================
   Supabase接続設定

   韓国版と同じSupabaseプロジェクトを共有する。
   日本版のDBオブジェクトはすべてjp_接頭辞で分離されている。
   Google Providerは韓国版の設定をそのまま利用し、
   LINEだけCustom OIDC「custom:line」を追加で有効化する。

   service_role key、Google Client secret、LINE Channel secretをここへ書かないこと。
   ============================================================ */

const SUPABASE_URL = "https://zsamoefsfjkhqiinwepu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYW1vZWZzZmpraHFpaW53ZXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTYyNjIsImV4cCI6MjA5NzAzMjI2Mn0.I934jTZ-Oec0hSj3QRJDepfOhNAIjMDEWhr-I61ChHg";
const LINE_AUTH_PROVIDER = "custom:line";
