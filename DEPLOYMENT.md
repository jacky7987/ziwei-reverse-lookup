# 免費部署方案

依 2026/11/10 查閱的官方文件整理。此 App 為純靜態檔案，所有反查在手機執行，不需要購買伺服器或資料庫。以下免費額度可能調整，實際以部署當時官方方案為準。目前僅完成本機改寫，尚未建立遠端 repository 或發布網站。

## 選擇建議

個人使用、可公開原始碼：**GitHub Pages**，專案與網站放在一起，後續更新容易維護。

想直接上傳部署包，或希望來源 repository 保持私有：**Cloudflare Pages**。本 App 不使用 Functions，靜態請求免費且不限次數；可選 ZIP 上傳或連接 Git。

Cloudflare Pages 的 Git 整合支援公開與私有 repository，見[官方整合指南](https://developers.cloudflare.com/pages/get-started/git-integration/)。

這裡的「repository 私有」不代表「網站只有自己能開」。以下比較的是一般公開靜態網站，知道網址的人可以使用，也能下載瀏覽器收到的前端 JavaScript。若需要登入保護，應另外選定存取控制方案。輸入的命盤條件及反查結果依然只在各自裝置上運算，不會隨部署上傳。

## 比較

| 方案 | 免費內容 | 優點 | 限制與取捨 |
| --- | --- | --- | --- |
| GitHub Pages | 公開 repository 可用 GitHub Free；網站上限 1 GB、每月頻寬軟上限 100 GB | 適合此類靜態小工具；版本紀錄與網站一起管理，可在 push 後自動發布 | GitHub Free 的 Pages 需公開 repository；不執行後端；限制主要用來經營線上交易或商業 SaaS 的用途。[官方限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) |
| Cloudflare Pages | Free 每月 500 次建置；不呼叫 Functions 的靜態請求免費且不限次數 | 適合純靜態 App；可連接私有 Git repo，或直接拖曳資料夾／ZIP，不必先公開來源 repo | 需要 Cloudflare 帳號；Direct Upload 專案日後不能原地改成 Git 自動部署，須另建專案；網站本身預設仍可公開存取。[建置限制](https://developers.cloudflare.com/pages/platform/limits/)、[靜態請求計價](https://developers.cloudflare.com/pages/functions/pricing/)、[上傳說明](https://developers.cloudflare.com/pages/get-started/direct-upload/) |
| Netlify Free | 每月 300 credits，Free 為硬上限且不能自動加購 | 可用 Git 自動部署或上傳檔案，適合快速試用 | 部署、流量與請求共用 credits；用盡時專案會暫停至下一個計費週期。舊帳號可能仍採舊制，不能直接套用以前的免費流量說法。[方案文件](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)、[用盡額度行為](https://www.netlify.com/pricing/personal-vs-free/) |
| Vercel Hobby | 個人、非商業用途免費，提供 Git 部署、HTTPS 與預覽 | 更新流程方便；若未來發展 React／Next.js 專案，平台功能較完整 | Hobby 限個人非商業用途，且各資源有用量限制；這個不需框架或後端的 App 用不到多數功能。[官方方案](https://vercel.com/docs/plans/hobby) |

上述主機提供平台子網域，不必另外買網域。例如 `帳號.github.io/專案/`、`專案.pages.dev`、`專案.netlify.app`、`專案.vercel.app`。自訂網域可之後再決定；網域註冊費不含在免費主機方案內。

## 已準備好的部署設定

```bash
npm --prefix web run package
```

會產生 `web/dist/`、`web/preview.html` 與 `web/ziwei-web.zip`。ZIP 僅含正式網站檔案，不包含 iOS 專案、測試、開發資料或命盤輸入。

| 平台 | 選定後的設定 |
| --- | --- |
| GitHub Pages | 建立 Git repository，Actions 執行 `npm --prefix web run build`，上傳 `web/dist` 為 Pages artifact。工作流程待選定平台後加入，避免現在就觸發公開部署。 |
| Cloudflare Pages Git integration | repository root 設為專案根目錄；build command：`npm --prefix web run build`；output directory：`web/dist`。不需要環境變數。 |
| Cloudflare Pages Direct Upload | 上傳 `web/ziwei-web.zip` 或拖曳 `web/dist`。選用前先決定是否要日後 Git 自動部署。 |
| Netlify | 專案根目錄建置；build command：`npm --prefix web run build`；publish directory：`web/dist`，或使用手動上傳。 |
| Vercel | framework preset 選 Other；專案根目錄建置；build command：`npm --prefix web run build`；output directory：`web/dist`；不需 install command。 |

部署目錄請指定 `web/dist`，不要把整個專案或電腦資料夾公開。所有路徑均已支援 GitHub Pages 子路徑。

## iPhone 使用方式

部署後用 Safari 開啟 HTTPS 網址 → 分享 → 加入主畫面。這是 Web App，不需要 Xcode 簽章，也不需要每 7 天重新安裝。

首次連網載入，等底部顯示「已可離線使用」後，再測試飛航模式關閉並重開 App。若瀏覽器清除網站儲存空間，需要重新連網下載一次。一般重新載入會清除目前查詢。

上線驗收還需要確認：網址根目錄及所有模組成功載入、加入主畫面圖示、Golden Test、離線重開，以及有新版本時按提示更新。現階段已完成本機單檔的瀏覽器操作與快取模擬測試，尚未在正式 HTTPS 或 iPhone 實機驗證。
