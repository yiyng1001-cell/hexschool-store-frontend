# 001 — Auth：註冊、登入與登入狀態

狀態：Done
對應後端：`hexschool-store-backend` 的 `specs/001-auth/spec.md` 與 `openapi.yaml`（Auth 區）。

## 目的

讓訪客在前端註冊、登入、登出，並在重新整理頁面後維持登入狀態。這是購物車（未登入引導）與需登入頁面的前提。

## 後端依賴

| 端點 | 用途 | 後端狀態 |
| --- | --- | --- |
| `POST /api/auth/register` | 註冊並取得 `accessToken` | 契約已定義（`openapi.yaml`），實作待確認 |
| `POST /api/auth/login` | 登入並取得 `accessToken` | 同上 |
| `GET /api/auth/me` | 以 token 還原登入狀態 | 同上 |

契約重點（以 `openapi.yaml` 為準）：
- 回應格式：`{ success: true, data }` 或 `{ success: false, error: { code, message, details? } }`。
- 成功回應 `data: { user, accessToken }`；`user` 為 `id`、`email`、`name`、`role`、`createdAt`。
- Token 為 JWT，有效期 7 天，以 `Authorization: Bearer <token>` 傳遞。
- 請求不得含未定義欄位（尤其 `role`、`isAdmin`），否則 400（S-4）。
- 沒有登出 API、沒有 refresh token。

## 需求

### 功能

1. 訪客可在註冊頁以 `email`、`password`、`name` 註冊；成功後視為已登入。
2. 訪客可在登入頁以 `email`、`password` 登入。
3. 登入或註冊成功後，導向「回跳路徑」；沒有回跳路徑則導向首頁。
4. 已登入使用者可登出：清除本地 token 與使用者資料，導向首頁，不呼叫後端。
5. 重新整理頁面後，以保存的 token 呼叫 `/me` 還原登入狀態；失敗則視為未登入。
6. 導覽列依登入狀態顯示：未登入顯示「登入／註冊」，已登入顯示使用者名稱與「登出」。
7. 需登入的路由（`meta.requiresAuth`）由 router guard 保護：未登入導向登入頁並帶 `redirect` 查詢參數。
8. 已登入使用者造訪登入或註冊頁，導向首頁。

### 狀態機（auth store）

`status`：`unknown`（啟動中，尚未還原）｜`authenticated`｜`anonymous`｜`restoreFailed`（有 token 但因網路錯誤或 5xx 無法確認，可重試）。

- 啟動時：無 token → `anonymous`；有 token → 呼叫 `/me`：
  - 成功 → `authenticated`。
  - 401 `UNAUTHORIZED` → `anonymous` 並清除 token。
  - 網路錯誤或 5xx → `restoreFailed`，**保留 token**，不視為登出。
- `restoreFailed` 時提供「重試」動作（`retryRestoreSession`）：再次呼叫 `/me`，結果依上述規則轉換；重試進行中顯示進行中並停用重試按鈕。
- `unknown` 期間 router guard 等待還原完成，避免已登入者被誤導向登入頁。
- `restoreFailed` 時，需登入路由不導向登入頁，改顯示全頁的「無法確認登入狀態」錯誤與重試按鈕；不需登入的頁面照常顯示，導覽列顯示重試入口。
- 以判別聯合型別表示（已登入時才有 `user`），避免無效組合（constitution 型別與 X-7）。

### Token 保存

- 保存位置：`localStorage`，key 為 `accessToken`；除此之外不存其他敏感資料（S-1）。
- 讀寫集中在單一模組（`lib` 之外的儲存轉接），讀寫皆包 try/catch，儲存不可用時視為未登入，不中斷頁面。
- Token 不出現在 console、錯誤訊息或 URL（S-2）。

### 錯誤處理

| 情境 | 後端回應 | 前端行為 |
| --- | --- | --- |
| 登入帳密錯誤 | 401 `INVALID_CREDENTIALS` | 在表單顯示「email 或密碼錯誤」，**不**導向、**不**清除既有狀態 |
| 註冊 email 重複 | 409 `EMAIL_ALREADY_EXISTS` | 在 email 欄位顯示「此 email 已被註冊」 |
| 欄位驗證失敗 | 400 `VALIDATION_ERROR` + `details` | 依 `details[].field` 在對應欄位顯示 `message` |
| 受保護請求 token 失效 | 401 `UNAUTHORIZED` | 清除 token 與使用者、狀態改 `anonymous`、導向登入頁並帶 `redirect` |
| `/me` 還原失敗（401） | 401 `UNAUTHORIZED` | 靜默轉為 `anonymous`，不彈錯誤 |
| 網路錯誤或 5xx | — | 表單顯示可重試的錯誤；啟動還原時見「`restoreFailed`」，保留 token 並提供重試 |

重要區分（C-5 的細化）：**登入端點的 401 是 `INVALID_CREDENTIALS`，不是登入過期**，全域 401 處理只針對 `UNAUTHORIZED`，並且不套用在 `login` 與 `register` 請求。

