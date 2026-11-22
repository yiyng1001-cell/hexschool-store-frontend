# 003 — Cart：購物車

狀態：Done
對應後端：`hexschool-store-backend` 的 `specs/003-cart/spec.md` 與 `openapi.yaml`。
依賴：`001-auth`（登入狀態、`requiresAuth` 路由、401 處理、`restoreFailed` 畫面）、`002-products`（商品卡片、商品詳情、`ProductImage`、`formatPrice`）。

## 目的

讓登入的會員將商品加入購物車、調整數量、移除商品並查看內容，且畫面始終與後端資料一致。這是作業的重點檢核項目（購物車與後端同步）。

## 後端依賴

| 端點 | 用途 | 契約狀態 |
| --- | --- | --- |
| `GET /api/cart` | 取得購物車 | 契約已定義（`openapi.yaml`），已對真實後端驗證 |
| `PUT /api/cart/items/{productId}` | 設定數量（沒有則新增） | 契約已定義（`openapi.yaml`），已對真實後端驗證 |
| `DELETE /api/cart/items/{productId}` | 移除項目 | 契約已定義（`openapi.yaml`），已對真實後端驗證 |

`blocked` 已解除：後端 `openapi.yaml` 已收錄上述端點與 `Cart`、`CartItem` schema，與本 spec 逐項對照後無出入，型別依 C-2 產生。購物車已滿的錯誤為 400 `VALIDATION_ERROR` 且 `details` 的 `field` 為 `productId`，前端以此判斷。

契約重點（以後端 spec 為準，待 `openapi.yaml` 確認）：
- 三支 API 皆需 access token；身分取自 token，網址與 body 不含 `userId`。
- **`PUT` 是「設定數量」不是「累加」**：body `{ quantity }`，整數 1～99；沒有該項目就新增。三支 API 都回傳完整的 `cart`。
- `cart`：`items[]`（`product`、`quantity`、`subtotal`、`available`）、`itemCount`、`totalQuantity`、`totalPrice`。
- `available: false`（商品已被下架）的項目仍回傳，但不計入 `totalQuantity` 與 `totalPrice`；此類項目 `PUT` 會得到 404，只能 `DELETE`。
- 品項上限 50 種；新增第 51 種回 400 `VALIDATION_ERROR`（`details` 說明購物車已滿），既有項目仍可改數量。
- `PUT` 的商品不存在、已刪除或 id 格式不符、`DELETE` 的項目不在購物車中：404 `NOT_FOUND`。
- 未登入、token 失效：401 `UNAUTHORIZED`。

## 需求

### 設計決策

1. **以頁面呈現購物車**（`/cart`，`requiresAuth`），導覽列顯示數量徽章。理由：直接使用既有的路由守衛與 `restoreFailed` 畫面、容易測試與分享，不需要額外的 Offcanvas 焦點管理。作業允許頁面形式。
2. **不做樂觀更新**：任何變更先送後端，收到回應後才以回應的 `cart` 覆蓋本地狀態（U-5）。失敗時畫面不變、顯示錯誤。
3. **前端不計算金額**：`subtotal`、`totalQuantity`、`totalPrice` 一律顯示後端回傳值（S-4）。
4. **變更序列化**：所有購物車變更經單一佇列依序送出，避免多個回應亂序到達時，較舊的狀態覆蓋較新的。

### 功能

1. **載入購物車**：登入後（含重新整理還原登入後）自動載入；登出時清空本地購物車狀態。
2. **加入購物車**：商品卡片與商品詳情頁各有「加入購物車」按鈕。
   - 數量計算：已在購物車內則為目前數量 + 1，否則為 1，再以 `PUT` 設定。
   - 因 `PUT` 是設定語意，**購物車尚未載入完成時不得送出加入**：先載入，載入失敗則顯示錯誤並不送出，避免把既有數量覆蓋成 1。
   - 已達 99 時按鈕停用並提示「已達單項上限」。
   - 成功後顯示 toast「已加入購物車」並附前往購物車的連結；按鈕在請求中停用並顯示進行中。
3. **未登入加入**：不呼叫 API，導向 `/login?redirect=<目前路徑>` 並顯示 toast「請先登入」；登入後回到原頁面，**不會自動加入**（需使用者再次點擊）。
4. **購物車頁**（`/cart`）：
   - 列出項目（圖片、名稱、單價、數量調整、小計、移除），並顯示 `totalQuantity` 與 `totalPrice`。
   - 數量以「－」「＋」按鈕調整，範圍 1～99；數量 1 時「－」停用（移除請用「移除」按鈕）；99 時「＋」停用。
   - 移除前不需確認對話框，成功後顯示 toast「已移除」。
   - 商品名稱與圖片連到商品詳情。
