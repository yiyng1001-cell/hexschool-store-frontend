# 002 — Products：商品瀏覽、搜尋與詳情

狀態：Draft（契約部分 blocked，待後端 `openapi.yaml` 補上 products 與 categories）
對應後端：`hexschool-store-backend` 的 `specs/002-products/spec.md` 與 `openapi.yaml`。
依賴：`001-auth`（`httpClient`、錯誤正規化、導覽列）。

## 目的

讓所有人（含未登入）瀏覽商品：首頁展示、商品列表（分頁、分類篩選、關鍵字搜尋、排序）與單一商品詳情，並在載入中、查無結果、API 錯誤時給予明確提示。

## 後端依賴

| 端點 | 用途 | 契約狀態 |
| --- | --- | --- |
| `GET /api/products` | 商品列表 | **blocked**：spec 已定義，`openapi.yaml` 尚未收錄 |
| `GET /api/products/:id` | 單一商品 | **blocked**：同上 |
| `GET /api/categories` | 分類清單 | **blocked**：同上 |

`blocked` 解除條件：後端 `openapi.yaml` 收錄上述端點與 `Product`、`Category`、`ProductListMeta`、`NotFound`、`ErrorCode.NOT_FOUND`，之後依 C-2 產生型別並對照本 spec，必要時依 C-8 開 issue。

契約重點（以後端 spec 為準，待 `openapi.yaml` 確認）：
- 列表回應：`data: { items: Product[], meta: { page, limit, total, totalPages } }`。
- `Product`：`id`、`name`、`description`、`price`（整數，新台幣元）、`imageUrl`（`https`）、`category: { id, name }`、`createdAt`、`updatedAt`。
- 查詢參數：`page`（預設 1）、`limit`（1～50，預設 12）、`category`（分類 id）、`q`（1～50 字，不分大小寫的包含比對）、`sort`（`newest`｜`price_asc`｜`price_desc`，預設 `newest`）。
- 不合法參數、**未知查詢參數**一律 400；沒有關鍵字時 MUST **省略** `q`。
- 查無結果是 200 加空 `items`；`page` 超過最後一頁也是 200 加空 `items`。
- 單品不存在、已刪除或 id 格式不符：404 `NOT_FOUND`。
- 分類清單最多 50 筆，依名稱排序，不得寫死（S 與 U-1）。

## 需求

### 功能

1. **首頁**：展示品牌區塊與最新商品（`sort=newest`、固定 `limit`，如 8），含前往商品列表的入口，並以分類清單提供分類捷徑。
2. **商品列表頁**（`/products`）：
   - 顯示商品卡片網格，支援分頁、分類篩選、關鍵字搜尋、排序。
   - 篩選、搜尋、排序、頁碼皆反映在網址查詢參數，重新整理與分享連結後狀態一致。
   - 變更分類、關鍵字或排序時頁碼重設為 1。
3. **商品詳情頁**（`/products/:id`）：顯示圖片、名稱、分類、價格、描述，並提供回到列表（保留先前的篩選條件）的連結。
4. **商品卡片**：圖片、名稱、分類、價格，整張卡片為連結（`a`）前往詳情。加入購物車按鈕的行為於 `003-cart` 定義，本 spec 僅預留卡片與詳情頁的位置。

### 網址查詢參數與正規化

- 路由查詢參數：`page`、`category`、`q`、`sort`；`limit` 為前端固定值（每頁 12），不開放使用者調整。
- 網址為外部輸入（S-6）：由 `lib/` 純函式 `parseProductListQuery` 解析並驗證。
  - 不合法值（`page=abc`、`page=0`、未知 `sort`、超過 50 字的 `q`）→ 該參數回復預設值並以 `router.replace` 修正網址，不送出不合法請求，也不顯示錯誤。
  - 空白的 `q` 視為未提供，請求中**省略**。
  - 未知的查詢參數不轉送後端（後端會回 400）。
- 送往後端的查詢參數由 `buildProductListRequest` 組成，只包含契約定義的欄位。

### 關鍵字搜尋行為

- 輸入以 debounce（約 300 ms）後才更新網址與送出請求；按 Enter 或點搜尋按鈕立即送出。
- 清除搜尋時移除 `q`。
- `q` 前後空白去除；超過 50 字在輸入端阻擋並提示。

### 列表狀態（U-2）

