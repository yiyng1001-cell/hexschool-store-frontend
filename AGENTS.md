# AGENTS.md — 前端 (Frontend)

本 repo 為「前後端整合主題電商平台」(2026 企業專題班單人專題) 的**前端**。需求來源：`specs/assignment.md`。後端為獨立 repo，本 repo 不含後端程式碼。

## Constitution (最高準則)

- 不可違反的規則 (架構、測試政策、禁用模式) 定義於 `specs/constitution.md`，**開發前必讀**。
- 每份 spec 進入 plan / 實作前，必須通過 constitution 的 Constitution Check。
- 本檔與 constitution 衝突時，以 `specs/constitution.md` 為準。

## 後端依賴

- 後端 repo：`hexschool-store-backend` (https://github.com/yiyng1001-cell/hexschool-store-backend)，本機相對路徑 `../../hexschool-store-backend/Draft-AGENTS.md`。
- API 契約唯一來源：後端 `openapi.yaml` (部署後於 `/api-docs` 提供 Swagger UI)；不得自行猜測欄位，詳見 constitution `C` 區。
- 後端 constitution：後端 repo 的 `specs/constitution.md`；兩邊衝突時先修後端契約，再改前端。
- 產品定義 (Product)：後端 repo 的 `specs/product.md`，為產品範圍、使用者角色與非目標的唯一來源；前端 spec 引用它，不重複定義產品範圍。

## 技術限制 (硬性)

- 使用 **Vite** 建立專案，**Vue 3 + Composition API** (`<script setup>`)。不使用 Options API。
- 使用 **Tailwind CSS**，全站唯一 CSS 框架，不混用 Bootstrap 等其他框架。
- 元件需合理拆分；使用正確的 **HTML5 語意標籤** (`header` / `nav` / `main` / `section` / `article` / `footer` / `button` 等，避免滿版 `div`)。
- **禁止假資料、禁止 JSON Server、禁止寫死的商品/購物車資料。** 所有資料必須來自自己開發的後端 API。
- API Base URL 與其他設定從環境變數讀取 (`import.meta.env.VITE_*`)，不得寫死於程式碼、不得提交 `.env` 到版本控制 (提供 `.env.example`)。

## 必備頁面

至少包含：
1. 首頁
2. 商品列表頁
3. 登入頁與註冊頁
4. 購物車介面 (Offcanvas、Modal 或獨立頁面皆可)

- 所有頁面**必須 RWD**：手機與桌機皆有合理版面，各斷點不跑版；導覽列與商品排列在行動版/桌機版都要合理。
- 後端有提供單一商品內容，建議實作商品詳情頁。
- 管理員後台頁面**非必要** (後端僅需 API)。

## 功能需求

### 商品列表
- 資料取自後端 API。
- 支援：**分類篩選**、**關鍵字搜尋**、**分頁** (或其他合理的分批載入)。
- 三種狀態都要有明確 UI：**載入中**、**查無結果**、**API 錯誤**。

### 會員與登入狀態
- 前端可註冊、登入、登出。
- 登入狀態**重新整理後必須維持** (Token 持久化，啟動時還原/驗證登入狀態)。
- 請求需帶 JWT Token (如 `Authorization: Bearer`)；Token 過期/無效 (401) 時需合理處理 (清除狀態並導向登入)。
- 未登入使用者嘗試加入購物車時，需有合理處理 (導向登入或彈出引導)，不可無聲失敗。
- 前端的角色判斷 (一般會員/管理員) 僅作 UI 顯示用途，權限以後端為準。

### 購物車與狀態管理 (重點檢核)
- 加入、增減數量、移除商品後，**必須與後端資料同步** (以後端回應為單一事實來源，不只改本地狀態)。
- 加入購物車時給予**明確操作回饋** (toast / 提示 / 按鈕狀態)。
- 處理邊界情況：重複加入、商品不存在、數量不合理 (≤0、超過上限)、API 失敗 (需回復 UI 狀態並提示)。
- 操作進行中顯示 loading / 停用按鈕，避免重複送出。

### 互動與細節 (評分項目)
- Hover 效果、操作回饋、載入狀態呈現、**圖片自適應** (RWD 圖片，避免變形/溢出)。

## 評分重點 (前端 40% + 整合 20%)

- **畫面與 RWD (20%)**：各斷點不跑版。
- **元件化與語意 (10%)**：元件拆分有效、語意標籤正確。
- **互動與細節 (10%)**：hover、回饋、載入狀態、圖片自適應。
- **串接正確性 (5%)**：資料確實來自自己的後端。
- **登入流程 (5%)**：Token 保存與使用、登入狀態維持、登出完整。
- **資料同步 (5%)**：購物車與後端一致。
- **部署環境 (5%)**：部署後整體流程可完整運作。
- 達標：前端部分至少 24 分 (滿分 40)。

## 部署與繳交

- 前端為**獨立 GitHub Repo**，需**獨立部署至雲端**，提供可公開連線的網站 URL；並與已部署的後端 API 實際串接。
- 部署需於 **2026/11/13 ~ 2026/12/04** 保持正常運作，無法連線視同未完成 (不予評分)。
- 繳交期限：**2026/11/24 (二) 23:59** 前寄至 homework@hexschool.com。
- Commit 紀錄需能看出開發過程：小步、有意義的 commit，不要一次大包提交。
- **Commit 訊息與 PR 標題必須遵守 [Conventional Commits](https://www.conventionalcommits.org/)**：`<type>(<scope>): <description>`，例如 `feat(cart): add offcanvas cart panel`。
  - type：`feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `build` / `ci` / `chore` / `revert`。
  - scope 選填 (如 `auth`、`products`、`cart`、`router`)；description 用祈使句、小寫開頭、結尾不加句號。
  - 破壞性變更以 `!` 標示 (`feat(api)!: ...`) 並於 body 加 `BREAKING CHANGE:`。
- SPA 部署需設定 history mode fallback (rewrite 至 `index.html`)，否則重新整理會 404。
- Build 時環境變數 (`VITE_API_BASE_URL`) 需指向**已部署**的後端網址，不可指向 localhost。
- README 須包含：專案主題、選用技術、本機啟動方式、環境變數說明、一般會員與管理員**測試帳號**、前後端部署網址。

## 開發守則 (本專案補充)

- API 呼叫集中於獨立的 service/API 層 (如 `src/api/`)，元件不直接散落 `fetch`/`axios`；統一處理 base URL、Token 注入、錯誤格式。
- 狀態管理 (登入、購物車) 使用 Pinia (TypeScript strict)；I/O 與純運算分離。
- 外部輸入 (表單、API 回應) 在邊界驗證：表單需有前端驗證與錯誤提示 (後端仍為最終驗證)。
- 不在 console/log/原始碼中洩漏 Token 或機密資料。
- 路由守衛 (router guard) 處理需登入頁面；未登入導向登入頁並保留回跳路徑。