5. **不可購買的項目**（`available: false`）：以不同樣式顯示並標示「已下架」，不可調整數量、只能移除，且不計入總計。若商品詳情已 404，連結停用。
6. **導覽列徽章**：顯示 `totalQuantity`（0 時不顯示徽章）；僅在登入且購物車已載入時顯示。

### 購物車狀態（cart store）

`status`：`idle`（未登入或尚未載入）｜`loading`｜`ready`（含 `cart`）｜`error`。

- 登入成功或還原登入後 `idle → loading → ready | error`；登出（`anonymous`）時回到 `idle` 並清除資料。
- 以判別聯合型別表示，只有 `ready` 才有 `cart`（無效組合不可建立）。
- `pendingProductIds`：正在變更中的商品 id 集合，供 UI 停用對應控制項。
- 重新載入（`reload`）失敗時保留舊的 `cart` 並顯示錯誤，不清空畫面。

### 錯誤處理

| 情境 | 後端回應 | 前端行為 |
| --- | --- | --- |
| 載入購物車失敗 | 網路錯誤、5xx | 購物車頁顯示錯誤與重試；導覽列徽章不顯示 |
| token 失效 | 401 `UNAUTHORIZED` | 沿用 `001-auth`：清除登入、導向登入頁並帶回跳路徑 |
| 加入或調整時商品已下架 | 404 `NOT_FOUND` | toast「商品已下架」並重新載入購物車（該項目會變成不可購買） |
| 數量不合理 | 400 `VALIDATION_ERROR` | toast 顯示訊息並重新載入購物車（理論上前端已擋，視為與後端狀態不一致） |
| 購物車已滿（第 51 種） | 400 `VALIDATION_ERROR`（`details` 說明已滿） | toast「購物車已滿（最多 50 種商品）」；訊息以 `details` 為準，無則用預設文字 |
| 移除時項目已不在 | 404 `NOT_FOUND` | 視為已移除：重新載入購物車，toast「項目已不存在」 |
| 網路錯誤或 5xx | — | toast「操作失敗，請重試」；畫面維持原狀 |

### 回饋與狀態（U-6）

- toast 以全域的 `ToastHost` 呈現（`role="status"` / `role="alert"`），數秒後自動消失，可手動關閉；同時只顯示有限數量（超過時最舊的先移除）。
- 變更進行中，對應項目的控制項停用並顯示進行中；不同商品的變更依佇列依序送出。
- 購物車頁狀態：載入中（骨架）、空（引導前往商品列表）、錯誤（重試）、有資料。

### 畫面與 RWD（U-7、U-8、U-9）

- 語意標籤：購物車頁 `main`；項目清單 `ul`/`li`；總計區 `section`（含 `aria-live="polite"` 的總計文字）；按鈕皆為 `button`，數量調整按鈕具 `aria-label`（如「增加 {商品名稱} 的數量」）。
- 桌機：項目為橫列（圖片、資訊、數量、小計、移除）加右側（或下方）總計區；手機：項目為堆疊卡片，總計區固定在內容下方。各斷點無橫向捲軸。
- 圖片使用既有的 `ProductImage`（固定比例、失敗替代圖）。
- 所有按鈕有 hover、focus、disabled 樣式。

## 非目標

- 結帳、訂單、金流；「清空購物車」（後端本期不提供）。
- 樂觀更新、離線佇列、多分頁即時同步（見取捨）。
- 優惠券、庫存顯示、價格快照。
- Offcanvas 形式的購物車。

## 驗收條件