### 表單驗證（前端，S-6）

與後端規則一致，僅作即時提示，後端仍為最終驗證：
- `email`：合法格式、最長 254；送出前去頭尾空白。
- `password`：至少 8 字元、最多 **72 bytes（UTF-8）**，需含英文與數字；中文等多位元組字元每字佔 3 bytes，故長度上限以 bytes 計算（後端 `openapi.yaml` 的規則，契約變更見 issue #10）。登入表單只檢查非空，不顯示密碼規則以外的細節。
- `name`（僅註冊）：1～50 字元，去頭尾空白。
- 送出的 body 只包含契約定義的欄位（S-4）。

### 畫面

- **登入頁、註冊頁**（獨立路由，`/login`、`/register`）：
  - 語意標籤：`main` 內 `form`，每個欄位有 `label`，送出為 `button type="submit"`（U-8）。
  - 狀態：送出中停用按鈕並顯示進行中（U-6）、欄位錯誤、表單層級錯誤。
  - 兩頁之間互有連結；登入頁保留 `redirect` 參數到註冊頁。
  - RWD：手機單欄全寬，桌機置中的固定最大寬度卡片（U-7）。
  - 密碼欄位使用 `type="password"` 並設定正確的 `autocomplete`。
- **導覽列**：依 `status` 顯示；`unknown` 時顯示骨架或隱藏登入區，避免閃爍；`restoreFailed` 時顯示「重試」入口。手機版收進選單。
- 互動元件具備 hover 與 focus 樣式（U-9）。

### 回跳路徑安全

- `redirect` 只接受站內路徑（以 `/` 開頭且不以 `//` 開頭），否則忽略並導向首頁，避免開放式重導向。
- 此判斷為 `lib` 純函式並有單元測試。

## 非目標

- 忘記密碼、第三方登入、refresh token、個人資料編輯、角色管理畫面。
- 管理員專屬頁面；前端僅以 `role` 作 UI 顯示用途（S-3）。
- 登入失敗次數限制（後端本期未列入）。

## 驗收條件

- [x] 註冊成功後已登入，導覽列顯示使用者名稱，並導向回跳路徑或首頁。
- [x] 登入成功行為同上；登入失敗（帳密錯誤）停留在登入頁並顯示錯誤，不被導向。
- [x] 重複 email 註冊，email 欄位顯示明確錯誤。
- [x] 後端回 `VALIDATION_ERROR` 時，錯誤顯示在對應欄位。
- [x] 重新整理頁面後仍為登入狀態；token 被竄改或過期時重新整理後為未登入。
- [x] 重新整理時 `/me` 遇到網路錯誤或 5xx：token 保留，顯示「無法確認登入狀態」與重試按鈕，不被導向登入頁；重試成功後恢復已登入。
- [x] 登出後 token 被清除，導覽列回到未登入，重新整理仍為未登入。
- [x] 未登入造訪受保護路由，導向 `/login?redirect=<原路徑>`，登入後回到原路徑。
- [x] 已登入造訪 `/login`、`/register` 導向首頁。
- [x] 任一受保護請求收到 401 `UNAUTHORIZED`，清除登入狀態並導向登入頁。
- [x] `redirect` 為外部網址（如 `https://evil.com`、`//evil.com`）時被忽略。
- [x] 請求 body 不含 `role` 等未定義欄位。
- [x] 送出期間按鈕停用，無法重複送出。
- [x] Token 不出現在 console 輸出。
- [x] 手機與桌機版面皆無跑版。

## 預計新增或修改的檔案

- `src/api/httpClient.ts`：base URL、Token 注入、錯誤正規化（含 `UNAUTHORIZED` 全域回呼，排除 login／register）。
- `src/api/types.ts`：由 `openapi.yaml` 產生。
- `src/api/authApi.ts`：`registerUser`、`loginUser`、`getCurrentUser`。
- `src/api/apiError.ts`：具型別的錯誤類別與錯誤碼。
- `src/stores/authStore.ts`：`useAuthStore`（狀態機、`restoreSession`、`login`、`register`、`logout`）。
- `src/lib/validateAuthForm.ts`、`src/lib/sanitizeRedirectPath.ts`：純函式。
- `src/api/accessTokenStorage.ts`：以可注入的介面包裝 `localStorage`（屬 I/O，故放 `api/` 而非 `lib/`）。
- `src/router/index.ts`、`src/router/guards.ts`：`requiresAuth` 與 `guestOnly` guard。
- `src/views/login/LoginView.vue`、`src/views/register/RegisterView.vue`。
- `src/components/auth/AuthFormField.vue`、`src/components/layout/AppNavbar.vue`。
- 對應的 `*.spec.ts`。

## 測試案例

單元（`lib/`）：
- `validateAuthForm`：email 格式、密碼長度（最少 8 字元、最多 72 bytes，含中文等多位元組字元）與英數規則、`name` 長度、前後空白處理。
- `sanitizeRedirectPath`：站內路徑通過；`//x`、`https://x`、空值、非字串被拒絕。

