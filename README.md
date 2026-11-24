# 生活選物店 — 前端

2026 企業專題班單人專題的前端，與 [hexschool-store-backend](https://github.com/yiyng1001-cell/hexschool-store-backend) 串接。

## 專案主題

「生活選物店」：販售家居、廚房、收納、文具的選物電商。功能包含首頁、商品列表（分類篩選、關鍵字搜尋、分頁）、商品詳情、會員註冊與登入、購物車（加入、調整數量、移除，皆與後端同步），版面支援手機與桌機（RWD）。

## 技術

Vite、Vue 3（Composition API）、TypeScript、Tailwind CSS、Pinia、Vue Router、Vitest。

## 本機啟動

需要 Node.js 20.19 以上（或 22.12 以上），且後端 API 需先啟動（見後端 repo README），或直接把 `VITE_API_BASE_URL` 指向已部署的後端。

```sh
npm install
cp .env.example .env   # 設定 VITE_API_BASE_URL
npm run dev            # 預設 http://localhost:5173
```

## 環境變數

| 名稱 | 說明 |
| --- | --- |
| `VITE_API_BASE_URL` | 後端 API Base URL，結尾不加斜線 |

## 指令

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 開發伺服器 |
| `npm run build` | 型別檢查並建置 |
| `npm run lint` | ESLint |
| `npm run type-check` | vue-tsc |
| `npm test` | Vitest |
| `npm run generate:api-types` | 由後端 `openapi.yaml` 產生 `src/api/types.ts` |

## 文件

規則與規格見 `specs/`：`constitution.md`、`structure.md`、`NNN-feature/spec.md`。

## 測試帳號

| 角色 | Email | 密碼 |
| --- | --- | --- |
| 一般會員 | `member@example.com` | `Member12345` |
| 管理員 | `admin@example.com` | 為避免公開 repo 洩漏，不寫在此處，請見繳交信件 |

管理員帳號只能由後端 seed 指令建立，使用者無法自行升級（詳見後端 repo README）。前端的角色判斷只用於畫面顯示，權限以後端為準；管理員功能僅提供 API，前端沒有後台頁面。

## 部署

| 項目 | 網址 |
| --- | --- |
| 前端 | https://hexschool-store-web.onrender.com |
| 後端 API | https://hexschool-store-backend.onrender.com |

- 前端為 Render Static Site：Build Command `npm ci && npm run build`，Publish Directory `dist`，並設定 `/*` → `/index.html` 的 Rewrite 以支援 SPA 重新整理。
- Build 時的環境變數 `VITE_API_BASE_URL` 指向已部署的後端網址。
- 後端的 `CORS_ORIGIN` 需設為前端網址。
- 後端若為免費方案，閒置後第一次請求可能需要等待喚醒。
