# 長輩福利查詢

台灣 65 歲以上福利的官方來源資料庫與長者友善查詢 MVP。所有福利內容以政府主管機關最新公告為準，網站只提供「可能符合」的初步整理，不代表核准。

## 線上網站

GitHub Pages：<https://be0007599.github.io/taiwan-senior-benefits-2026/>

網站由 `main` 分支自動建置與發布；每次資料或程式修改都會保留 Git 版本紀錄。

## 本機執行

```powershell
pnpm install
npm run dev
```

瀏覽 `http://127.0.0.1:5173/`。

## 驗證與建置

```powershell
npm run validate:data
npm run audit:data
npm run audit:frontend
npm run build
& scripts/check-source-links.ps1
```

資料欄位、狀態與維護方式請參閱 `data/README.md`；完整研究與開發歷程請參閱 `DEVELOPMENT_LOG.md`。

`npm run audit:frontend` 會逐筆確認所有福利都能由前端的縣市、類別與搜尋流程找到，並核對後端欄位是否都有前端呈現契約。

## 目前資料邊界

- 211 筆中央與地方福利方案。
- 22 縣市都有覆蓋狀態，不代表每一類福利都已取得完整地方金額。
- 復康巴士已有 20 縣市現行正式資料；嘉義縣與連江縣仍待主管機關書面確認。
- 福利資格會受戶籍、所得、財產、失能程度、重複領取限制、名額及年度預算影響，申請前必須再向主管機關確認。
