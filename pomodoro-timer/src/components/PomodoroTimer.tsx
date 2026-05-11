import React, { useEffect, useRef, useState } from 'react';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

type Durations = Record<TimerMode, number>;
type HistoryRecord = Record<string, number>;

const DEFAULT_DURATIONS: Durations = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const MODE_META: Record<
  TimerMode,
  {
    badge: string;
    label: string;
    caption: string;
    accent: string;
    softAccent: string;
    ring: string;
  }
> = {
  focus: {
    badge: '专注',
    label: '专注时间',
    caption: '沉浸式完成一轮 25 分钟工作周期',
    accent: '#f43f5e',
    softAccent: 'from-rose-500 to-orange-400',
    ring: 'rgba(244, 63, 94, 0.22)',
  },
  shortBreak: {
    badge: '短休息',
    label: '短休息时间',
    caption: '用几分钟放松一下，再继续推进任务',
    accent: '#0f766e',
    softAccent: 'from-teal-500 to-emerald-400',
    ring: 'rgba(15, 118, 110, 0.2)',
  },
  longBreak: {
    badge: '长休息',
    label: '长休息时间',
    caption: '深呼吸，拉开一点距离，恢复节奏感',
    accent: '#2563eb',
    softAccent: 'from-sky-500 to-blue-500',
    ring: 'rgba(37, 99, 235, 0.18)',
  },
};

