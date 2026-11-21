# Constitution — 前端不可違反的規則

版本：1.0.0　｜　適用範圍：本 repo 所有 spec、plan、task 與程式碼。
來源：`specs/assignment.md`（作業硬性要求）與專案決策。

**規則等級**：`MUST` / `MUST NOT` 不可違反，違反即 spec 不通過。`SHOULD` 需有書面理由才可例外。
**修改方式**：只能以獨立 PR (`docs(constitution): ...`) 修改，並更新版本號與變更紀錄；不可在功能 PR 中順手改。

---

## 1. 架構規則

- A1. MUST 使用 Vite + Vue 3 + Composition API (`<script setup lang="ts">`)。
- A2. MUST 使用 TypeScript `strict`；MUST NOT 使用 `any`（確有必要需 `unknown` + 型別縮小，並註明原因）。
- A3. MUST 使用 Tailwind CSS，全站唯一 CSS 框架；MUST NOT 混用 Bootstrap 等其他框架。
- A4. MUST 將 API 呼叫集中於 `src/api/`；元件、store 以外的層不得直接呼叫 `fetch` / `axios`。base URL、Token 注入、錯誤正規化只在此層實作一次。
- A5. MUST 以 Pinia 管理跨頁狀態（auth、cart）；元件本地狀態用 `ref` / `reactive`。
- A6. MUST 分層：`views`（頁面）→ `components`（呈現）→ `stores`（狀態）→ `api`（I/O）→ `lib`（純函式）。下層不得 import 上層；業務/運算邏輯寫成純函式，與 I/O 分離。
- A7. MUST 以 `import.meta.env.VITE_*` 讀取設定；`VITE_API_BASE_URL` 不得寫死，MUST 提供 `.env.example`。
- A8. MUST 使用 Vue Router，需登入頁面以 router guard 保護，未登入導向登入頁並保留回跳路徑。
- A9. MUST 使用 HTML5 語意標籤（`header`/`nav`/`main`/`section`/`article`/`footer`/`button`）；可點擊行為 MUST 使用 `button` 或 `a`，MUST NOT 用 `div @click`。
- A10. MUST RWD：所有頁面在手機與桌機皆無跑版；圖片 MUST 自適應（不變形、不溢出）。
- A11. 資料正確性：MUST 以後端回應為單一事實來源。購物車任何變更 MUST 先打後端、再以回應更新畫面；樂觀更新失敗 MUST 回復並提示。

## 2. 功能底線（作業必過項）

- F1. 所有資料 MUST 來自自己的後端 API。
- F2. 商品列表 MUST 支援分類篩選、關鍵字搜尋、分頁，且 MUST 有「載入中 / 查無結果 / API 錯誤」三種 UI。
- F3. 登入狀態 MUST 在重新整理後維持；MUST 提供登出；401 MUST 清除登入狀態並導向登入。
- F4. 未登入加入購物車 MUST 有引導，MUST NOT 無聲失敗。
- F5. 購物車增減/移除/加入 MUST 有明確操作回饋，進行中 MUST 停用觸發元件以防重複送出。
- F6. 前端角色判斷僅供 UI 顯示；權限以後端為準。

## 3. 測試政策

- T1. 測試工具：Vitest + Vue Test Utils；API 以 mock 隔離（不打真實後端）。
- T2. `lib/`（純函式）與 `stores/`（auth、cart）MUST 有單元測試，覆蓋成功、失敗、邊界（數量 ≤0、重複加入、401）。
- T3. 關鍵流程 MUST 有元件層級測試：登入/註冊表單、商品列表（含載入/空/錯誤三態）、加入購物車（含未登入引導）、購物車數量調整與移除。
- T4. `src/api/` 的錯誤正規化 MUST 有測試。
- T5. 修 bug MUST 先補重現的失敗測試。
- T6. 合併前 `lint`、`type-check`、`test`、`build` MUST 全數通過；失敗的測試 MUST NOT 以 skip / 註解方式略過。
- T7. 測試 MUST 確定性：不依賴真實時間、網路、隨機。

## 4. 禁用模式（Banned）

- B1. MUST NOT 使用 Options API。
- B2. MUST NOT 使用假資料、寫死的商品/購物車資料、JSON Server 或任何 runtime mock 資料來源（僅測試中的 mock 例外）。
- B3. MUST NOT 在元件內直接呼叫 `fetch` / `axios`（見 A4）。
- B4. MUST NOT 使用 `v-html` 或 `innerHTML` 渲染外部/使用者提供的內容；確需渲染 HTML 時 MUST 先經淨化並在 spec 中說明。
- B5. MUST NOT 在 `localStorage` / `sessionStorage` 存放 Token 以外的敏感資料（如密碼、個資、完整使用者物件中的敏感欄位）。
- B6. MUST NOT 在 `console`、log、錯誤訊息、原始碼中輸出或寫入 Token、密碼、機密。
- B7. MUST NOT 提交 `.env` 或任何機密到 git。
- B8. MUST NOT 在 `.vue` 檔案中堆疊超過一個職責的大型元件（>200 行或同時處理 I/O + 呈現 + 運算須拆分）。
- B9. MUST NOT 以 `// @ts-ignore`、`eslint-disable` 繞過檢查，除非附上原因與 issue 連結。

## 5. 交付與流程

- D1. Commit 訊息與 PR 標題 MUST 遵守 Conventional Commits：`<type>(<scope>): <description>`；type 為 `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`；破壞性變更加 `!` 與 `BREAKING CHANGE:`。
- D2. Commit MUST 小步、可看出開發過程。
- D3. 前端 MUST 獨立部署並對已部署後端串接；build 的 `VITE_API_BASE_URL` MUST NOT 指向 localhost；SPA MUST 設定 history fallback。
- D4. 部署網址 MUST 於 2026/11/13 ~ 2026/12/04 保持可連線。
- D5. README MUST 包含：主題、技術、本機啟動、環境變數、測試帳號（一般/管理員）、前後端部署網址。

---

## Spec 合規檢查（Constitution Gate）

每份 spec 在進入 plan / 實作前 MUST 通過下列檢查；任一「否」即退回。
spec 範本需內建此段，並逐條回答（附 spec 對應段落）。

| # | 檢查問題 | 對應規則 |
|---|---|---|
| 1 | 所有資料是否來自後端 API，無假資料？ | F1, B2 |
| 2 | API 呼叫是否全在 `src/api/`？ | A4, B3 |
| 3 | 狀態是否由 Pinia 管理，且以後端回應為準？ | A5, A11 |
| 4 | 是否涵蓋載入 / 空 / 錯誤 / 未登入 / 401 狀態？ | F2–F4 |
| 5 | 是否定義 RWD 行為與圖片自適應？ | A10 |
| 6 | 是否使用語意標籤，無 `div @click`？ | A9 |
| 7 | 是否有使用 `v-html` / 存敏感資料 / log Token？ | B4–B6 |
| 8 | 是否列出對應測試（store / lib / 元件三態）？ | T2–T5 |
| 9 | 是否引入 TS `any`、Options API、新 CSS 框架？ | A1–A3, B1 |
| 10 | 是否牴觸 `specs/assignment.md` 任何要求？ | 全部 |

**例外流程**：需偏離 `SHOULD` 時，在 spec 的「Constitution 例外」段寫明規則編號、理由、範圍與到期；`MUST` 規則不得例外，只能走修改 constitution 的 PR。

## 變更紀錄

- 1.0.0 — 初版。
