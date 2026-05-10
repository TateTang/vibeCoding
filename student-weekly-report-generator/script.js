const studentNameInput = document.getElementById("studentName");
const attendanceDaysInput = document.getElementById("attendanceDays");
const homeworkCountInput = document.getElementById("homeworkCount");
const reportOutput = document.getElementById("reportOutput");
const statusText = document.getElementById("statusText");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const HISTORY_KEY = "student-weekly-reports";

function getEvaluation(attendanceDays, homeworkCount) {
  if (attendanceDays >= 5 && homeworkCount >= 8) {
    return "整体状态优秀，学习认真主动，值得表扬。";
  }

  if (attendanceDays >= 5 && homeworkCount >= 5) {
    return "整体表现良好，学习节奏稳定，继续保持。";
  }

  if (attendanceDays >= 3 && homeworkCount >= 5) {
    return "表现比较稳定，在出勤和作业方面都有不错完成。";
  }

  if (attendanceDays >= 3 || homeworkCount >= 5) {
    return "本周有一定进步，后续仍可继续加强学习自觉性。";
  }

  return "本周还有提升空间，下周可进一步加强出勤和作业落实。";
}

function buildReport(name, attendanceDays, homeworkCount) {
  const evaluation = getEvaluation(attendanceDays, homeworkCount);
  return `【学生周报】${name}同学本周表现：出勤${attendanceDays}天，完成作业${homeworkCount}份。${evaluation}`;
}

function setStatus(message) {
  statusText.textContent = message;
}

function getHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString("zh-CN", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderHistory() {
  const history = getHistory();

  if (history.length === 0) {
    historyList.innerHTML =
      '<p class="history-empty">暂时还没有历史记录，先生成一条周报试试看。</p>';
    return;
  }

  historyList.innerHTML = history
    .map(
      (item) => `
        <article class="history-item">
          <div class="history-meta">
            <span class="history-name">${item.name}</span>
            <span>${formatTime(item.createdAt)}</span>
          </div>
          <p class="history-text">${item.report}</p>
        </article>
      `
    )
    .join("");
}

function addHistoryItem(name, attendanceDays, homeworkCount, report) {
  const history = getHistory();
  const nextHistory = [
    {
      name,
      attendanceDays,
      homeworkCount,
      report,
      createdAt: Date.now(),
    },
    ...history,
  ].slice(0, 12);

  saveHistory(nextHistory);
  renderHistory();
}

function generateReport() {
  const name = studentNameInput.value.trim();
  const attendanceDays = Number(attendanceDaysInput.value);
  const homeworkCount = Number(homeworkCountInput.value);

  if (!name) {
    reportOutput.value = "";
    setStatus("请先输入学生姓名");
    studentNameInput.focus();
    return;
  }

  if (Number.isNaN(attendanceDays) || attendanceDaysInput.value.trim() === "") {
    reportOutput.value = "";
    setStatus("请先输入考勤天数");
    attendanceDaysInput.focus();
    return;
  }

  if (Number.isNaN(homeworkCount) || homeworkCountInput.value.trim() === "") {
    reportOutput.value = "";
    setStatus("请先输入作业完成数");
    homeworkCountInput.focus();
    return;
  }

  const report = buildReport(name, attendanceDays, homeworkCount);
  reportOutput.value = report;
  addHistoryItem(name, attendanceDays, homeworkCount, report);
  setStatus("周报已生成");
}

async function copyReport() {
  const text = reportOutput.value.trim();

  if (!text) {
    setStatus("请先生成周报");
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      reportOutput.focus();
      reportOutput.select();
      document.execCommand("copy");
      reportOutput.setSelectionRange(0, 0);
    }

    setStatus("已复制到剪贴板");
  } catch (error) {
    setStatus("复制失败，请手动复制");
    console.error(error);
  }
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  setStatus("历史记录已清空");
}

generateBtn.addEventListener("click", generateReport);
copyBtn.addEventListener("click", copyReport);
clearHistoryBtn.addEventListener("click", clearHistory);

[studentNameInput, attendanceDaysInput, homeworkCountInput].forEach((input) => {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      generateReport();
    }
  });
});

renderHistory();
