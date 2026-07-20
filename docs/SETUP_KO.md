# 일본판 서비스 연결 가이드

게임 코드와 데이터베이스 스키마는 준비되어 있습니다. 아래 작업만 계정 소유자인 개발자가 직접 하면 Google·LINE 로그인, 랭킹, 온라인 대전을 활성화할 수 있습니다. 비밀키가 필요한 단계라서 이 부분만 자동으로 대신할 수 없습니다.

## 1. 새 Supabase 프로젝트 만들기

1. Supabase Dashboard에서 새 프로젝트를 만듭니다.
2. `SQL Editor` → `New query`를 열고 [`supabase/schema.sql`](../supabase/schema.sql) 전체를 붙여 넣어 한 번 실행합니다.
3. 실행 후 Table Editor에서 `profiles`, `plays`, `rooms`, `room_messages`, `room_message_reports`, `game_states`가 생성되었는지 확인합니다.
4. `Authentication` → `URL Configuration`에서 다음을 설정합니다.
   - Site URL: `https://kkigon.github.io/subwayjp/`
   - Redirect URLs: `https://kkigon.github.io/subwayjp/`

`schema.sql`은 RLS, 60/120/300초별 역대 랭킹, 공개/비공개 방, 전체/커스텀 노선 대전, 채팅·신고, 서버 권위형 멀티플레이 RPC와 Realtime publication을 함께 설치합니다. 새 프로젝트 전용이므로 한국판 DB의 기록을 섞거나 옮기지 않습니다. 초기판 스키마를 이미 실행했다면 갱신된 `schema.sql`을 다시 한 번 전체 실행해도 됩니다.

## 2. Google 로그인 설정

아래 순서는 [Supabase의 공식 Google 로그인 가이드](https://supabase.com/docs/guides/auth/social-login/auth-google)를 기준으로 합니다.

1. Google Cloud Console에서 프로젝트를 만들고 `Google Auth Platform`의 Branding, Audience를 설정합니다.
2. `Clients` → `Create client`에서 `Web application`을 선택합니다.
3. Supabase Dashboard → `Authentication` → `Providers` → `Google`에 표시되는 Callback URL을 복사합니다. 보통 `https://<project-ref>.supabase.co/auth/v1/callback`입니다.
4. Google OAuth Client의 `Authorized redirect URIs`에 위 Callback URL을 정확히 추가합니다.
5. 생성된 Client ID와 Client secret을 Supabase의 Google Provider에 입력하고 활성화합니다. Client secret은 코드나 GitHub에 넣지 않습니다.
6. Google 앱이 Testing 상태라면 로그인할 계정을 Test users에 추가합니다. 일반 공개 전에는 필요한 동의 화면·게시 절차를 마칩니다.

브라우저 코드는 Supabase의 표준 `google` Provider를 사용하며, 로그인 완료 뒤 `https://kkigon.github.io/subwayjp/`로 돌아옵니다.

## 3. LINE Login 채널 만들기

1. [LINE Developers Console](https://developers.line.biz/console/)에서 Provider를 만들거나 기존 Provider를 선택합니다.
2. `Create a new channel` → `LINE Login`을 고르고 앱 타입은 `Web app`으로 만듭니다.
3. Channel ID와 Channel secret을 따로 보관합니다. Channel secret은 GitHub이나 프론트엔드 코드에 절대 넣지 않습니다.
4. 다음 단계에서 Supabase가 보여 주는 `Callback URL`을 복사합니다. 보통 `https://<project-ref>.supabase.co/auth/v1/callback` 형태입니다.
5. LINE Login 탭의 Callback URL에 그 URL을 정확히 등록합니다.
6. 개발 중에는 본인 LINE 계정을 Tester로 추가하고, 실제 공개 전에는 채널 상태를 Published로 바꿉니다.

이 게임은 이메일을 사용하지 않으므로 LINE의 이메일 권한 신청은 필요 없습니다. 요청 scope는 `openid profile`뿐입니다.

## 4. LINE을 Supabase Custom OIDC로 연결하기

Supabase Dashboard → `Authentication` → `Providers` → `New Provider`에서 다음과 같이 설정합니다.

| 항목 | 값 |
|---|---|
| Configuration | Auto-discovery (OIDC) |
| Identifier | `custom:line` |
| Issuer URL | `https://access.line.me` |
| Client ID | LINE Login Channel ID |
| Client Secret | LINE Login Channel secret |
| Scopes | `openid profile` |
| Email optional | 켬 (`true`) |
| PKCE | 켬, 기본값 유지 |

폼에 표시되는 Callback URL을 먼저 LINE Developers Console에 등록한 다음 Provider를 활성화합니다. LINE의 OIDC discovery 문서는 `https://access.line.me/.well-known/openid-configuration`이며 PKCE `S256`을 지원합니다.

## 5. 공개 설정값만 코드에 넣기

Supabase Dashboard → `Project Settings` → `API`에서 Project URL과 **Publishable key**를 확인합니다. [`js/supabase-config.js`](../js/supabase-config.js)를 다음과 같이 수정합니다.

```js
const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_PUBLISHABLE_KEY";
const LINE_AUTH_PROVIDER = "custom:line";
```

Publishable/anon key는 RLS를 전제로 브라우저에서 사용하는 공개 키입니다. `service_role` key, Google Client secret, LINE Channel secret은 넣으면 안 됩니다. 이 변경을 커밋하고 GitHub Pages가 다시 배포되면 두 로그인과 랭킹·대전 기능이 활성화됩니다.

## 6. 최종 점검

1. 시크릿/로그아웃 창에서 `G Google` 버튼으로 로그인하고, 다시 로그아웃한 뒤 `LINE` 버튼도 확인합니다.
2. 각 Provider의 첫 로그인 후 일본어 닉네임과 테마 노선을 저장합니다.
3. 전체 60초 게임을 끝낸 뒤 랭킹과 마이페이지 기록을 확인합니다. 커스텀 모드는 공식 랭킹에 저장되지 않는 것이 정상입니다.
4. 싱글 커스텀에서 여러 노선을 조합해 문제 범위가 선택한 노선으로 제한되는지 확인합니다.
5. 브라우저 두 개에서 공개방 생성·목록 입장·전체/커스텀 대전 시작·채팅·신고를 점검합니다.
6. 게임 종료 화면의 `LINEで送る`를 눌러 점수 문구와 URL이 LINE 공유 화면에 들어가는지 확인합니다.

## 운영 메모

- 랭킹은 주간 리셋 없이 전체 기간의 사용자별 최고 기록 상위 100명을 시간별로 집계합니다.
- 공식 랭킹은 동일 조건 비교를 위해 전체 13개 노선 타임어택만 수집합니다. 싱글 커스텀·엔드리스·온라인 대전은 저장하지 않습니다.
- 채팅은 클라이언트와 DB 양쪽에서 일본어 비속어, 과도한 반복, 도배와 다중 링크를 차단합니다. 서로 다른 3명의 신고가 쌓이면 메시지가 자동으로 숨겨집니다.
- 오래된 방과 연결 채팅은 Supabase Cron에서 하루 한 번 `select public.cleanup_stale_versus_rooms();`를 실행하도록 등록하면 정리됩니다. 이 함수는 브라우저 역할에 공개되지 않습니다.
- 비공개 방은 공개 목록과 직접 테이블 조회에서 제외되며 정확한 초대 코드를 아는 경우에만 RPC로 조회됩니다.
