# 紫微反查 Web

網站：**https://jacky7987.github.io/ziwei-reverse-lookup/**

Repository：https://github.com/jacky7987/ziwei-reverse-lookup

GitHub repository 的根目錄對應本機的 `web/`。使用 GitHub Actions，在 `main` 更新後先驗證 JavaScript 語法與執行測試，再將 `dist/` 發布至 Pages。PR 僅執行檢查。

純靜態 PWA，沿用 iOS 的預設安星公式。支援手機與桌面瀏覽器，不需要帳號、後端、資料庫或第三方 JavaScript 套件。原生 iOS 程式碼保留。

## 現在試用

用電腦瀏覽器開啟 [`preview.html`](preview.html)，按「試試範例」即可測試。這是建置產生的獨立檔案，圖示、樣式、程式及背景運算都已內嵌，不需要本機伺服器。單檔預覽不提供 PWA 安裝；iPhone 正式使用請部署 HTTPS 網址。

## 功能

- 六個基本條件與十個進階條件，每次改選後自動更新候選數。
- 完全比對全部合法六十甲子，共 259,200 組抽象農曆出生組合，保留原版排序與所有解。
- Shannon entropy 條件推薦、單條件移除的無解診斷、最多 200 筆結果。
- 西元年份輸入範圍 1～9998，預設台北時區「今年減 60 年～今年」。普通月、閏月與不存在的農曆日分別處理。
- 詳情、安星推導與複製結果。複製需瀏覽器支援 Clipboard API；若權限不允許，可直接選取畫面文字。
- 系統淺色／深色、320px 起的響應式畫面、原生選單、鍵盤操作、即時狀態播報。
- Web Worker 背景計算、150ms debounce 與請求編號，避免舊回覆覆蓋新條件。
- HTTPS 下使用 service worker 快取應用程式，支援離線重新開啟。有更新時顯示提示，按下更新才切換版本；重載會清除目前查詢。

查詢不儲存在伺服器、網址或瀏覽器永久儲存空間，重開頁面會清除。離線快取只儲存 App 檔案。

## 開發與建置

Node.js 20 以上；預覽伺服器與 ZIP 包裝另需 Python 3。沒有 npm 依賴，不需要 `npm install`。

```bash
npm --prefix web test
npm --prefix web run dev
npm --prefix web run build
npm --prefix web run package
```

若是從 GitHub clone 獨立的 Web repository，在 repository 根目錄直接使用 `npm test`、`npm run dev`、`npm run build` 與 `npm run package`。

- `public/`：可直接提供 HTTP 服務的原始碼。
- `dist/`：正式部署目錄，建置時重建，請勿在此修改程式。
- `preview.html`：可雙擊試用的單檔版本，每次 build 自動更新。
- `ziwei-web.zip`：`package` 產生，根目錄直接含 `index.html`，可上傳到支援 ZIP 的靜態主機。
- `_headers`：Cloudflare Pages 與 Netlify 可讀取的回應標頭；GitHub Pages 不套用此檔，頁面另外設定了 CSP。

所有連結、manifest、worker 與快取路徑均使用相對路徑，可部署於網站根目錄或 GitHub Pages 的 `/repository/` 子路徑。請開啟結尾有 `/` 的部署網址。

## 驗證

```bash
npm --prefix web test
npm --prefix web run test:parity
```

第二項需完整的本機 iOS 專案與 macOS Swift toolchain，無法只從獨立的 Web repository 執行。它將原封不動的 `Sources/ZiWeiCore` 與 `scripts/web-parity/main.swift` 編譯，輸出原版每一組出生組合的 16 欄位及五行局，再用 JavaScript 逐值比對。產物放在 `.build/web-parity/`，不會打包進網站。

2026/11/10 已完成：

- 15 項 Node 測試通過，涵蓋核心、曆法、非法輸入、背景運算、建置、快取安裝／離線請求與版本切換。
- 259,200 組 × 17 個值，共 4,406,400 個值，與 Swift 原版全部一致。
- Dia 瀏覽器實際操作單檔版：初始數量、Golden Test、三筆多解、推導、無解診斷、年份錯誤與清除；desktop 與 320px 畫面無明顯排版溢出，console 無訊息。
- 本環境禁止本機 HTTP listener。service worker 測試使用 Node 測試環境模擬 Cache API 與生命週期，不能取代正式 HTTPS 的安裝測試。部署後需在 iPhone Safari 確認「加入主畫面」、看到「已可離線使用」並關閉後離線重開；這些尚未實機驗證。
- 已於 GitHub Pages 正式部署。[首次 Actions 執行](https://github.com/jacky7987/ziwei-reverse-lookup/actions/runs/42827128162) 的語法檢查、15 項測試、建置與部署全數成功。macOS Safari 已在正式 HTTPS 網址驗證 Golden Test 與 `1990/08/07`，並確認 service worker 安裝後顯示「已可離線使用」。iPhone 加入主畫面及飛航模式離線重開仍待實機驗證。

## 規則及曆法限制

公式來自完整 iOS 專案的 `Sources/ZiWeiCore/Rules/DefaultRuleSet.swift`；Web 版目前提供同一套預設規則，沒有新增流派選擇。火星／鈴星、閏月、真太陽時及時辰限制沿用本機 iOS 專案的 `README.md`，這些 iOS 檔案不在獨立的 Web repository 中。

日期服務由 Foundation 改成瀏覽器內建 `Intl.DateTimeFormat` Chinese Calendar，採台北時區的中午作為日期錨點。已核對原版 Golden Test、1930 閏六月、2023 閏二月、2024 春節、小月三十日與跨西元年案例。不同瀏覽器或作業系統的曆法資料版本，仍可能對古代或遙遠未來日期產生差異；未宣稱所有年份的日期與 Foundation 逐日相同。瀏覽器若不支援所需農曆格式，會提示日期換算錯誤並保留核心候選。

日期欄位使用瀏覽器作者文件中的 [`relatedYear`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/formatToParts#named_years)。
