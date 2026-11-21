# Structure — 前端目錄結構與命名

描述「東西放哪裡、叫什麼」。不可違反的規則在 `specs/constitution.md`，本文件以規則編號引用，不重複內容。
專案建立後若實際結構與本文件不同，以修訂本文件為準（見最後一節）。

## 目錄結構

```
.
├── specs/                    # constitution、structure、NNN-feature/spec.md
├── public/                   # 靜態資源（不經打包）
├── src/
│   ├── main.ts               # 應用進入點
│   ├── App.vue
│   ├── router/               # 路由表與 router guard（A-7）
│   ├── views/                # 頁面，一個路由一個資料夾
│   │   └── <page>/
│   │       ├── <Page>View.vue
│   │       └── components/   # 僅此頁使用的元件
│   ├── components/           # 跨頁共用元件
│   │   ├── ui/               # 無業務語意的通用元件（Button、Modal、Toast）
│   │   ├── layout/           # 導覽列、頁尾、Offcanvas 容器
│   │   └── <feature>/        # 有業務語意的共用元件（product、cart、auth）
│   ├── stores/               # Pinia stores（auth、cart）
│   ├── api/                  # 唯一可呼叫 fetch/axios 的層（A-4）
│   │   ├── httpClient.ts     # base URL、Token 注入、錯誤正規化
│   │   ├── types.ts          # 由後端 openapi.yaml 產生的型別（C-2）
│   │   └── <feature>Api.ts
│   ├── composables/          # 可重用的 Vue 邏輯（useXxx）
│   ├── lib/                  # 無 I/O 的純函式（A-5）
│   ├── assets/               # 經打包的圖片、字型、全域樣式
│   └── env.d.ts
├── .env.example              # A-6
├── index.html
├── vite.config.ts
└── tsconfig.json
```

測試檔與原始碼並列，不另設 `tests/` 目錄（見「測試檔」）。

## 模組邊界

依賴只能由上往下，對應 A-1：

```
views → components → composables → stores → api → lib
```

| 層 | 可以 import | 不可以 import |
|---|---|---|
| views | components、composables、stores、lib | api（A-2） |
| components | components、composables、stores、lib | api、views（A-2） |
| composables | stores、lib | views、components |
| stores | api、lib | views、components |
| api | lib、`api/types.ts` | stores、views、components |
| lib | 無（僅標準函式庫與型別） | 其他所有層 |

- `lib/` 保持純粹：不讀環境變數、不碰 DOM、不發請求（A-5）。
- 頁面專屬元件放 `views/<page>/components/`；被第二個頁面使用時，移到 `components/`。
- `components/ui/` 不得 import `stores/`，保持通用。

## 命名慣例

| 對象 | 規則 | 範例 |
|---|---|---|
| 元件、View | PascalCase，多個單字 | `ProductCard.vue`、`CartView.vue` |
| 資料夾 | camelCase（views 內以頁面名） | `components/ui`、`views/productList` |
| composable | `use` 開頭的 camelCase | `useProductList.ts` |
| store | `use<Name>Store`；檔名 `<name>Store.ts` | `useCartStore`、`cartStore.ts` |
| api 模組 | `<feature>Api.ts` | `productApi.ts`、`cartApi.ts` |
| 純函式 | 動詞開頭的 camelCase，一檔一主題 | `formatPrice.ts`、`calculateCartTotal.ts` |
| 型別、介面 | PascalCase，不加 `I` 前綴 | `Product`、`CartItem` |
| 常數 | UPPER_SNAKE_CASE | `MAX_PAGE_LIMIT` |
| 環境變數 | `VITE_` 開頭 | `VITE_API_BASE_URL` |

- 名稱要說明意圖，避免 `data`、`info`、`temp`、`utils.ts` 這類泛用名稱。
- 與特定函式庫或後端耦合的名稱要寫明，例如 `useAuthStore` 的 Token 邏輯不叫通用名稱。
- 路徑別名：`@/` 指向 `src/`；跨層 import 一律用別名，同一資料夾內用相對路徑。

## 測試檔

- 與被測檔案並列，副檔名 `.spec.ts`：`ProductCard.vue` 旁放 `ProductCard.spec.ts`（對應 T-1～T-4）。
- 測試用的共用輔助與 mock 放 `src/testing/`，不得被正式程式碼 import。
- API mock 在測試中建立，不放進 `src/api/`（X-2）。

## 新增功能時放哪裡

1. 新頁面：`views/<page>/<Page>View.vue`，並在 `router/` 註冊。
2. 呼叫新端點：先確認 `openapi.yaml` 已定義（C-3），再在 `api/<feature>Api.ts` 加函式。
3. 跨頁狀態：加到對應 store；僅單頁狀態留在元件或 composable。
4. 運算規則：寫成 `lib/` 純函式並附單元測試。
5. 通用 UI：`components/ui/`；有業務語意：`components/<feature>/`。

## 修訂流程

- 修改本文件使用獨立 commit（`docs(structure): ...`），說明原因。
- 本文件與 constitution 衝突時，以 constitution 為準。
