# 软考资料

这里用于整理 2019-2024 年中级软件设计师上午练习资料，也就是 2025 年之前从 2019 年开始的 6 套上午卷。

整套历年真题原文通常受版权约束，因此本目录保存了公开入口索引，并生成了 6 套按软件设计师上午考试常见考点原创整理的模拟练习卷。模拟卷可以直接刷题；如果你后续拿到合法题源，也可以替换 `sources` 中的 JSON 后重新打乱输出。

## 目录

- `公开真题入口索引.md`：本次检索到的公开资料入口和关键词。
- `sources/`：6 套原创模拟题源，分别对应 2019-2024 年上午卷。
- `scripts/generate-simulated-sources.mjs`：生成 6 套原创模拟题源。
- `scripts/generate-papers.mjs`：本地打乱并生成试题、答案。
- `scripts/build-practice-html.mjs`：根据 `output/*.md` 生成离线刷题页面。
- `output/`：生成后的 6 份试题和 6 份答案。
- `practice.html`：选择答案、提交试卷、计算得分并查看解析的前端页面。

## 生成命令

```bash
cd "/Users/tatetang/Documents/800 owner/vibeCoding/软考资料"
node scripts/generate-simulated-sources.mjs
node scripts/generate-papers.mjs
node scripts/build-practice-html.mjs
```

`generate-simulated-sources.mjs` 会重新生成 6 套原创模拟题源，每套 75 题。`generate-papers.mjs` 会稳定打乱题目顺序和选项顺序。每个题源文件里的 `seed` 决定打乱结果，同一个 `seed` 反复生成会得到同一套打乱版，便于复习和核对。`build-practice-html.mjs` 会读取打乱试题和答案 Markdown，生成可直接打开的前端练习页面。

## 当前输出

`output/` 中已经生成：

- 2019-2024 年各 1 份打乱试题，共 6 份。
- 2019-2024 年各 1 份答案解析，共 6 份。
- `practice.html` 中可选择任意一套作答，提交后显示得分、正确答案和解析。

这些输出是原创模拟卷，不是历年真题原文。

## 题源格式

```json
{
  "id": "software-designer-morning-2019",
  "title": "2019 年中级软件设计师上午真题",
  "year": 2019,
  "exam": "中级软件设计师",
  "session": "上午",
  "seed": "software-designer-2019-morning",
  "questions": [
    {
      "number": 1,
      "stem": "题干内容",
      "options": {
        "A": "选项 A",
        "B": "选项 B",
        "C": "选项 C",
        "D": "选项 D"
      },
      "answer": "C",
      "analysis": "解析，可选"
    }
  ]
}
```

如果要替换成你合法拥有的真题题源，按上述格式编辑对应年份的 `sources/*.json`，然后只运行 `node scripts/generate-papers.mjs` 即可生成打乱版。