單元（`api/`、`stores/`，API 以 mock 隔離）：
- `httpClient` 錯誤正規化：400／401 `INVALID_CREDENTIALS`／401 `UNAUTHORIZED`／403／404／409／5xx／網路錯誤。
- `authStore`：註冊與登入成功、各錯誤碼；`restoreSession` 成功、401、無 token、網路錯誤與 5xx（保留 token、進入 `restoreFailed`）；`retryRestoreSession` 成功與再次失敗；`logout` 清除 token；401 `UNAUTHORIZED` 觸發登出；login 的 401 `INVALID_CREDENTIALS` 不觸發登出。

元件與路由：
- 登入、註冊表單：欄位驗證、後端欄位錯誤對應、送出中停用、成功導向。
- Router guard：`requiresAuth`、`guestOnly`、`unknown` 期間等待還原、`restoreFailed` 時顯示重試而非導向登入、`redirect` 回跳。
- 導覽列：未登入、已登入、登出。

## Constitution Check

- [x] **A 架構**：API 呼叫只在 `src/api/`（A-4）；store 呼叫 api，元件經 store（A-2、A-3）；驗證與 redirect 檢查為 `lib/` 純函式（A-5）；設定來自 `VITE_API_BASE_URL`（A-6）；guard 保護需登入頁（A-7）。
- [x] **C 契約**：三個端點皆在 `openapi.yaml`；型別由其產生（C-1～C-3）；錯誤碼正規化，並區分 `INVALID_CREDENTIALS` 與 `UNAUTHORIZED`（C-4、C-5）；本 spec 無列表請求（C-6 不適用）；已列出後端依賴（C-7）。
- [x] **S 安全**：只存 Token（S-1）；不 log Token（S-2）；角色只作 UI 顯示（S-3）；不送 `role` 等欄位（S-4）；不使用 `v-html`（S-5）；表單驗證並提示（S-6）；錯誤訊息不洩漏內部資訊（S-7）。
- [x] **U 體驗**：資料來自後端（U-1）；登入狀態重新整理後維持並可登出（U-3）；送出中停用（U-6）；RWD（U-7）；語意標籤（U-8）；hover／focus（U-9）。商品列表與購物車相關條款（U-2、U-4、U-5）不適用本 spec。
- [x] **T 測試**：`lib/`、`stores/`、`api/` 錯誤正規化與表單、guard 元件測試皆已列出（T-1～T-4）。
- [x] **X 禁用**：無 Options API、假資料、元件內 `fetch`、`v-html`、敏感資料存入 storage、空 `catch`、`any`、就地修改、未處理 rejection。
- 例外與理由：無。

## 驗證紀錄

- **自動化測試**：`lib/`、`api/`、`stores/`、路由守衛與頁面元件測試皆通過（見 `*.spec.ts`）。
- **對真實後端**（本機 `hexschool-store-backend` main，Playwright）：註冊、登入、重新整理維持登入、登出、密碼錯誤停留、`redirect` 回跳、已登入造訪 `/login` 導向首頁、無效 token 被清除、受保護請求 401 導向登入並可回跳、`/me` 無法連線時保留 token 並提供重試（以攔截請求模擬）。
- **版面**：手機（375px）、平板（768px）、桌機（1024px、1280px）皆無橫向溢出；鍵盤 Tab 走訪每個元素皆有 outline 或 ring。
- **規則稽核**：分層依賴方向、禁用模式（`v-html`、`any`、`@ts-ignore`、元件內 `fetch`、儲存 Token 以外的敏感資料、`console.log`、空 `catch`）皆以指令檢查，無違反；所有 `.vue` 均少於 200 行。
- **雲端部署**（2026-11-22，https://hexschool-store-web.onrender.com 對 https://hexschool-store-backend.onrender.com，Playwright）：首頁、商品列表與分頁、分類篩選、商品詳情深層網址重新整理不 404、未登入進 `/cart` 導向登入並回跳、示範會員登入、加入購物車、重新整理後登入與徽章維持、移除、登出清除 token；CORS 預檢（含 `PUT`、`Authorization`）通過，無 console 錯誤。
- **已知限制**：多分頁同步未實作（見取捨）。

## 已知取捨與待決事項

- **啟動時 `/me` 遇到網路錯誤或 5xx**（已決定）：保留 token、進入 `restoreFailed` 並提供重試，避免短暫斷線就把使用者登出；代價是多一個狀態與一個錯誤畫面。
- **Token 存於 `localStorage`**：XSS 時可被讀取，後端設計只發 access token 且無法撤銷；以 S-5（不渲染未淨化 HTML）降低風險，接受此取捨。
- **登出不通知後端**：已發出的 token 到期前仍有效，此為後端設計取捨。
- **多分頁同步**：一個分頁登出，其他分頁不會即時更新，下次請求遇到 401 才處理；本期不實作 `storage` 事件同步。
- 後端若尚未實作端點，前端以契約開發，不得先使用假資料上線（X-2）；本機測試可用測試 mock。
