const { useEffect, useState } = React;

const STORAGE_KEY = "todo-list-web-app-react-items";

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
      text: typeof todo.text === "string" ? todo.text : "",
      completed: Boolean(todo.completed),
      priority: ["high", "medium", "low"].includes(todo.priority) ? todo.priority : "medium",
      isEditing: false,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

function getPriorityLabel(priority) {
  if (priority === "high") {
    return "高优先级";
  }
  if (priority === "low") {
    return "低优先级";
  }
  return "中优先级";
}

function App() {
  const [todoText, setTodoText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [todos, setTodos] = useState(loadTodos);

  useEffect(() => {
    const payload = todos.map(({ isEditing, ...todo }) => todo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [todos]);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const pendingCount = todos.length - completedCount;

  function addTodo(event) {
    event.preventDefault();
    const trimmed = todoText.trim();

    if (!trimmed) {
      return;
    }

    setTodos((current) => [
      {
        id: Date.now(),
        text: trimmed,
        priority,
        completed: false,
        isEditing: false,
      },
      ...current,
    ]);
    setTodoText("");
    setPriority("medium");
  }

  function toggleTodo(id) {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  function deleteTodo(id) {
    setTodos((current) => current.filter((todo) => todo.id !== id));
  }

  function clearCompleted() {
    setTodos((current) => current.filter((todo) => !todo.completed));
  }

  function clearAll() {
    if (todos.length === 0) {
      return;
    }

    if (!window.confirm("确定要清空全部任务吗？此操作不可撤销。")) {
      return;
    }

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
      current
        .map((todo) => {
          if (todo.id !== id) {
            return todo;
          }

          const trimmed = todo.text.trim();
          if (!trimmed) {
            return {
              ...todo,
              isEditing: false,
            };
          }

          return {
            ...todo,
            text: trimmed,
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

  return (
    <main className="app">
      <section className="hero card">
        <p className="eyebrow">React To-do Studio</p>
        <h1>🧸 我的待办清单</h1>
        <p className="subtitle">React 版本，保留同样的清新风格和本地存储能力。</p>
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
          <button type="submit" className="primary-btn">
            ➕ 添加任务
          </button>
        </form>

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
              <button type="button" className="ghost-btn" onClick={clearCompleted}>
                清空已完成
              </button>
              <button type="button" className="danger-btn" onClick={clearAll}>
                全部清空
              </button>
            </div>
          </div>

          {todos.length === 0 ? (
            <p className="empty-state">清单还是空的，先加一条你想完成的小任务吧 ✨</p>
          ) : (
            <ul className="todo-list">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`todo-item priority-${todo.priority} ${
                    todo.completed ? "completed" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    aria-label="标记任务完成"
                  />
                  <div className="todo-main">
                    <span className={`priority-badge ${todo.priority}`}>
                      {getPriorityLabel(todo.priority)}
                    </span>
                    {todo.isEditing ? (
                      <input
                        className="edit-input"
                        value={todo.text}
                        onChange={(event) => changeEditText(todo.id, event.target.value)}
                        onBlur={() => finishEdit(todo.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            finishEdit(todo.id);
                          }
                          if (event.key === "Escape") {
                            cancelEdit(todo.id);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span className="todo-text">{todo.text}</span>
                    )}
                  </div>
                  <div className="item-actions">
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => startEdit(todo.id)}
                    >
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

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
