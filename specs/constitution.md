# Constitution — 電商前端專案

不可違反的規則。每份 `specs/NNN-feature/spec.md` 必須通過本文件的 **Constitution Check**。
違反任一條 MUST／MUST NOT 的 spec 不得進入實作；需例外時，先修訂本文件（見「修訂流程」）。

規則編號（如 `A-2`）供 spec 與 PR 引用。
本文件與後端 `hexschool-store-backend` 的 constitution 為對應關係：後端 `P-1` 的 `openapi.yaml` 是契約唯一來源，本文件 `C` 區規範前端如何遵循它。

## 技術基線

- Vite、Vue 3（Composition API、`<script setup lang="ts">`）、TypeScript strict。
- 樣式：Tailwind CSS（唯一 CSS 框架）。
- 狀態：Pinia。路由：Vue Router。
- 測試：Vitest、Vue Test Utils。

## A. 架構（Architecture）

- **A-1** 分層固定為 `views → components → stores → api → lib`，依賴只能由上往下；`lib/` 為無 I/O 的純函式。
- **A-2** views 負責頁面組裝與路由參數；components 負責呈現與使用者互動，不直接呼叫 API。
- **A-3** stores（auth、cart）負責跨頁狀態與呼叫 `api/`；元件只透過 store 或 composable 取得資料。
- **A-4** 只有 `src/api/` 可以呼叫 `fetch` / `axios`；base URL、Token 注入、錯誤正規化只在此層實作一次。
- **A-5** 業務與運算邏輯（價格小計、數量檢查、分頁計算）寫成 `lib/` 純函式，與 I/O 分離。
- **A-6** 設定只能來自 `import.meta.env.VITE_*`；提供 `.env.example`，`VITE_API_BASE_URL` 不得寫死。
- **A-7** 需登入頁面以 router guard 保護，未登入導向登入頁並保留回跳路徑。
- **A-8** 所有 `.vue` 使用 Composition API；單一元件只有一個職責，超過 200 行或同時處理 I/O、呈現、運算時必須拆分。
- **A-9** 公開介面（store 的 action／getter、`api/` 函式簽名）只做新增式變更；移除前先標記 deprecated。

## C. 後端契約（Contract）

- **C-1** 後端 repo `hexschool-store-backend` 的 `openapi.yaml` 是 API 契約唯一來源；前端 MUST NOT 自行猜測欄位、路徑或狀態碼。
- **C-2** `src/api/` 的請求與回應型別 MUST 由 `openapi.yaml` 產生（如 `openapi-typescript`）或逐欄對照；不得手寫與契約不一致的型別。
- **C-3** 契約變更先於實作：後端未在 `openapi.yaml` 定義的端點，前端 spec 標為 blocked，不得先以假資料實作。
- **C-4** 回應採後端統一格式；`api/` 層 MUST 將錯誤碼正規化為具型別錯誤，讓 UI 能區分邊界情況（重複加入、商品不存在、數量不合理、越權）。
- **C-5** 狀態碼處理固定：401 清除登入狀態並導向登入；403 顯示權限不足；404 顯示資源不存在；網路或 5xx 顯示可重試的錯誤。
- **C-6** 列表請求 MUST 傳分頁參數且 `limit` 不超過後端上限；分頁、分類、搜尋條件由後端處理，不在前端過濾整份資料。
- **C-7** 每份 spec 的「後端依賴」MUST 列出用到的端點與後端狀態（已部署／僅本機／未實作）。

## S. 安全（Security）

- **S-1** Token 以外的敏感資料（密碼、個資）MUST NOT 存入 `localStorage` / `sessionStorage`。
- **S-2** Token、密碼、機密 MUST NOT 出現在 `console`、日誌、錯誤訊息、原始碼或版本紀錄；`.env` 不進版控。
- **S-3** 前端角色判斷只供 UI 顯示；權限以後端為準，前端 MUST NOT 以隱藏按鈕取代授權。
- **S-4** 前端 MUST NOT 向後端傳送 `role`、`isAdmin`、`userId`（購物車以 Token 身分為準）、價格等應由伺服器決定的欄位。
- **S-5** 外部或使用者提供的內容 MUST NOT 以 `v-html` / `innerHTML` 渲染；確需渲染 HTML 時先淨化並在 spec 說明。
- **S-6** 表單輸入在邊界驗證並明確提示錯誤；前端驗證不取代後端驗證。
- **S-7** 對使用者顯示的錯誤訊息不得洩漏堆疊或內部細節。

## U. 使用者體驗與功能底線（UX）

