import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const sourcesDir = path.join(rootDir, 'sources');
const outputDir = path.join(rootDir, 'output');
const optionLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const hashSeed = (value) => {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createRandom = (seedText) => {
  let state = hashSeed(seedText);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = (items, random) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(random() * (index + 1));
    [result[index], result[nextIndex]] = [result[nextIndex], result[index]];
  }
  return result;
};

const normalizeOptions = (options = {}) => {
  if (Array.isArray(options)) {
    return options.map((text, index) => [optionLabels[index], text]);
  }

  return Object.entries(options).sort(([left], [right]) => left.localeCompare(right));
};

const normalizeAnswers = (answer) => {
  if (Array.isArray(answer)) {
    return answer;
  }

  if (typeof answer === 'string' && answer.trim()) {
    return answer.split('').filter((item) => /[A-Z]/i.test(item)).map((item) => item.toUpperCase());
  }

  return [];
};

const formatAnswer = (answers) => answers.join('');

const remapQuestion = (question, random) => {
  const shuffledOptions = shuffle(normalizeOptions(question.options), random);
  const optionMap = new Map();
  const options = shuffledOptions.map(([originalLabel, text], index) => {
    const nextLabel = optionLabels[index];
    optionMap.set(originalLabel.toUpperCase(), nextLabel);
    return { label: nextLabel, text };
  });

  const answer = normalizeAnswers(question.answer)
    .map((label) => optionMap.get(label))
    .filter(Boolean)
    .sort();

  return {
    ...question,
    originalNumber: question.number,
    options,
    answer
  };
};

const sanitizeFileName = (value) => value
  .replace(/[\\/:*?"<>|]/g, '-')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const renderPaper = (source, questions, sourceFileName) => {
  const lines = [
    `# ${source.title}（打乱试题）`,
    '',
    `- 考试：${source.exam}`,
    `- 场次：${source.session}`,
    `- 年份：${source.year}`,
    `- 来源文件：${sourceFileName}`,
    `- 打乱种子：${source.seed}`,
    ''
  ];

  if (!questions.length) {
    lines.push('> 题源尚未补充。将合法拥有的题目填入对应 `sources/*.json` 后，重新运行生成脚本即可生成本套试题。');
    lines.push('');
    return lines.join('\n');
  }

  questions.forEach((question, index) => {
    lines.push(`## ${index + 1}. ${question.stem}`);
    lines.push('');
    question.options.forEach((option) => {
      lines.push(`${option.label}. ${option.text}`);
    });
    lines.push('');
  });

  return lines.join('\n');
};

const renderAnswers = (source, questions, sourceFileName) => {
  const lines = [
    `# ${source.title}（答案）`,
    '',
    `- 考试：${source.exam}`,
    `- 场次：${source.session}`,
    `- 年份：${source.year}`,
    `- 来源文件：${sourceFileName}`,
    `- 打乱种子：${source.seed}`,
    ''
  ];

  if (!questions.length) {
    lines.push('> 题源尚未补充，因此暂无答案。');
    lines.push('');
    return lines.join('\n');
  }

  lines.push('| 打乱题号 | 答案 | 原题号 | 解析 |');
  lines.push('| --- | --- | --- | --- |');
  questions.forEach((question, index) => {
    const analysis = question.analysis || '';
    lines.push(`| ${index + 1} | ${formatAnswer(question.answer)} | ${question.originalNumber ?? ''} | ${analysis.replace(/\|/g, '\\|')} |`);
  });
  lines.push('');

  return lines.join('\n');
};

const loadSource = async (fileName) => {
  const filePath = path.join(sourcesDir, fileName);
  const content = await readFile(filePath, 'utf8');
  return JSON.parse(content);
};

const generate = async () => {
  await mkdir(outputDir, { recursive: true });
  const sourceFiles = (await readdir(sourcesDir))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort();

  for (const sourceFileName of sourceFiles) {
    const source = await loadSource(sourceFileName);
    const seed = source.seed || source.id || source.title || sourceFileName;
    const random = createRandom(seed);
    const shuffledQuestions = shuffle(source.questions || [], random)
      .map((question) => remapQuestion(question, random));
    const baseName = sanitizeFileName(`${source.year}-${source.session}-${source.exam}`);

    await writeFile(
      path.join(outputDir, `${baseName}-打乱试题.md`),
      renderPaper(source, shuffledQuestions, sourceFileName),
      'utf8'
    );
    await writeFile(
      path.join(outputDir, `${baseName}-答案.md`),
      renderAnswers(source, shuffledQuestions, sourceFileName),
      'utf8'
    );
  }

  console.log(`已生成 ${sourceFiles.length} 套试题和答案到 ${outputDir}`);
};

generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});