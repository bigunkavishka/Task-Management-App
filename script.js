
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const emptyMessage = document.getElementById("emptyMessage");
const submitBtn = document.getElementById("submitBtn");
const cancelEdit = document.getElementById("cancelEdit");

const STORAGE_KEY = "taskflow-tasks";

let tasks = [];
let currentFilter = "all";
let editingId = null;

// Load saved tasks safely
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (Array.isArray(saved)) {
    tasks = saved.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.completed === "boolean"
    );
  }
} catch {
  tasks = [];
}

// Save tasks
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    alert("Could not save tasks. Check browser storage.");
  }
}

// Date
document.getElementById("today").textContent =
  new Date().toLocaleDateString("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

// Add or update task
taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = taskInput.value.trim();
  if (!title) return;

  if (editingId) {
    const task = tasks.find(t => t.id === editingId);
    if (task) task.title = title;
  } else {
    tasks.unshift({
      id: crypto.randomUUID(),
      title,
      completed: false
    });
  }

  saveTasks();
  resetForm();
  renderTasks();
});

function resetForm() {
  editingId = null;
  taskInput.value = "";
  submitBtn.textContent = "+ Add Task";
  document.getElementById("formTitle").textContent = "Add a new task";
  cancelEdit.hidden = true;
}

// Cancel edit
cancelEdit.addEventListener("click", resetForm);

// Edit task
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  editingId = id;
  taskInput.value = task.title;
  submitBtn.textContent = "Save Changes";
  document.getElementById("formTitle").textContent = "Edit task";
  cancelEdit.hidden = false;
  taskInput.focus();
}

// Toggle completion
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

// Delete task
function deleteTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const confirmed = confirm(`Delete "${task.title}"?`);
  if (!confirmed) return;

  tasks = tasks.filter(t => t.id !== id);

  if (editingId === id) resetForm();

  saveTasks();
  renderTasks();
}

// Filters
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    document.querySelectorAll(".filter").forEach(btn => {
      const selected = btn === button;
      btn.classList.toggle("active", selected);
      btn.setAttribute("aria-pressed", String(selected));
    });

    renderTasks();
  });
});

// Search
searchInput.addEventListener("input", renderTasks);

// Create task element safely
function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item";
  if (task.completed) li.classList.add("done");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", "Complete " + task.title);
  checkbox.addEventListener("change", () => toggleTask(task.id));

  const name = document.createElement("span");
  name.className = "task-name";
  name.textContent = task.title;

  const actions = document.createElement("div");
  actions.className = "actions";

  const editBtn = document.createElement("button");
  editBtn.className = "action-btn";
  editBtn.textContent = "Edit";
  editBtn.setAttribute("aria-label", "Edit " + task.title);
  editBtn.addEventListener("click", () => editTask(task.id));

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "action-btn delete";
  deleteBtn.textContent = "Delete";
  deleteBtn.setAttribute("aria-label", "Delete " + task.title);
  deleteBtn.addEventListener("click", () => deleteTask(task.id));

  actions.append(editBtn, deleteBtn);
  li.append(checkbox, name, actions);

  return li;
}

// Render UI
function renderTasks() {
  const query = searchInput.value.trim().toLowerCase();

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(query);

    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "active" && !task.completed) ||
      (currentFilter === "completed" && task.completed);

    return matchesSearch && matchesFilter;
  });

  taskList.replaceChildren();

  filteredTasks.forEach(task => {
    taskList.appendChild(createTaskElement(task));
  });

  emptyMessage.hidden = filteredTasks.length !== 0;

  document.getElementById("totalCount").textContent = tasks.length;
  document.getElementById("activeCount").textContent =
    tasks.filter(t => !t.completed).length;
  document.getElementById("completedCount").textContent =
    tasks.filter(t => t.completed).length;

  document.getElementById("taskSummary").textContent =
    `${filteredTasks.length} shown`;
}

// Initial render
renderTasks();