| 狀態 | 條件 | 畫面 |
| --- | --- | --- |
| 載入中 | 請求進行中 | 骨架卡片（數量等同每頁筆數）；已有舊資料時保留舊資料並顯示載入指示，避免畫面跳動 |
| 有資料 | `items.length > 0` | 商品網格加分頁 |
| 查無結果 | 200 且 `items` 為空且 `total` 為 0 | 說明文字，若有篩選或搜尋條件則提供「清除條件」按鈕 |
| 頁碼超出範圍 | 200、`items` 為空但 `total > 0` | 導向最後一頁（`router.replace`） |
| API 錯誤 | 網路錯誤、5xx、400 | 錯誤訊息加「重試」按鈕，保留目前條件 |

- 分類清單載入失敗不阻擋列表：篩選區顯示重試入口，商品仍可瀏覽。
- 請求競態：條件快速變化時，MUST 取消或忽略過期請求，只採用最新一次的回應（`AbortController`）。

### 詳情頁狀態

| 狀態 | 畫面 |
| --- | --- |
| 載入中 | 骨架 |
| 成功 | 商品內容 |
| 404 `NOT_FOUND` | 「商品不存在或已下架」與回列表連結 |
| 網路錯誤、5xx | 錯誤訊息加重試 |

### 畫面與 RWD（U-7、U-8、U-9）

- 語意標籤：列表用 `main`、`section`；商品卡片用 `article`；篩選區用 `form` 或 `search` 區塊；分頁用 `nav aria-label="分頁"`。
- 商品網格：手機 1～2 欄、平板 3 欄、桌機 4 欄；各斷點不跑版。
- 篩選區：桌機為側欄或水平列；手機收合為可展開的區塊。
- 圖片：固定長寬比容器（如 `aspect-square`）加 `object-cover`，使用 `loading="lazy"`、有意義的 `alt`（商品名稱）；載入失敗時顯示替代圖，不破版。
- 價格以 `lib/formatPrice` 顯示為「NT$ 1,200」（整數、千分位）。
- 卡片與按鈕具 hover、focus 樣式；分頁、篩選可用鍵盤操作，目前頁以 `aria-current="page"` 標示。

### 分頁

- 使用 `meta.totalPages` 繪製；顯示上一頁、下一頁與有限的頁碼範圍（目前頁前後各 2 頁，加首尾頁與省略號），頁數多時不爆版。
- 只有一頁時不顯示分頁。
- 換頁後捲動回列表頂端，焦點移至列表標題以利螢幕閱讀器。

## 非目標

- 管理員商品管理頁面（後端僅提供 API）。
- 商品多圖、庫存、評價、推薦、無限捲動。
- 使用者自訂每頁筆數。
- 搜尋建議與歷史紀錄。
- 加入購物車功能（見 `003-cart`）。

## 驗收條件

- [ ] 未登入可瀏覽首頁、列表與詳情。
- [ ] 列表預設為第 1 頁、每頁 12 筆、`newest` 排序；請求只含契約定義的參數。
- [ ] 切換分類、輸入關鍵字、切換排序、換頁，網址同步更新；重新整理後畫面一致。
- [ ] 變更分類、關鍵字或排序後頁碼回到第 1 頁。
- [ ] 沒有關鍵字時，請求不含 `q`；空白關鍵字視為沒有。
- [ ] 手動修改網址為 `page=abc`、`page=0`、`sort=foo` 時，回復預設並修正網址，且不送出不合法請求。
- [ ] `page` 超過最後一頁時導向最後一頁；`total` 為 0 時顯示查無結果而非導向。
- [ ] 載入中顯示骨架；查無結果顯示說明與「清除條件」；API 錯誤顯示訊息與重試，重試後恢復。
- [ ] 快速連續變更條件，畫面只呈現最後一次條件的結果。
- [ ] 分類清單來自 API；載入失敗時商品列表仍可使用。
- [ ] 詳情頁 404 顯示「商品不存在或已下架」；回列表連結保留先前條件。
- [ ] 商品圖片自適應、不變形；圖片載入失敗顯示替代圖；價格顯示為整數加千分位。
- [ ] 手機（約 375px）、平板、桌機皆無跑版，無橫向捲軸。
- [ ] 卡片與控制項有 hover、focus 狀態，可用鍵盤操作。
- [ ] 畫面上沒有任何寫死的商品或分類資料。

## 預計新增或修改的檔案

