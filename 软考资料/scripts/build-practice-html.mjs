import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const outputDir = path.join(rootDir, 'output');
const htmlPath = path.join(rootDir, 'practice.html');

const parseMeta = (content) => {
  const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim() || '软考练习卷';
  const year = content.match(/^- 年份：(.+)$/m)?.[1]?.trim() || '';
  const exam = content.match(/^- 考试：(.+)$/m)?.[1]?.trim() || '';
  const session = content.match(/^- 场次：(.+)$/m)?.[1]?.trim() || '';
  return { title, year, exam, session };
};

const parseQuestions = (content) => {
  const questionBlocks = content.split(/\n(?=##\s+\d+\.\s+)/g).filter((block) => block.startsWith('## '));

  return questionBlocks.map((block) => {
    const lines = block.split('\n');
    const heading = lines.shift() || '';
    const headingMatch = heading.match(/^##\s+(\d+)\.\s+(.+)$/);
    const number = Number(headingMatch?.[1]);
    const stem = headingMatch?.[2]?.trim() || '';
    const options = [];

    for (const line of lines) {
      const optionMatch = line.match(/^([A-Z])\.\s+(.+)$/);
      if (optionMatch) {
        options.push({ label: optionMatch[1], text: optionMatch[2].trim() });
      }
    }

    return { number, stem, options };
  });
};

const splitTableRow = (line) => line
  .replace(/^\|/, '')
  .replace(/\|$/, '')
  .split(/(?<!\\)\|/)
  .map((cell) => cell.replace(/\\\|/g, '|').trim());

const parseAnswers = (content) => {
  const answers = new Map();

  for (const line of content.split('\n')) {
    if (!line.startsWith('|')) {
      continue;
    }

    const cells = splitTableRow(line);
    if (cells.length < 4 || cells[0] === '打乱题号' || cells[0].startsWith('---')) {
      continue;
    }

    const number = Number(cells[0]);
    if (!Number.isFinite(number)) {
      continue;
    }

    answers.set(number, {
      answer: cells[1],
      originalNumber: cells[2],
      analysis: cells[3]
    });
  }

  return answers;
};

const toSafeJson = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');

const buildDataset = async () => {
  const fileNames = (await readdir(outputDir)).sort();
  const paperFiles = fileNames.filter((fileName) => fileName.endsWith('-打乱试题.md'));

  return Promise.all(paperFiles.map(async (paperFile) => {
    const answerFile = paperFile.replace('-打乱试题.md', '-答案.md');
    const [paperContent, answerContent] = await Promise.all([
      readFile(path.join(outputDir, paperFile), 'utf8'),
      readFile(path.join(outputDir, answerFile), 'utf8')
    ]);
    const meta = parseMeta(paperContent);
    const answerMap = parseAnswers(answerContent);
    const questions = parseQuestions(paperContent).map((question) => ({
      ...question,
      correctAnswer: answerMap.get(question.number)?.answer || '',
      originalNumber: answerMap.get(question.number)?.originalNumber || '',
      analysis: answerMap.get(question.number)?.analysis || ''
    }));

    return {
      id: `${meta.year || paperFile}-${meta.session || 'paper'}`,
      label: `${meta.year} ${meta.exam}${meta.session}`.trim(),
      title: meta.title.replace('（打乱试题）', ''),
      year: meta.year,
      exam: meta.exam,
      session: meta.session,
      questionCount: questions.length,
      paperFile,
      answerFile,
      questions
    };
  }));
};

const renderHtml = (papers) => `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>软考上午练习</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f8fa;
      --panel: #ffffff;
      --panel-soft: #f1f5f9;
      --text: #172033;
      --muted: #627085;
      --line: #d8dee8;
      --accent: #0f766e;
      --accent-strong: #0b5d56;
      --wrong: #b42318;
      --right: #16703a;
      --warn: #9a6700;
      --shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-width: 320px;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.55;
    }

    button, select {
      font: inherit;
    }

    button {
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      color: var(--text);
      cursor: pointer;
      min-height: 40px;
      padding: 8px 12px;
    }

    button:hover { border-color: var(--accent); }
    button:disabled { cursor: not-allowed; opacity: 0.56; }

    .app {
      display: grid;
      grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
      min-height: 100vh;
    }

    .sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: auto;
      border-right: 1px solid var(--line);
      background: var(--panel);
      padding: 18px;
    }

    .brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 18px;
    }

    .brand h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 750;
      letter-spacing: 0;
    }

    .badge {
      border-radius: 999px;
      background: #e6f4f1;
      color: var(--accent-strong);
      font-size: 12px;
      padding: 4px 8px;
      white-space: nowrap;
    }

    .field {
      display: grid;
      gap: 6px;
      margin-bottom: 14px;
    }

    .field label {
      color: var(--muted);
      font-size: 13px;
      font-weight: 650;
    }

    select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--panel);
      color: var(--text);
      min-height: 42px;
      padding: 8px 10px;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      margin: 16px 0;
    }

    .stat {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel-soft);
      padding: 10px;
    }

    .stat span {
      display: block;
      color: var(--muted);
      font-size: 12px;
    }

    .stat strong {
      display: block;
      margin-top: 4px;
      font-size: 20px;
      line-height: 1.1;
    }

    .actions {
      display: grid;
      gap: 8px;
    }

    .primary {
      border-color: var(--accent);
      background: var(--accent);
      color: #ffffff;
      font-weight: 700;
    }

    .primary:hover { border-color: var(--accent-strong); background: var(--accent-strong); }

    .danger {
      color: var(--wrong);
    }

    .question-nav {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
      gap: 6px;
      margin-top: 18px;
    }

    .nav-item {
      min-height: 34px;
      padding: 0;
      font-size: 13px;
    }

    .nav-item.answered {
      border-color: #99d6ce;
      background: #e6f4f1;
      color: var(--accent-strong);
    }

    .nav-item.correct {
      border-color: #94d3aa;
      background: #eaf7ee;
      color: var(--right);
    }

    .nav-item.wrong {
      border-color: #f4a6a1;
      background: #fff0ef;
      color: var(--wrong);
    }

    main {
      min-width: 0;
      padding: 28px clamp(16px, 3vw, 40px) 48px;
    }

    .paper-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    .paper-head h2 {
      margin: 0;
      font-size: clamp(22px, 3vw, 34px);
      letter-spacing: 0;
      line-height: 1.2;
    }

    .paper-meta {
      color: var(--muted);
      font-size: 14px;
      margin-top: 8px;
    }

    .score-panel {
      display: none;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: var(--shadow);
      margin-bottom: 18px;
      padding: 16px;
    }

    .score-panel.visible { display: block; }

    .score-line {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 15px;
    }

    .score-line strong {
      font-size: 28px;
    }

    .question-list {
      display: grid;
      gap: 14px;
    }

    .question {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      padding: 16px;
    }

    .question.correct { border-color: #9cd7b2; }
    .question.wrong { border-color: #f0a29c; }

    .question-title {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 12px;
    }

    .question-number {
      display: inline-grid;
      place-items: center;
      flex: 0 0 auto;
      width: 30px;
      height: 30px;
      border-radius: 6px;
      background: var(--panel-soft);
      color: var(--muted);
      font-weight: 750;
      font-size: 13px;
    }

    .question-title h3 {
      margin: 2px 0 0;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0;
    }

    .options {
      display: grid;
      gap: 8px;
      margin-left: 40px;
    }

    .option {
      display: grid;
      grid-template-columns: 26px minmax(0, 1fr);
      gap: 8px;
      align-items: start;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px;
      background: #ffffff;
      cursor: pointer;
    }

    .option input {
      width: 18px;
      height: 18px;
      margin: 3px 0 0;
      accent-color: var(--accent);
    }

    .option.selected {
      border-color: var(--accent);
      background: #edf8f6;
    }

    .option.correct-answer {
      border-color: #8fd1a8;
      background: #eef9f1;
    }

    .option.wrong-answer {
      border-color: #ee9b94;
      background: #fff1f0;
    }

    .option-label {
      font-weight: 750;
    }

    .analysis {
      display: none;
      margin: 12px 0 0 40px;
      border-top: 1px solid var(--line);
      padding-top: 12px;
      color: var(--muted);
    }

    .submitted .analysis { display: block; }

    .analysis strong {
      color: var(--text);
    }

    .footer-actions {
      position: sticky;
      bottom: 0;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      border-top: 1px solid var(--line);
      background: rgba(247, 248, 250, 0.92);
      backdrop-filter: blur(8px);
      padding: 14px 0 0;
    }

    @media (max-width: 860px) {
      .app { grid-template-columns: 1fr; }
      .sidebar {
        position: static;
        height: auto;
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }
      .question-nav { grid-template-columns: repeat(auto-fill, minmax(34px, 1fr)); }
      main { padding-top: 20px; }
      .paper-head { align-items: flex-start; flex-direction: column; }
      .options, .analysis { margin-left: 0; }
    }
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <h1>软考上午练习</h1>
        <span class="badge" id="paperCount"></span>
      </div>
      <div class="field">
        <label for="paperSelect">试卷</label>
        <select id="paperSelect"></select>
      </div>
      <div class="stats" aria-live="polite">
        <div class="stat"><span>已答</span><strong id="answeredCount">0</strong></div>
        <div class="stat"><span>题数</span><strong id="totalCount">0</strong></div>
        <div class="stat"><span>得分</span><strong id="scoreCount">-</strong></div>
        <div class="stat"><span>正确率</span><strong id="accuracyCount">-</strong></div>
      </div>
      <div class="actions">
        <button class="primary" id="submitButton">提交试卷</button>
        <button id="showWrongButton" disabled>只看错题</button>
        <button id="showAllButton" disabled>查看全部</button>
        <button class="danger" id="resetButton">清空作答</button>
      </div>
      <div class="question-nav" id="questionNav" aria-label="题号导航"></div>
    </aside>
    <main>
      <header class="paper-head">
        <div>
          <h2 id="paperTitle"></h2>
          <div class="paper-meta" id="paperMeta"></div>
        </div>
      </header>
      <section class="score-panel" id="scorePanel" aria-live="polite"></section>
      <section class="question-list" id="questionList"></section>
      <div class="footer-actions">
        <button id="bottomResetButton">清空作答</button>
        <button class="primary" id="bottomSubmitButton">提交试卷</button>
      </div>
    </main>
  </div>
  <script id="papers-data" type="application/json">${toSafeJson(papers)}</script>
  <script>
    const papers = JSON.parse(document.getElementById('papers-data').textContent);
    const state = {
      paperId: papers[0]?.id || '',
      answers: {},
      submitted: false,
      onlyWrong: false
    };

    const elements = {
      paperCount: document.getElementById('paperCount'),
      paperSelect: document.getElementById('paperSelect'),
      answeredCount: document.getElementById('answeredCount'),
      totalCount: document.getElementById('totalCount'),
      scoreCount: document.getElementById('scoreCount'),
      accuracyCount: document.getElementById('accuracyCount'),
      submitButton: document.getElementById('submitButton'),
      bottomSubmitButton: document.getElementById('bottomSubmitButton'),
      resetButton: document.getElementById('resetButton'),
      bottomResetButton: document.getElementById('bottomResetButton'),
      showWrongButton: document.getElementById('showWrongButton'),
      showAllButton: document.getElementById('showAllButton'),
      questionNav: document.getElementById('questionNav'),
      paperTitle: document.getElementById('paperTitle'),
      paperMeta: document.getElementById('paperMeta'),
      scorePanel: document.getElementById('scorePanel'),
      questionList: document.getElementById('questionList')
    };

    const getPaper = () => papers.find((paper) => paper.id === state.paperId) || papers[0];
    const storageKey = () => 'ruankao-practice:' + state.paperId;

    const loadState = () => {
      const saved = localStorage.getItem(storageKey());
      state.answers = saved ? JSON.parse(saved) : {};
      state.submitted = false;
      state.onlyWrong = false;
    };

    const saveState = () => {
      localStorage.setItem(storageKey(), JSON.stringify(state.answers));
    };

    const getResult = (question) => {
      const selected = state.answers[question.number] || '';
      return {
        selected,
        correct: selected === question.correctAnswer,
        missed: !selected
      };
    };

    const createElement = (tagName, className, text) => {
      const element = document.createElement(tagName);
      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    };

    const renderSelectors = () => {
      elements.paperCount.textContent = papers.length + ' 套';
      elements.paperSelect.innerHTML = '';
      papers.forEach((paper) => {
        const option = document.createElement('option');
        option.value = paper.id;
        option.textContent = paper.label;
        elements.paperSelect.appendChild(option);
      });
      elements.paperSelect.value = state.paperId;
    };

    const renderStats = () => {
      const paper = getPaper();
      const total = paper.questions.length;
      const answered = paper.questions.filter((question) => state.answers[question.number]).length;
      const score = paper.questions.filter((question) => getResult(question).correct).length;
      const accuracy = total ? Math.round((score / total) * 100) : 0;

      elements.answeredCount.textContent = answered;
      elements.totalCount.textContent = total;
      elements.scoreCount.textContent = state.submitted ? score : '-';
      elements.accuracyCount.textContent = state.submitted ? accuracy + '%' : '-';
      elements.showWrongButton.disabled = !state.submitted;
      elements.showAllButton.disabled = !state.submitted;
      elements.submitButton.disabled = !total;
      elements.bottomSubmitButton.disabled = !total;

      elements.scorePanel.classList.toggle('visible', state.submitted);
      if (state.submitted) {
        const unanswered = total - answered;
        elements.scorePanel.innerHTML = '';
        const scoreLine = createElement('div', 'score-line');
        const scoreStrong = createElement('strong', '', score + ' / ' + total);
        scoreLine.append(scoreStrong, document.createTextNode(' 得分，正确率 ' + accuracy + '%'));
        if (unanswered) {
          scoreLine.append(document.createTextNode('，未答 ' + unanswered + ' 题'));
        }
        elements.scorePanel.appendChild(scoreLine);
      }
    };

    const renderNav = () => {
      const paper = getPaper();
      elements.questionNav.innerHTML = '';
      paper.questions.forEach((question) => {
        const button = createElement('button', 'nav-item', question.number);
        const result = getResult(question);
        if (result.selected) button.classList.add('answered');
        if (state.submitted && result.selected) button.classList.add(result.correct ? 'correct' : 'wrong');
        if (state.submitted && result.missed) button.classList.add('wrong');
        button.addEventListener('click', () => {
          document.getElementById('question-' + question.number)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        elements.questionNav.appendChild(button);
      });
    };

    const renderQuestions = () => {
      const paper = getPaper();
      elements.paperTitle.textContent = paper.title;
      elements.paperMeta.textContent = paper.paperFile + ' / ' + paper.answerFile;
      elements.questionList.innerHTML = '';

      paper.questions.forEach((question) => {
        const result = getResult(question);
        if (state.onlyWrong && state.submitted && result.correct) {
          return;
        }

        const article = createElement('article', 'question');
        article.id = 'question-' + question.number;
        if (state.submitted) {
          article.classList.add(result.correct ? 'correct' : 'wrong');
        }

        const title = createElement('div', 'question-title');
        title.append(createElement('span', 'question-number', question.number));
        title.append(createElement('h3', '', question.stem));

        const options = createElement('div', 'options');
        question.options.forEach((option) => {
          const label = createElement('label', 'option');
          const input = document.createElement('input');
          input.type = 'radio';
          input.name = 'question-' + question.number;
          input.value = option.label;
          input.checked = result.selected === option.label;
          input.disabled = state.submitted;

          if (input.checked) label.classList.add('selected');
          if (state.submitted && option.label === question.correctAnswer) label.classList.add('correct-answer');
          if (state.submitted && input.checked && option.label !== question.correctAnswer) label.classList.add('wrong-answer');

          input.addEventListener('change', () => {
            state.answers[question.number] = option.label;
            saveState();
            render();
          });

          const optionText = createElement('span');
          optionText.append(createElement('span', 'option-label', option.label + '. '));
          optionText.append(document.createTextNode(option.text));
          label.append(input, optionText);
          options.appendChild(label);
        });

        const analysis = createElement('div', 'analysis');
        analysis.innerHTML = '<strong>正确答案：</strong>' + question.correctAnswer
          + '　<strong>你的答案：</strong>' + (result.selected || '未答')
          + '　<strong>原题号：</strong>' + (question.originalNumber || '-')
          + '<br><strong>解析：</strong>' + question.analysis;

        article.append(title, options, analysis);
        elements.questionList.appendChild(article);
      });
    };

    const render = () => {
      document.body.classList.toggle('submitted', state.submitted);
      renderSelectors();
      renderStats();
      renderNav();
      renderQuestions();
    };

    const submitPaper = () => {
      state.submitted = true;
      state.onlyWrong = false;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetPaper = () => {
      state.answers = {};
      state.submitted = false;
      state.onlyWrong = false;
      saveState();
      render();
    };

    elements.paperSelect.addEventListener('change', (event) => {
      state.paperId = event.target.value;
      loadState();
      render();
      window.scrollTo({ top: 0 });
    });
    elements.submitButton.addEventListener('click', submitPaper);
    elements.bottomSubmitButton.addEventListener('click', submitPaper);
    elements.resetButton.addEventListener('click', resetPaper);
    elements.bottomResetButton.addEventListener('click', resetPaper);
    elements.showWrongButton.addEventListener('click', () => {
      state.onlyWrong = true;
      render();
    });
    elements.showAllButton.addEventListener('click', () => {
      state.onlyWrong = false;
      render();
    });

    loadState();
    render();
  </script>
</body>
</html>
`;

const papers = await buildDataset();
await writeFile(htmlPath, renderHtml(papers), 'utf8');
console.log(`已生成练习页面：${htmlPath}`);