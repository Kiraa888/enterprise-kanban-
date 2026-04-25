let tasks = [];
let undoStack = [];
let redoStack = [];

function recordAction(undoFn, redoFn) {
  undoStack.push({ undo: undoFn, redo: redoFn });
  redoStack = []; 
  if (undoStack.length > 50) undoStack.shift(); 
}

export async function undoAction() {
  if (undoStack.length === 0) return false;
  const action = undoStack.pop();
  await action.undo();
  redoStack.push(action);
  saveState();
  return true;
}

export async function redoAction() {
  if (redoStack.length === 0) return false;
  const action = redoStack.pop();
  await action.redo();
  undoStack.push(action);
  saveState();
  return true;
}

export function initDB() {
  try {
    const rawData = localStorage.getItem('proKanbanTasks');
    if (rawData) tasks = JSON.parse(rawData).filter(t => t.id && t.title);
  } catch (e) {
    tasks = [];
  }
}

export async function getTasks() { return [...tasks].sort((a, b) => a.order - b.order); }
export function getTaskById(id) { return tasks.find(t => t.id === id); }

export async function addTask(taskData) {
  const newTask = { ...taskData, id: crypto.randomUUID(), createdAt: new Date().toISOString(), order: tasks.filter(t => t.status === taskData.status).length };
  
  const redoFn = () => { tasks.push(newTask); reindexColumn(newTask.status); };
  const undoFn = () => { tasks = tasks.filter(t => t.id !== newTask.id); reindexColumn(newTask.status); };
  
  redoFn(); 
  recordAction(undoFn, redoFn);
  saveState();
  return newTask;
}

export async function deleteTask(id) {
  const taskToDel = getTaskById(id);
  if (!taskToDel) return;

  const redoFn = () => { tasks = tasks.filter(t => t.id !== id); reindexColumn(taskToDel.status); };
  const undoFn = () => { tasks.push(taskToDel); reindexColumn(taskToDel.status); };
  
  redoFn();
  recordAction(undoFn, redoFn);
  saveState();
}

export async function updateTask(id, updates) {
  const originalTask = { ...getTaskById(id) };
  
  const redoFn = () => { const idx = tasks.findIndex(t => t.id === id); tasks[idx] = { ...tasks[idx], ...updates }; };
  const undoFn = () => { const idx = tasks.findIndex(t => t.id === id); tasks[idx] = { ...originalTask }; };
  
  redoFn();
  recordAction(undoFn, redoFn);
  saveState();
  return getTaskById(id);
}

export async function moveTask(taskId, fromCol, toCol, fromIndex, toIndex) {
  const sourceSnapshot = tasks.filter(t => t.status === fromCol).map(t => ({...t}));
  const destSnapshot = fromCol === toCol ? null : tasks.filter(t => t.status === toCol).map(t => ({...t}));

  const redoFn = () => {
    const task = tasks.find(t => t.id === taskId);
    task.status = toCol;
    const columnTasks = tasks.filter(t => t.status === toCol).sort((a, b) => a.order - b.order);
    columnTasks.splice(fromIndex, 1); 
    reindexColumn(fromCol);
    reindexColumn(toCol);
  };

  const undoFn = () => {
    tasks = tasks.filter(t => t.status !== fromCol && t.status !== toCol);
    tasks.push(...sourceSnapshot);
    if (destSnapshot) tasks.push(...destSnapshot);
  };

  recordAction(undoFn, redoFn);
  saveState();
}

export function syncDomOrderToState(columnStatus, taskIds) {
  taskIds.forEach((id, index) => {
    const task = tasks.find(t => t.id === id);
    if (task) { task.status = columnStatus; task.order = index; }
  });
  saveState();
}

function reindexColumn(status) {
  const colTasks = tasks.filter(t => t.status === status).sort((a, b) => a.order - b.order);
  colTasks.forEach((t, i) => t.order = i);
}

function saveState() {
  localStorage.setItem('proKanbanTasks', JSON.stringify(tasks));
}