- `src/api/types.ts`：重新產生，含 `Product`、`Category`、列表回應與 `NOT_FOUND`。
- `src/api/productApi.ts`：`listProducts`、`getProduct`；`src/api/categoryApi.ts`：`listCategories`。支援傳入 `AbortSignal`。
- `src/api/apiError.ts`：新增 `NOT_FOUND` 錯誤碼。
- `src/stores/productCatalogStore.ts`：`useProductCatalogStore`（分類清單，只載入一次）。
- `src/composables/useProductList.ts`：依路由查詢參數取得列表、狀態機、取消過期請求。
- `src/composables/useProductDetail.ts`。
- `src/lib/parseProductListQuery.ts`、`src/lib/buildProductListRequest.ts`、`src/lib/formatPrice.ts`、`src/lib/buildPaginationItems.ts`：純函式。
- `src/router/index.ts`：`/`、`/products`、`/products/:id`。
- `src/views/home/HomeView.vue`、`src/views/productList/ProductListView.vue`、`src/views/productDetail/ProductDetailView.vue`。
- `src/components/product/ProductCard.vue`、`ProductGrid.vue`、`ProductCardSkeleton.vue`、`ProductFilterBar.vue`、`ProductSearchInput.vue`。
- `src/components/ui/PaginationNav.vue`、`EmptyState.vue`、`ErrorState.vue`、`ProductImage.vue`（圖片載入失敗替代）。
- 對應的 `*.spec.ts`。

## 測試案例

單元（`lib/`）：
- `parseProductListQuery`：預設值、合法值、`page` 為 0／負數／非整數／非字串、未知 `sort`、`q` 空白與過長、陣列型查詢參數。
- `buildProductListRequest`：空 `q` 省略、不含未知參數、`limit` 固定。
- `formatPrice`：1、1200、1000000；`buildPaginationItems`：1 頁、少頁、多頁加省略號、首尾頁。

單元（`api/`、`composables/`，API 以 mock 隔離）：
- `productApi` 錯誤正規化：400、404 `NOT_FOUND`、5xx、網路錯誤、取消（取消不算錯誤）。
- `useProductList`：載入中→有資料、查無結果、API 錯誤與重試、頁碼超出範圍導向最後一頁、競態（較早的回應較晚到達時被忽略）。

元件：
- 列表頁三態、篩選與搜尋改變網址、換頁後頁碼重設與捲動、debounce。
- 詳情頁成功、404、錯誤重試。
- `ProductCard`：連結與語意標籤、圖片失敗替代圖。
- 分類載入失敗時商品仍顯示。

## Constitution Check

- [ ] **A 架構**：API 只在 `src/api/`（A-4）；元件經 composable 或 store 取資料（A-2、A-3）；解析、組合請求、價格與分頁計算為 `lib/` 純函式（A-5）；設定來自 `VITE_API_BASE_URL`（A-6）。
- [ ] **C 契約**：端點待 `openapi.yaml` 收錄後解除 blocked，型別由其產生（C-1～C-3）；`NOT_FOUND` 等錯誤碼正規化（C-4、C-5）；請求帶分頁參數且 `limit` 不超過 50，分頁、分類、搜尋由後端處理（C-6）；已列出後端依賴（C-7）；契約變更依 C-8 開 issue。
- [ ] **S 安全**：網址參數解析並驗證（S-6）；描述與名稱以文字渲染，不使用 `v-html`（S-5）；錯誤訊息不洩漏內部資訊（S-7）；不涉及 Token 以外的儲存（S-1）。
- [ ] **U 體驗**：資料來自後端（U-1）；分頁、分類、搜尋與三種狀態（U-2）；RWD 與圖片自適應（U-7）；語意標籤（U-8）；hover 與 focus（U-9）。登入與購物車相關條款（U-3～U-6）不適用本 spec。
- [ ] **T 測試**：`lib/`、`api/` 錯誤正規化、composable 與關鍵流程元件測試皆已列出（T-1～T-4）。
- [ ] **X 禁用**：無 Options API、假資料、元件內 `fetch`、`v-html`、空 `catch`、`any`、就地修改、未處理 rejection。
- 例外與理由：無。

## 已知取捨與待決事項

- **篩選狀態放在網址**：可分享、可重新整理，代價是需要嚴謹的查詢參數解析；以 `lib/` 純函式集中處理並充分測試。
- **無限捲動未採用**（已決定）：分頁較符合後端 `meta` 與作業要求，也易於測試；不排除之後新增式改為「載入更多」。
- **首頁範圍**（已決定）：品牌區塊、最新 8 筆商品與分類捷徑；不含輪播、精選或促銷區塊，維持單一資料來源（`sort=newest`），避免需要後端新增「精選」欄位（`product.md` 非目標）。
- **關鍵字 debounce 的延遲值**（300 ms）為暫定，可依手感調整，不影響契約。
- **替代圖來源**：使用本地靜態資源（不依賴外部網址），確切素材待設計。
- **加入購物車按鈕**：卡片與詳情頁先預留版位，行為與未登入引導於 `003-cart` 定義。
- 商品與分類由後端 seed 提供，前端上線前需確認部署環境的 seed 已執行（至少 4 個分類、24 筆商品）。
