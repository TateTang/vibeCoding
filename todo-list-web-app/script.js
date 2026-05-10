const STORAGE_KEY = "todo-list-web-app-items";

const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const priorityInput = document.getElementById("priorityInput");
const todoList = document.getElementById("todoList");
const emptyState = document.getElementById("emptyState");
const pendingCount = document.getElementById("pendingCount");
const completedCount = document.getElementById("completedCount");
const totalCount = document.getElementById("totalCount");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

let todos = loadTodos();

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
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function updateStats() {
  const completed = todos.filter((todo) => todo.completed).length;
  const pending = todos.length - completed;

  pendingCount.textContent = String(pending);
  completedCount.textContent = String(completed);
  totalCount.textContent = String(todos.length);
}

function toggleEmptyState() {
  emptyState.classList.toggle("hidden", todos.length > 0);
  todoList.classList.toggle("hidden", todos.length === 0);
}

function renderTodos() {
  todoList.innerHTML = todos
    .map(
      (todo) => `
        <li class="todo-item priority-${todo.priority} ${todo.completed ? "completed" : ""}" data-id="${todo.id}">
          <input type="checkbox" ${todo.completed ? "checked" : ""} aria-label="标记任务完成" />
          <div class="todo-main">
            <span class="priority-badge ${todo.priority}">${getPriorityLabel(todo.priority)}</span>
            <span class="todo-text">${escapeHtml(todo.text)}</span>
          </div>
          <div class="item-actions">
            <button class="edit-btn" type="button">编辑</button>
            <button class="delete-btn" type="button">删除</button>
          </div>
        </li>
      `
    )
    .join("");

  updateStats();
  toggleEmptyState();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function addTodo(text, priority) {
  todos.unshift({
    id: Date.now(),
    text,
    priority,
    completed: false,
  });
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  renderTodos();
}

function updateTodo(id, nextText) {
  todos = todos.map((todo) => (todo.id === id ? { ...todo, text: nextText } : todo));
  saveTodos();
  renderTodos();
}

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();
  const priority = priorityInput.value;

  if (!text) {
    todoInput.focus();
    return;
  }

  addTodo(text, priority);
  todoInput.value = "";
  priorityInput.value = "medium";
  todoInput.focus();
});

todoList.addEventListener("click", (event) => {
  const item = event.target.closest(".todo-item");
  if (!item) return;

  const id = Number(item.dataset.id);

  if (event.target.matches('input[type="checkbox"]')) {
    toggleTodo(id);
  }

  if (event.target.matches(".edit-btn")) {
    const todo = todos.find((entry) => entry.id === id);
    if (!todo) return;

    const nextText = window.prompt("编辑任务内容：", todo.text);
    if (nextText === null) {
      return;
    }

    const trimmedText = nextText.trim();
    if (!trimmedText) {
      return;
    }

    updateTodo(id, trimmedText);
  }

  if (event.target.matches(".delete-btn")) {
    deleteTodo(id);
  }
});

clearCompletedBtn.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  renderTodos();
});

clearAllBtn.addEventListener("click", () => {
  if (todos.length === 0) {
    return;
  }

  const shouldClear = window.confirm("确定要清空全部任务吗？此操作不可撤销。");
  if (!shouldClear) {
    return;
  }

  todos = [];
  saveTodos();
  renderTodos();
});

renderTodos();
