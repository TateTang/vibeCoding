import { useEffect, useState } from "react";

const STORAGE_KEY = "todo-list-web-app-react-items";
const THEME_KEY = "todo-list-web-app-react-theme";

function loadTodos() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((todo) => ({
      id: todo.id,
      order: typeof todo.order === "number" ? todo.order : Number(todo.id) || Date.now(),
      text: typeof todo.text === "string" ? todo.text : "",
      completed: Boolean(todo.completed),
      priority: ["high", "medium", "low"].includes(todo.priority) ? todo.priority : "medium",
      category: typeof todo.category === "string" ? todo.category : "",
      dueDate: typeof todo.dueDate === "string" ? todo.dueDate : "",
      isEditing: false,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

function getPriorityLabel(priority) {
  if (priority === "high") return "高优先级";
  if (priority === "low") return "低优先级";
  return "中优先级";
}

function formatDueDate(dueDate) {
  if (!dueDate) {
    return "";
  }

  const [year, month, day] = dueDate.split("-");
  if (!year || !month || !day) {
    return dueDate;
  }

  return `${year}/${month}/${day}`;
}

function isOverdue(todo) {
  if (!todo.dueDate || todo.completed) {
    return false;
  }

  const today = new Date();
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  return todo.dueDate < todayText;
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  return savedTheme === "dark" ? "dark" : "light";
}

function reorderTodos(list, draggedId, targetId) {
  const next = [...list];
  const draggedIndex = next.findIndex((todo) => todo.id === draggedId);
  const targetIndex = next.findIndex((todo) => todo.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
    return list;
  }

  const [draggedItem] = next.splice(draggedIndex, 1);
  next.splice(targetIndex, 0, draggedItem);

  return next.map((todo, index) => ({
    ...todo,
    order: index,
  }));
}

export default function App() {
  const [todoText, setTodoText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortType, setSortType] = useState("manual");
  const [theme, setTheme] = useState(loadTheme);
  const [draggedTodoId, setDraggedTodoId] = useState(null);
  const [todos, setTodos] = useState(loadTodos);

  useEffect(() => {
    const payload = todos.map(({ isEditing, ...todo }) => todo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [todos]);

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const pendingCount = todos.length - completedCount;
  const progressPercent =
    todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);
  const overdueCount = todos.filter((todo) => isOverdue(todo)).length;
  const normalizedSearchText = searchText.trim().toLowerCase();
  const categoryOptions = Array.from(
    new Set(todos.map((todo) => todo.category.trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "zh-CN"));
  const filteredTodos = todos
    .filter((todo) => {
    const matchesCategory =
      selectedCategory === "all" ? true : todo.category === selectedCategory;

    if (!matchesCategory) {
      return false;
    }

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "completed"
          ? todo.completed
          : !todo.completed;

    if (!matchesStatus) {
      return false;
    }

    if (!normalizedSearchText) {
      return true;
    }

    return (
      todo.text.toLowerCase().includes(normalizedSearchText) ||
      todo.category.toLowerCase().includes(normalizedSearchText)
    );
    })
    .sort((left, right) => {
      if (sortType === "oldest") {
        return left.id - right.id;
      }

      if (sortType === "priority") {
        const rank = { high: 0, medium: 1, low: 2 };
        const priorityGap = rank[left.priority] - rank[right.priority];
        return priorityGap !== 0 ? priorityGap : left.order - right.order;
      }

      if (sortType === "manual") {
        return left.order - right.order;
      }

      return right.id - left.id;
    });

  function addTodo(event) {
    event.preventDefault();
    const trimmed = todoText.trim();
    if (!trimmed) return;

    setTodos((current) => [
      {
        id: Date.now(),
        order: current.length,
        text: trimmed,
        priority,
        category: category.trim(),
        dueDate,
        completed: false,
        isEditing: false,
      },
      ...current,
    ]);
    setTodoText("");
    setPriority("medium");
    setCategory("");
    setDueDate("");
  }

  function toggleTodo(id) {
    setTodos((current) =>
      current.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    );
  }

  function deleteTodo(id) {
    setTodos((current) => current.filter((todo) => todo.id !== id));
  }

  function clearCompleted() {
    setTodos((current) => current.filter((todo) => !todo.completed));
  }

  function clearAll() {
    if (todos.length === 0) return;
    if (!window.confirm("确定要清空全部任务吗？此操作不可撤销。")) return;
    setTodos([]);
  }

  function startEdit(id) {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, isEditing: true } : { ...todo, isEditing: false }
      )
    );
  }

  function changeEditText(id, nextText) {
    setTodos((current) =>
      current.map((todo) => (todo.id === id ? { ...todo, text: nextText } : todo))
    );
  }

  function finishEdit(id) {
    setTodos((current) =>
      current.map((todo) => {
        if (todo.id !== id) return todo;

        const trimmed = todo.text.trim();
        return {
          ...todo,
          text: trimmed || todo.text,
          isEditing: false,
        };
      })
    );
  }

  function cancelEdit(id) {
    setTodos((current) =>
      current.map((todo) => (todo.id === id ? { ...todo, isEditing: false } : todo))
    );
  }

  function exportTodos() {
    if (todos.length === 0) {
      window.alert("当前没有任务可导出。");
      return;
    }

    const content = todos
      .map((todo, index) => {
        const status = todo.completed ? "已完成" : "未完成";
        const categoryText = todo.category ? ` | 分类：${todo.category}` : "";
        const dueDateText = todo.dueDate ? ` | 截止：${formatDueDate(todo.dueDate)}` : "";
        return `${index + 1}. [${status}] ${todo.text} | 优先级：${getPriorityLabel(
          todo.priority
        )}${categoryText}${dueDateText}`;
      })
      .join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateText = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `todo-export-${dateText}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    if (todos.length === 0) {
      window.alert("当前没有任务可导出。");
      return;
    }

    const escapeCsv = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const header = ["序号", "状态", "任务内容", "优先级", "分类", "截止日期"];
    const rows = todos.map((todo, index) => [
      index + 1,
      todo.completed ? "已完成" : "未完成",
      todo.text,
      getPriorityLabel(todo.priority),
      todo.category || "",
      todo.dueDate ? formatDueDate(todo.dueDate) : "",
    ]);
    const content = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateText = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `todo-export-${dateText}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setSearchText("");
    setSelectedCategory("all");
    setStatusFilter("all");
    setSortType("manual");
  }

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  function handleDragStart(todoId) {
    if (sortType !== "manual") {
      return;
    }

    setDraggedTodoId(todoId);
  }

  function handleDragOver(event) {
    if (sortType !== "manual") {
      return;
    }

    event.preventDefault();
  }

  function handleDrop(targetTodoId) {
    if (sortType !== "manual" || draggedTodoId === null) {
      return;
    }

    setTodos((current) => reorderTodos(current, draggedTodoId, targetTodoId));
    setDraggedTodoId(null);
  }

  function handleDragEnd() {
    setDraggedTodoId(null);
  }

  return (
    <main className="app">
      <section className="hero card">
        <div className="hero-top">
          <div>
            <p className="eyebrow">React To-do Studio</p>
            <h1>🧸 我的待办清单</h1>
            <p className="subtitle">支持拖拽排序、深色模式、分类筛选和本地持久化。</p>
          </div>
          <button type="button" className="theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ 亮色模式" : "🌙 深色模式"}
          </button>
        </div>
      </section>

      <section className="card panel">
        <form className="input-row" onSubmit={addTodo}>
          <input
            value={todoText}
            onChange={(event) => setTodoText(event.target.value)}
            type="text"
            placeholder="今天要做什么？"
            autoComplete="off"
          />
          <select
            className="priority-select"
            aria-label="任务优先级"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            <option value="high">高优先级</option>
            <option value="medium">中优先级</option>
            <option value="low">低优先级</option>
          </select>
          <input
            className="category-input"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            type="text"
            placeholder="分类标签，例如：学习"
            autoComplete="off"
          />
          <input
            className="date-input"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            type="date"
            aria-label="截止日期"
          />
          <button type="submit" className="primary-btn">
            ➕ 添加任务
          </button>
        </form>

        <section className="progress-panel">
          <div className="progress-header">
            <span>完成进度</span>
            <strong>{progressPercent}%</strong>
          </div>
          <div className="progress-track">
            <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="progress-note">
            当前共 {todos.length} 项任务，已完成 {completedCount} 项
            {overdueCount > 0 ? `，其中 ${overdueCount} 项已逾期` : "，暂无逾期任务"}。
          </p>
        </section>

        <section className="stats">
          <div className="stat">
            <span>未完成</span>
            <strong>{pendingCount}</strong>
          </div>
          <div className="stat">
            <span>已完成</span>
            <strong>{completedCount}</strong>
          </div>
          <div className="stat">
            <span>总计</span>
            <strong>{todos.length}</strong>
          </div>
        </section>

        <section className="list-wrap">
          <div className="list-header">
            <h2>任务列表</h2>
            <div className="list-actions">
              <button type="button" className="export-btn" onClick={exportTodos}>
                导出文本
              </button>
              <button type="button" className="csv-btn" onClick={exportCsv}>
                导出 CSV
              </button>
              <button type="button" className="ghost-btn" onClick={clearCompleted}>
                清空已完成
              </button>
              <button type="button" className="danger-btn" onClick={clearAll}>
                全部清空
              </button>
            </div>
          </div>

          <div className="search-row">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              type="text"
              placeholder="搜索任务内容或分类标签"
              autoComplete="off"
            />
            <select
              className="filter-select"
              aria-label="按分类筛选"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value="all">全部分类</option>
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="filter-select"
              aria-label="按完成状态筛选"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">全部状态</option>
              <option value="pending">仅看未完成</option>
              <option value="completed">仅看已完成</option>
            </select>
            <select
              className="filter-select"
              aria-label="排序方式"
              value={sortType}
              onChange={(event) => setSortType(event.target.value)}
            >
              <option value="manual">手动拖拽排序</option>
              <option value="newest">按最新添加</option>
              <option value="oldest">按最早添加</option>
              <option value="priority">按优先级</option>
            </select>
            <button type="button" className="ghost-btn reset-btn" onClick={resetFilters}>
              重置筛选
            </button>
          </div>

          {sortType === "manual" && filteredTodos.length > 1 ? (
            <p className="drag-tip">拖动任务卡片可以重新排序，顺序会自动保存。</p>
          ) : null}

          {todos.length === 0 ? (
            <p className="empty-state">清单还是空的，先加一条你想完成的小任务吧 ✨</p>
          ) : filteredTodos.length === 0 ? (
            <p className="empty-state">没有找到匹配的任务，试试换个关键词搜索。</p>
          ) : (
            <ul className="todo-list">
              {filteredTodos.map((todo) => (
                <li
                  key={todo.id}
                  className={`todo-item priority-${todo.priority} ${
                    todo.completed ? "completed" : ""
                  } ${draggedTodoId === todo.id ? "dragging" : ""}`}
                  draggable={sortType === "manual"}
                  onDragStart={() => handleDragStart(todo.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(todo.id)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="drag-handle" aria-hidden="true">
                    ⋮⋮
                  </span>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    aria-label="标记任务完成"
                  />
                  <div className="todo-main">
                    <div className="todo-meta">
                      <span className={`priority-badge ${todo.priority}`}>
                        {getPriorityLabel(todo.priority)}
                      </span>
                      {todo.category ? <span className="category-badge">#{todo.category}</span> : null}
                      {todo.dueDate ? (
                        <span className={`due-date-badge ${isOverdue(todo) ? "overdue" : ""}`}>
                          截止：{formatDueDate(todo.dueDate)}
                        </span>
                      ) : null}
                    </div>
                    {todo.isEditing ? (
                      <input
                        className="edit-input"
                        value={todo.text}
                        onChange={(event) => changeEditText(todo.id, event.target.value)}
                        onBlur={() => finishEdit(todo.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") finishEdit(todo.id);
                          if (event.key === "Escape") cancelEdit(todo.id);
                        }}
                        autoFocus
                      />
                    ) : (
                      <span className="todo-text">{todo.text}</span>
                    )}
                  </div>
                  <div className="item-actions">
                    <button type="button" className="edit-btn" onClick={() => startEdit(todo.id)}>
                      编辑
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => deleteTodo(todo.id)}
                    >
                      删除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
