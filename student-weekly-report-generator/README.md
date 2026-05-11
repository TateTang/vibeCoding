# student-weekly-report-generator

这是一个纯静态网页项目，可直接部署到 EdgeOne Pages。

## 项目结构

- `index.html`
- `style.css`
- `script.js`

## 部署到 EdgeOne Pages

在 EdgeOne Pages 新建项目时使用下面这组配置：

- Framework Preset: `Other`
- Root Directory: `student-weekly-report-generator`
- Build Command: 留空
- Output Directory: `.`

## 本地预览

这是静态站点，直接用任意静态服务器预览即可，例如：

```bash
npx serve student-weekly-report-generator
```

或进入目录后用：

```bash
python3 -m http.server 8080
```

## 注意事项

- 项目使用 `localStorage` 保存周报历史，部署后无需额外后端。
- 复制功能依赖浏览器安全上下文，在 HTTPS 域名下体验最佳。
