# 生活選物店 — 前端

2026 企業專題班單人專題的前端，與 [hexschool-store-backend](https://github.com/yiyng1001-cell/hexschool-store-backend) 串接。

## 技術

Vite、Vue 3（Composition API）、TypeScript、Tailwind CSS、Pinia、Vue Router、Vitest。

## 本機啟動

```sh
npm install
cp .env.example .env   # 設定 VITE_API_BASE_URL
npm run dev
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

管理員測試帳號不公開於本 repo，改於繳交的 email 中提供。前端的角色判斷只用於畫面顯示，權限以後端為準；管理員功能僅提供 API，前端沒有後台頁面。

## 部署

| 項目 | 網址 |
| --- | --- |
| 前端 | https://hexschool-store-web.onrender.com |
| 後端 API | https://hexschool-store-backend.onrender.com |

- 前端為 Render Static Site：Build Command `npm ci && npm run build`，Publish Directory `dist`，並設定 `/*` → `/index.html` 的 Rewrite 以支援 SPA 重新整理。
- Build 時的環境變數 `VITE_API_BASE_URL` 指向已部署的後端網址。
- 後端的 `CORS_ORIGIN` 需設為前端網址。
- 後端若為免費方案，閒置後第一次請求可能需要等待喚醒。