- [x] 未登入點「加入購物車」：不呼叫 API，導向登入頁並帶回跳路徑，顯示「請先登入」；登入後回到原頁面且購物車未被自動加入。
- [x] 登入後加入商品：送出 `PUT` 且 `quantity` 為 1，成功後顯示 toast，導覽列徽章更新。
- [x] 對同一商品再次加入：`PUT` 的 `quantity` 為目前數量 + 1（不是 1）。
- [x] 購物車尚未載入完成或載入失敗時，加入不會送出請求。
- [x] 數量達 99 時「加入」與「＋」皆停用；數量為 1 時「－」停用。
- [x] 調整數量、移除後，畫面內容與總計皆等於後端回傳的 `cart`（前端不自行計算）。
- [x] 請求進行中，對應控制項停用，無法重複送出；連續點擊不會產生亂序覆蓋。
- [x] 重新整理頁面後，購物車內容與後端一致（自動重新載入）。
- [x] 登出後購物車狀態與徽章清除；換另一個帳號登入看到的是該帳號的購物車。
- [x] 商品已被下架的項目顯示「已下架」、不可調整數量、可移除，且不計入總計。
- [x] 加入時回 404：顯示「商品已下架」並重新載入；回 400（購物車已滿）：顯示對應訊息，畫面其餘內容不變。
- [x] 網路錯誤或 5xx：toast 顯示錯誤、畫面維持原狀；購物車頁載入失敗時可重試。
- [x] token 失效時（任何購物車請求回 401）導向登入頁並可回跳。
- [x] `restoreFailed` 時進入購物車頁顯示「無法確認登入狀態」與重試，不被導向登入頁。
- [x] 購物車為空時顯示引導前往商品列表。
- [x] 手機與桌機版面皆無跑版；鍵盤可操作所有按鈕。

## 預計新增或修改的檔案

- `src/api/types.ts`：重新產生，含 `Cart`、`CartItem`。
- `src/api/cartApi.ts`：`getCart`、`setCartItemQuantity`、`removeCartItem`（皆需 token；`handleUnauthorized` 使用預設，由 `001-auth` 的全域處理接手）。
- `src/lib/cartRules.ts`：`MAX_ITEM_QUANTITY`、`calculateQuantityAfterAdd`、`canIncreaseQuantity`、`canDecreaseQuantity`（純函式）。
- `src/lib/cartFailure.ts`：`CartFailure` 與 `describeCartFailure`（訊息對照）。
- `src/stores/cartStore.ts`：`useCartStore`（狀態機、載入、加入、設定數量、移除、變更佇列、`pendingProductIds`、`reset`）。排入佇列的工作會記下排入時的 session，執行時 session 已改變（登出、換帳號）就略過，避免舊工作以新身分送出。
- `src/stores/toCartFailure.ts`：API 錯誤對應為 `CartFailure`。
- `src/stores/toastStore.ts`：`useToastStore`（顯示與移除，有上限）。
- `src/composables/useCartSync.ts`：依 `authStore.status` 載入或清空購物車。
- `src/composables/useCartActions.ts`：封裝「未登入導向登入、加入、調整數量、移除與回饋」流程，供卡片、詳情頁與購物車頁共用。
- `src/components/cart/AddToCartButton.vue`、`CartItemRow.vue`、`CartSummary.vue`、`CartQuantityStepper.vue`。
- `src/components/ui/ToastHost.vue`。
- `src/components/product/ProductCard.vue`、`src/views/productDetail/ProductDetailView.vue`：加入按鈕；`src/api/httpClient.ts`：新增 `PUT`（卡片的按鈕放在連結之外，避免巢狀互動元素）。
- `src/components/layout/AppNavbar.vue`：購物車連結與數量徽章。
- `src/views/cart/CartView.vue`。
- `src/router/index.ts`：`/cart`，`meta.requiresAuth`。
- `src/App.vue`：掛載 `ToastHost` 與 `useCartSync`。
- 對應的 `*.spec.ts`；補上 `001-auth` 欠缺的 `restoreFailed` 全頁畫面測試。

## 測試案例

單元（`lib/`）：
- `calculateQuantityAfterAdd`：無該項目 → 1；已有 n → n + 1；已達 99 → 不可加入。
- `canIncreaseQuantity`／`canDecreaseQuantity` 於 1、2、98、99 的結果。
- `describeCartFailure` 對各失敗種類的訊息，含「購物車已滿」以 `details` 為準與預設文字。

單元（`api/`、`stores/`，API 以 mock 隔離）：
- `cartApi`：路徑與 body 正確、商品 id 經過編碼、token 注入。
- `cartStore`：載入成功、失敗；加入（新項目、既有項目、尚未載入時不送出）；設定數量；移除；各錯誤碼對應的失敗種類與是否重新載入；變更依序執行（先送出的先完成、後到的回應不會覆蓋較新的）；進行中的 `pendingProductIds`；重複點擊被擋下；`reset` 清除；`reload` 失敗保留舊資料。
- `toastStore`：新增、移除、超過上限時移除最舊的。

