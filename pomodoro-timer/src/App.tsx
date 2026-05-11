import React from 'react';
import PomodoroTimer from './components/PomodoroTimer';

export default function App() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(236,253,245,0.88)_38%,_rgba(224,231,255,0.82)_72%,_rgba(15,23,42,0.12))] px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.18),_transparent_58%)]" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="absolute left-0 top-1/3 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="relative w-full max-w-5xl">
        <PomodoroTimer />
      </div>
    </div>
  );
}