function formatTime(seconds: number) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${minutes}:${secs}`;
}

function getStorageNumber(key: string, fallback: number) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const rawValue = window.localStorage.getItem(key);
  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function setStorageNumber(key: string, value: number) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, String(value));
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readHistory(): HistoryRecord {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawHistory = window.localStorage.getItem('pomodoroHistory');
    return rawHistory ? (JSON.parse(rawHistory) as HistoryRecord) : {};
  } catch {
    return {};
  }
}

function writeHistory(history: HistoryRecord) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem('pomodoroHistory', JSON.stringify(history));
}

function getTodayCount() {
  const history = readHistory();
  return history[getDateKey(new Date())] || 0;
}

function getWeekCount() {
  const history = readHistory();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = today.getDay();
  const offset = day === 0 ? 6 : day - 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - offset);

  let total = 0;
  for (let index = 0; index < 7; index += 1) {
    const currentDay = new Date(weekStart);
    currentDay.setDate(weekStart.getDate() + index);
    total += history[getDateKey(currentDay)] || 0;
  }

  return total;
}

function getNextMode(currentMode: TimerMode, nextCompletedCount: number): TimerMode {
  if (currentMode === 'focus') {
    return nextCompletedCount > 0 && nextCompletedCount % 4 === 0 ? 'longBreak' : 'shortBreak';
  }

  return 'focus';
}

function playFallbackTone() {
  if (typeof window === 'undefined') {
    return;
  }

  const ContextClass = window.AudioContext || window.webkitAudioContext;
  if (!ContextClass) {
    return;
  }

  const context = new ContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.5);

  oscillator.onended = () => {
    void context.close();
  };
}

const PomodoroTimer: React.FC = () => {
  const [durations, setDurations] = useState<Durations>(() => ({
    focus: getStorageNumber('duration_focus', DEFAULT_DURATIONS.focus),
    shortBreak: getStorageNumber('duration_shortBreak', DEFAULT_DURATIONS.shortBreak),
    longBreak: getStorageNumber('duration_longBreak', DEFAULT_DURATIONS.longBreak),
  }));
  const [mode, setMode] = useState<TimerMode>('focus');
  const [time, setTime] = useState(() => getStorageNumber('duration_focus', DEFAULT_DURATIONS.focus));
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(() => getStorageNumber('completed', 0));
  const [todayCount, setTodayCount] = useState(() => getTodayCount());
  const [weekCount, setWeekCount] = useState(() => getWeekCount());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentMeta = MODE_META[mode];
  const currentDuration = durations[mode];
  const progress = currentDuration > 0 ? ((currentDuration - time) / currentDuration) * 100 : 0;
  const progressAngle = Math.min(Math.max(progress, 0), 100) * 3.6;

  useEffect(() => {
    audioRef.current = new Audio('/alarm.mp3');
    audioRef.current.preload = 'auto';
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      void Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    setStorageNumber('duration_focus', durations.focus);
    setStorageNumber('duration_shortBreak', durations.shortBreak);
    setStorageNumber('duration_longBreak', durations.longBreak);
  }, [durations]);

  useEffect(() => {
    setStorageNumber('completed', completed);
  }, [completed]);

  useEffect(() => {
    document.title = `${formatTime(time)} · ${currentMeta.badge} | 番茄钟`;
    return () => {
      document.title = '番茄钟';
    };
  }, [currentMeta.badge, time]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      setTime((previousTime) => Math.max(previousTime - 1, 0));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || time !== 0) {
      return;
    }

    setIsRunning(false);

    let nextCompletedCount = completed;
    if (mode === 'focus') {
      nextCompletedCount = completed + 1;
      setCompleted(nextCompletedCount);

      const history = readHistory();
      const todayKey = getDateKey(new Date());
      history[todayKey] = (history[todayKey] || 0) + 1;
      writeHistory(history);
      setTodayCount(history[todayKey]);
      setWeekCount(getWeekCount());
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('番茄钟', {
        body: '时间到了，该休息了！',
        icon: '/favicon.ico',
      });
    }

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => {
        playFallbackTone();
      });
    } else {
      playFallbackTone();
    }

    const nextMode = getNextMode(mode, nextCompletedCount);
    setMode(nextMode);
    setTime(durations[nextMode]);
  }, [completed, durations, isRunning, mode, time]);

  function handleStart() {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
      void Notification.requestPermission();
    }
    setIsRunning(true);
  }

  function handlePause() {
    setIsRunning(false);
  }

  function handleReset() {
    setIsRunning(false);
    setTime(durations[mode]);
  }

  function handleModeSelect(nextMode: TimerMode) {
    setIsRunning(false);
    setMode(nextMode);
    setTime(durations[nextMode]);
  }

  function handleDurationChange(nextMode: TimerMode, minutes: number) {
    const normalizedMinutes = Number.isFinite(minutes) ? Math.max(1, minutes) : 1;
    const nextDuration = normalizedMinutes * 60;

    setDurations((previousDurations) => ({
      ...previousDurations,
      [nextMode]: nextDuration,
    }));

    if (!isRunning && mode === nextMode) {
      setTime(nextDuration);
    }
  }

  function handleClearStats() {
    setCompleted(0);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('pomodoroHistory');
      window.localStorage.removeItem('completed');
    }
    setTodayCount(0);
    setWeekCount(0);
  }

  return (
    <div className="w-full max-w-xl rounded-[32px] border border-white/50 bg-white/80 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.14)] backdrop-blur xl:p-7">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Pomodoro Flow</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">番茄钟计时器</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">顶部可直接切换专注、短休息和长休息模式，结束后会自动进入下一阶段。</p>
        </div>
        <div className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-right shadow-sm sm:block">
          <p className="text-xs text-slate-400">本周完成</p>
          <p className="text-lg font-semibold text-slate-900">{weekCount}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 rounded-[24px] bg-slate-100/90 p-2">
        {(Object.keys(MODE_META) as TimerMode[]).map((item) => {
          const isActive = item === mode;

          return (
            <button
              key={item}
              type="button"
              onClick={() => handleModeSelect(item)}
              className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? `bg-gradient-to-r ${MODE_META[item].softAccent} text-white shadow-lg`
                  : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-900'
              }`}
            >
              {MODE_META[item].badge}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-[28px] bg-slate-950 px-5 py-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                {currentMeta.badge}
              </span>
              <h2 className="mt-3 text-2xl font-semibold">{currentMeta.label}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">{currentMeta.caption}</p>
            </div>
            <div
              className="relative flex h-40 w-40 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${currentMeta.accent} ${progressAngle}deg, ${currentMeta.ring} ${progressAngle}deg 360deg)`,
              }}
            >
              <div className="flex h-[132px] w-[132px] flex-col items-center justify-center rounded-full bg-slate-950 shadow-[0_16px_40px_rgba(15,23,42,0.4)]">
                <span className="text-[40px] font-semibold tracking-[0.08em]">{formatTime(time)}</span>
                <span className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                  {isRunning ? '进行中' : '已暂停'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleStart}
              disabled={isRunning}
              className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              开始
            </button>
            <button
              type="button"
              onClick={handlePause}
              disabled={!isRunning}
              className="rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              暂停
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              重置
            </button>
          </div>
        </section>

        <section className="space-y-4 rounded-[28px] bg-slate-50/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">时长设置</h3>
            <div className="mt-4 space-y-3">
              {(Object.keys(MODE_META) as TimerMode[]).map((item) => (
                <label key={item} className="flex items-center justify-between rounded-[20px] bg-white px-4 py-3 shadow-sm">
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">{MODE_META[item].badge}</span>
                    <span className="mt-1 block text-xs text-slate-400">分钟</span>
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={durations[item] / 60}
                    onChange={(event) => handleDurationChange(item, Number(event.target.value))}
                    className="w-20 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-[22px] bg-white px-4 py-4 shadow-sm">
              <p className="text-xs text-slate-400">累计完成</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{completed}</p>
            </div>
            <div className="rounded-[22px] bg-white px-4 py-4 shadow-sm">
              <p className="text-xs text-slate-400">今日完成</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{todayCount}</p>
            </div>
            <div className="rounded-[22px] bg-white px-4 py-4 shadow-sm">
              <p className="text-xs text-slate-400">本周完成</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{weekCount}</p>
            </div>
          </div>

          <div className="rounded-[22px] bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">节奏提示</p>
            <p className="mt-2 text-sm leading-6 text-white/85">
              每完成 4 个专注周期，会自动切换到 15 分钟长休息；你也可以在顶部直接手动切换模式。
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearStats}
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            清空统计
          </button>
        </section>
      </div>
    </div>
  );
};

export default PomodoroTimer;