元件：
- `AddToCartButton`／`useCartActions`：未登入導向登入且不呼叫 API；已登入加入並顯示 toast；99 時停用；進行中停用。
- `CartView`：載入中、空、錯誤重試、有資料、不可購買項目、調整與移除後畫面等於後端回應。
- `AppNavbar`：徽章數量、0 時隱藏、登出後消失。
- `useCartSync`：登入後載入、登出後清空、換帳號重新載入。
- App 層：`restoreFailed` 時進入 `requiresAuth` 的 `/cart` 顯示重試畫面。

## Constitution Check

- [x] **A 架構**：API 只在 `src/api/`（A-4）；元件經 store 或 composable 取得資料（A-2、A-3）；加入數量與按鈕可用性為 `lib/` 純函式（A-5）；設定來自 `VITE_API_BASE_URL`（A-6）；`/cart` 以 router guard 保護（A-7）。
- [x] **C 契約**：端點皆已收錄於 `openapi.yaml`（blocked 已解除），型別由其產生（C-1～C-3）；錯誤碼正規化、401 沿用全域處理（C-4、C-5）；購物車無列表分頁（品項上限 50，C-6 不適用）；已列出後端依賴（C-7）；契約變更依 C-8 開 issue。
- [x] **S 安全**：不送 `userId`、價格等欄位，只送 `quantity`（S-4）；金額一律採用後端值；Token 處理沿用 `001-auth`（S-1、S-2）；商品名稱以文字渲染，不使用 `v-html`（S-5）；toast 訊息不洩漏內部資訊（S-7）。
- [x] **U 體驗**：資料來自後端（U-1）；未登入加入有引導（U-4）；變更先打後端再以回應更新，失敗不改畫面（U-5）；明確回饋與進行中停用（U-6）；RWD（U-7）；語意標籤（U-8）；hover 與 focus（U-9）。
- [x] **T 測試**：`lib/`、`stores/`、`api/`、composable 與關鍵流程元件測試皆已列出（T-1～T-4），邊界情況（數量上下限、重複加入、下架、已滿、401）皆有案例。
- [x] **X 禁用**：無 Options API、假資料、元件內 `fetch`、`v-html`、空 `catch`、`any`、就地修改（store 以複製更新）、未處理 rejection。
- 例外與理由：無。

## 驗證紀錄

- **自動化測試**：`lib/`、`api/`、`stores/`（含變更佇列、重複點擊、登出與換帳號時丟棄舊回應）、購物車頁、加入按鈕、導覽列徽章與 `useCartSync` 測試皆通過。
- **對真實後端**（本機 `hexschool-store-backend` main，Playwright）：匿名加入導向登入、加入與再加入（現有數量 + 1）、畫面與後端的數量及總計一致、重新整理保留、移除與空購物車、登出清除並換帳號看到自己的購物車、登入中 token 被竄改時 401 導向登入並可回跳、`/me` 無法連線時進入 `/cart` 顯示重試畫面、管理員下架商品後該項目標示「已下架」且不計入總計並可移除、加入剛被下架的商品顯示「商品已下架」且購物車不變、購物車達 50 種後第 51 種顯示後端訊息且既有項目仍可調整。
- **版面**：手機（375px）與桌機購物車頁無橫向溢出；各情境截圖已檢視。
- **規則稽核**：同 `001-auth`；另確認所有 Token 不出現在跨流程的 console 輸出。
- **已知限制**：未在雲端部署環境驗證；數量上限 99 以測試與按鈕停用驗證，未對真實後端造出數量 99 的情境；跨分頁同步未實作（見取捨）。

## 已知取捨與待決事項

- **`PUT` 是設定語意帶來的風險**：本機的購物車若過期（例如另一個分頁已改過數量），「目前數量 + 1」會以舊值為準，結果是最後寫入為準。前端因此在加入前要求購物車已載入，並在每次回應後以後端資料覆蓋；跨分頁的即時同步本期不做，與後端的取捨一致。
- **變更佇列使連續操作變慢**：每個變更等前一個完成才送出，換來回應不會亂序；操作量小，可接受。
- **不做樂觀更新**：UI 反應會晚一個請求的時間，以進行中狀態補償；但保證畫面等於後端。
- **登入後不自動加入原本想加的商品**：避免出人意料的副作用，代價是多一次點擊。
- **購物車頁而非 Offcanvas**：之後若要改為 Offcanvas，可在不改 store 與 API 層的前提下，只替換畫面（新增式）。
- 徽章與購物車資料僅在登入後載入；後端沒有「購物車數量」專用端點，故以完整的 `GET /api/cart` 取得。
