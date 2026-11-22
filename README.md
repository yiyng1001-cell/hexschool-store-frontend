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

測試帳號與部署網址待補。