- **U-1** 所有資料 MUST 來自自己的後端 API。
- **U-2** 商品列表 MUST 支援分類篩選、關鍵字搜尋、分頁，且 MUST 有「載入中／查無結果／API 錯誤」三種狀態 UI。
- **U-3** 登入狀態 MUST 在重新整理後維持，MUST 提供登出。
- **U-4** 未登入加入購物車 MUST 有引導，MUST NOT 無聲失敗。
- **U-5** 購物車加入、增減、移除 MUST 先打後端，以後端回應更新畫面；樂觀更新失敗 MUST 回復並提示。
- **U-6** 購物車操作 MUST 有明確回饋，進行中 MUST 停用觸發元件以防重複送出。
- **U-7** 所有頁面 MUST RWD（手機與桌機皆無跑版），圖片 MUST 自適應。
- **U-8** MUST 使用 HTML5 語意標籤；可點擊行為 MUST 使用 `button` 或 `a`。
- **U-9** 互動元件 MUST 有 hover 與 focus 狀態。

## T. 測試（Testing）

- **T-1** `lib/` 純函式 MUST 有單元測試，不需 API 或 DOM 即可執行。
- **T-2** `stores/`（auth、cart）MUST 有單元測試，API 以 mock 隔離，涵蓋成功、失敗與邊界情況（數量 ≤0、重複加入、401）。
- **T-3** 關鍵流程 MUST 有元件測試（Vue Test Utils）：登入／註冊表單、商品列表三態、加入購物車（含未登入引導）、購物車數量調整與移除。
- **T-4** `src/api/` 的錯誤正規化 MUST 有測試，涵蓋 C-5 的每種狀態碼。
- **T-5** 修 bug 時先補一個重現的失敗測試。
- **T-6** 合併前 `lint`、`type-check`、`test`、`build` MUST 全數通過；不得以跳過（skip）或註解掩蓋失敗。
- **T-7** 測試 MUST 確定性，不依賴真實時間、網路或隨機。

## X. 禁用模式（Banned）

- **X-1** Options API。
- **X-2** 假資料、寫死的商品或購物車資料、JSON Server，或任何 runtime mock 資料來源（僅測試中的 mock 例外）。
- **X-3** 元件、view 或 `lib/` 中直接呼叫 `fetch` / `axios`。
- **X-4** `v-html` / `innerHTML` 渲染未淨化內容。
- **X-5** 在 `localStorage` / `sessionStorage` 存 Token 以外的敏感資料，或 log Token。
- **X-6** 空 `catch`、吞錯誤、或只 `console.log` 後繼續；catch 必須重新拋出或轉成具型別錯誤並讓 UI 顯示。
- **X-7** TypeScript `any`、`@ts-ignore`、`eslint-disable`（除非附原因與 issue 連結；`any` 改用 `unknown` 並縮小型別）。
- **X-8** 就地修改（mutate）傳入的參數或共享狀態；資料轉換以複製或 map／filter／reduce 完成。
- **X-9** 未處理的 Promise rejection、async 流程遺漏 `await`。
- **X-10** 混用 Tailwind 以外的 CSS 框架。
- **X-11** 提交 `.env` 或機密；build 時 `VITE_API_BASE_URL` 指向 localhost。

## 文件與交付

- **P-1** README MUST 含：主題、技術、本機啟動方式、環境變數、一般會員與管理員測試帳號、前後端部署網址。
- **P-2** Commit 與 PR 標題遵守 Conventional Commits（`<type>(<scope>): <description>`），描述變更內容與原因，不敘述產出過程。
- **P-3** Commit 小步、可看出開發過程。
- **P-4** 前端 MUST 獨立部署並對已部署後端串接，SPA 設定 history fallback；部署網址於 2026/11/13 ~ 2026/12/04 保持可連線。

## Spec 流程

- 每個功能一個資料夾：`specs/NNN-feature/spec.md`。
- 每份 spec MUST 包含：需求、畫面與狀態（載入／空／錯誤／未登入）、**後端依賴**（端點與後端狀態）、驗收條件、**Constitution Check**。
- Constitution Check 範本（逐條勾選，不適用請註明原因）：

```md
## Constitution Check
- [ ] A 架構：分層與依賴方向符合 A-1～A-9
- [ ] C 契約：端點皆存在於後端 openapi.yaml，型別對齊，錯誤與狀態碼處理符合 C-1～C-7
- [ ] S 安全：Token、角色、輸入渲染處理符合 S-1～S-7
- [ ] U 體驗：狀態 UI、RWD、語意標籤、購物車同步符合 U-1～U-9
- [ ] T 測試：已列出 lib／store／元件測試案例，含邊界情況 T-1～T-7
- [ ] X 禁用：未使用 X-1～X-11 任一模式
- 例外與理由：（無則填「無」）
```

## 修訂流程

- 修改本文件需獨立 commit（`docs(constitution): ...`），說明修改原因與影響的規則編號。
- 已通過的 spec 若受修訂影響，需在同一個 PR 重新做 Constitution Check。
- 規則編號不重用；刪除規則時保留編號並標記 `(removed)`。
- 後端 constitution 或 `openapi.yaml` 的契約相關規則變動時，需檢視本文件 `C` 區是否同步修訂。
