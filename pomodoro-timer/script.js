const WORK_DURATION = 25 * 60; // 25分钟
const BREAK_DURATION = 5 * 60; // 5分钟

let timer = WORK_DURATION;
let isRunning = false;
let isWork = true;
let interval = null;

const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const statusDisplay = document.getElementById('status');
const alarm = document.getElementById('alarm');

function updateDisplay() {
  const min = String(Math.floor(timer / 60)).padStart(2, '0');
  const sec = String(timer % 60).padStart(2, '0');
  timerDisplay.textContent = `${min}:${sec}`;
  statusDisplay.textContent = isWork ? '工作中' : '休息中';
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  interval = setInterval(() => {
    if (timer > 0) {
      timer--;
      updateDisplay();
    } else {
      alarm.play();
      clearInterval(interval);
      isRunning = false;
      isWork = !isWork;
      timer = isWork ? WORK_DURATION : BREAK_DURATION;
      updateDisplay();
      // 可选：自动开始下一个阶段
      // startTimer();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(interval);
  isRunning = false;
}

function resetTimer() {
  clearInterval(interval);
  isRunning = false;
  timer = isWork ? WORK_DURATION : BREAK_DURATION;
  updateDisplay();
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

updateDisplay();
