# 紙間｜線上插畫圖書館

純前端、無建置工具的 Three.js 展間，可直接部署到 GitHub Pages。首頁是 `index.html`；所有程式與樣式使用相對路徑。27 本素描簿以不同位置、角度和大小散落漂浮，並有緩慢位移與輕微轉動。Three.js 使用柔和陰影、紙張粗糙度和工作室環境反射，皺紙背景照片存放於 `assets/`，不依賴遠端圖片服務。

## 本機預覽

在專案資料夾開啟終端機，執行：

```bash
python -m http.server 8000
```

接著在瀏覽器打開 <http://localhost:8000>。也可使用 VS Code 的 Live Server。請用本機伺服器預覽 ES modules；直接雙擊 `index.html` 可能會被瀏覽器的安全政策擋下。

展間使用 Three.js 0.160.0 的 jsDelivr CDN，以及 Google Fonts 字型。第一次載入需要網路連線；服務均免費。GitHub Pages 可直接發布專案根目錄，不需要建置步驟。

## 素材來源

- 皺紙背景：Ranurte，Unsplash，「Crumpled white paper texture fills the whole frame」，[照片頁面](https://unsplash.com/photos/crumpled-white-paper-texture-fills-the-whole-frame--oJ-SF3rcwQ)，依 [Unsplash License](https://unsplash.com/license) 使用。專案內檔案：`assets/paper-crumpled-unsplash.jpg`。

## 操作

- 按住滑鼠左鍵拖曳，移動展間。
- 點擊素描簿，開啟作品介紹；按 × 或 Esc 關閉。
- 右上角「操作指南」可隨時查看說明。
