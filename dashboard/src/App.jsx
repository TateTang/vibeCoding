import { useEffect, useState } from "react";
import ElectronicBlackboard from "./components/ElectronicBlackboard.jsx";

const THEME_KEY = "dashboard-app-theme";

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  return savedTheme === "dark" ? "dark" : "light";
}

export default function App() {
  const [theme, setTheme] = useState(loadTheme);

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <main className="app app--wide">
      <section className="dashboard-shell card">
        <div className="dashboard-shell-inner">
          <h1 className="app-title">电子黑板</h1>
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ 亮色模式" : "🌙 深色模式"}
          </button>
        </div>
      </section>

      <ElectronicBlackboard />
    </main>
  );
}
