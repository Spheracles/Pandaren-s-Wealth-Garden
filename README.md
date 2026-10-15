# 財富花園 Wealth Garden — PWA + Android（NEON CITY）

個人財富作業系統：金錢・時間・心力三維紀錄、資產培育計畫、財富花園植物卡、AI 策略師（需核准的草案）。
本專案同時支援 **PWA（Android／iPhone／桌面瀏覽器加入主畫面）** 與 **Capacitor 8 Android APK**。PWA 需要先建置並部署到 HTTPS 網站；Android APK 另行編譯。

| 項目 | 值 |
|---|---|
| App 名稱 | 財富花園 Wealth Garden |
| Package ID | `com.wealthgarden.app` |
| 版本 | 1.0.0（versionCode 10000） |
| 發行通道 | **內部測試版**（沒有帳號與雲端同步，不是正式多人服務） |
| Android | 最低 7.0（API 24），目標 API 36 |
| 語言／幣別 | 臺灣繁體中文／TWD |

## 狀態一覽

- ✅ 全部核心功能、財務規則（17 項自動測試）、Android 體驗處理、發行與打包流程。
- ⚠️ APK **尚未在這份交付中編譯**：建立此專案的環境沒有 Android SDK，且無法連到 Google Maven。
  請依下方步驟在 Android Studio 或 GitHub Actions 建置；流程會拒絕產生未簽章或 Debug 簽章的 Release。
- ⏳ 多人帳號、雲端同步、Gemini／OpenAI、Email、每日備份：後端草案在 `supabase/`，**尚未部署**。

**想要手機直接安裝成 PWA？請先看 [`docs/PWA-DEPLOY.md`](docs/PWA-DEPLOY.md)：GitHub Pages 可自動建置並部署 HTTPS 網址，不用自行安裝 Android Studio。**

完整說明：[`docs/ANDROID-BUILD.md`](docs/ANDROID-BUILD.md)（建置與簽章）、
[`docs/TEST-REPORT.md`](docs/TEST-REPORT.md)（測試結果與裝置驗收清單）、
[`docs/STATUS.md`](docs/STATUS.md)（已完成／未完成／待部署）、
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)、[`docs/PRIVACY.md`](docs/PRIVACY.md)、[`docs/COST.md`](docs/COST.md)。

## 快速開始

需要：Node.js 20.19+（建議 22）、JDK 21、Android Studio（含 Android SDK 36 與 build-tools 36）。

```bash
npm install                 # 第一次會產生 package-lock.json，請一併提交
npm run dev                 # 瀏覽器開發（http://localhost:5173，非正式 PWA）
npm run build               # 正式建置 PWA：dist/ + sw.js + manifest
npm run pwa:verify          # 驗證可部署的 dist 靜態檔
npm run preview             # 本機測試已建置 PWA（http://localhost:4173）
npm test                    # 財務引擎 17 項驗收測試
npm run android:sync        # 型別檢查 + 測試 + 建置網頁 + 同步到 android/
npm run android:open        # 用 Android Studio 開啟
npm run android:debug       # 產生 Debug APK（可與正式版並存安裝，名稱顯示「財富花園 DEBUG」）
```

正式版（需要你自己的簽章金鑰，見 `docs/ANDROID-BUILD.md`）：

```bash
npm run android:release     # → android/app/build/outputs/apk/release/WealthGarden-v1.0.0.apk
npm run release:verify      # 驗證 v2/v3 簽章、非 Debug 憑證、套件名稱與版本
npm run package:line        # → release/WealthGarden-Android-v1.0.0.zip（LINE 分享用）
npm run package:source      # → release/WealthGarden-Source-v1.0.0.zip
```

## 專案結構

```
src/engine/      財務引擎（TypeScript，純函式，所有計算與寫入規則）
src/platform/    Android 平台層：儲存、返回鍵、鍵盤、網路、分享、觸覺回饋、HTTPS API 用戶端
src/ui/app.js    畫面（React + htm）
src/styles/      NEON CITY 設計樣式
public/          PWA manifest、安裝圖示
scripts/generate-pwa.mjs  產生離線 Service Worker
tests/           財務規則驗收測試（node:test）
android/         Capacitor Android 專案（簽章、版本、權限、圖示、啟動畫面）
scripts/         版本同步、簽章驗證、LINE ZIP／原始碼 ZIP 打包、秘密掃描
release-templates/  分享包內的安裝說明、更新紀錄、版本資訊範本
supabase/        多人後端草案（RLS 資料表、AI 代理）— 未部署
.github/workflows/android.yml    CI：測試、Debug APK、簽章 Release、打包
.github/workflows/pwa-pages.yml  CI：測試、PWA 建置、GitHub Pages 發布
```

## PWA 安裝／資料提醒

- ZIP 中的 `index.html` 是原始碼入口，不是可直接雙擊開啟的 App；正式網站使用 **`dist/index.html`** 並透過 HTTPS 提供。
- PWA 的資料儲存於瀏覽器 `localStorage`；清除網站資料、刪除 App 或換裝置可能遺失資料，請經常匯出 JSON 備份。
- PWA 的原生安裝提示及離線功能需在正式站台（HTTPS 或 localhost）測試，不是 `file://`。
- PWA、Android APK、不同網站網址之間**不會自動共享本機資料**。
