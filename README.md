# 紙間｜線上插畫圖書館

純前端、無建置工具的 Three.js 展間，可直接部署到 GitHub Pages。首頁是 `index.html`；所有程式與樣式使用相對路徑。素描簿以 Three.js 幾何模型呈現黑色螺旋封面、紙頁與印刷標籤；皺紙背景和封面紋理由 Canvas 即時繪製，不需另行下載圖片。

## 本機預覽

在專案資料夾開啟終端機，執行：

```bash
python -m http.server 8000
```

接著在瀏覽器打開 <http://localhost:8000>。也可使用 VS Code 的 Live Server。請用本機伺服器預覽 ES modules；直接雙擊 `index.html` 可能會被瀏覽器的安全政策擋下。

展間使用 Three.js 0.160.0 的 jsDelivr CDN，以及 Google Fonts 字型。第一次載入需要網路連線；服務均免費。GitHub Pages 可直接發布專案根目錄，不需要建置步驟。

## 操作

- 按住滑鼠左鍵拖曳，移動展間。
- 點擊素描簿，開啟作品介紹；按 × 或 Esc 關閉。
- 右上角「操作指南」可隨時查看說明。
