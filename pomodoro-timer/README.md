# 番茄钟计时器（Pomodoro Timer）

一个基于 React + TypeScript + Vite + Tailwind CSS 的番茄工作法计时器，支持浏览器通知、提示音、统计功能、页面标题动态更新，以及专注 / 短休息 / 长休息三种模式切换。

## 功能特性
- 工作/休息时长可自定义，默认 25/5 分钟
- 顶部支持专注、短休息、长休息三种模式切换
- 每完成 4 个专注周期自动进入 15 分钟长休息
- 支持开始、暂停、重置
- 倒计时结束自动浏览器通知和提示音
- 统计今日、本周完成的番茄钟数量，数据持久化
- 页面标题动态显示剩余时间
- 清空统计

## 快速启动
1. **安装依赖**
   ```sh
   cd pomodoro-timer
   npm install
   ```
2. **准备提示音（可选但推荐）**
   - 将 alarm.mp3 放入 public 目录
   - 如果未放置音频文件，应用会退回到浏览器内置提示音
3. **启动开发服务器**
   ```sh
   npm run dev
   ```
   访问 http://localhost:5173/

## 目录结构
```
pomodoro-timer/
├── public/
│   └── alarm.mp3         # 提示音文件（可选）
├── src/
│   ├── components/
│   │   └── PomodoroTimer.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── ...
```

## 扩展建议
- 统计图表、任务列表、数据可视化
- 支持背景音乐、与任务关联等

---
如需更多功能或定制，欢迎继续提需求！
