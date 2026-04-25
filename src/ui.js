import { getTasks } from './state.js';

const lists = { 'todo': document.getElementById('list-todo'), 'in-progress': document.getElementById('list-in-progress'), 'done': document.getElementById('list-done') };

export async function initialRender(query = '') {
  Object.values(lists).forEach(list => list.innerHTML = '');
  let tasks = await getTasks();
  
  if (query) {
    const q = query.toLowerCase();
    tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
  }

  tasks.forEach(task => appendTaskToDOM(task));
  updateAllCounters();
  ['todo', 'in-progress', 'done'].forEach(checkEmptyState);
}

export function appendTaskToDOM(task) {
  const taskEl = createTaskElement(task);
  taskEl.classList.add('task-enter');
  lists[task.status].appendChild(taskEl);
  updateCounter(task.status);
  checkEmptyState(task.status);
}

export function showToast(message, type = 'success', actionObj = null) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let html = `<span>${type === 'success' ? '✅' : '⚠️'}</span> <span style="flex:1">${message}</span>`;
  if (actionObj) html += `<button class="toast-action-btn">${actionObj.label}</button>`;
  toast.innerHTML = html;
  
  if (actionObj) {
    toast.querySelector('.toast-action-btn').addEventListener('click', async () => {
      await actionObj.onClick();
      toast.classList.remove('show');
    });
  }

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    if(toast.parentElement) {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }
  }, actionObj ? 6000 : 3000); 
}

export function setModalVisibility(isOpen) {
  const modal = document.getElementById('taskModal');
  const appContent = document.getElementById('app-content');
  if (isOpen) {
    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    appContent.setAttribute('aria-hidden', 'true');
    trapFocus(modal);
  } else {
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    appContent.removeAttribute('aria-hidden');
    document.getElementById('addTaskBtn').focus();
  }
}

export function setLoadingState(buttonId, isLoading) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  if (isLoading) {
    btn.classList.add('btn-loading');
    btn.setAttribute('disabled', 'true');
  } else {
    btn.classList.remove('btn-loading');
    btn.removeAttribute('disabled');
  }
}

function trapFocus(element) {
  const focusableEls = element.querySelectorAll('a[href], button, textarea, input, select');
  if(focusableEls.length === 0) return;
  const first = focusableEls[0];
  const last = focusableEls[focusableEls.length - 1];

  element.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) { if (document.activeElement === first) { last.focus(); e.preventDefault(); } } 
    else { if (document.activeElement === last) { first.focus(); e.preventDefault(); } }
  });
  setTimeout(() => first.focus(), 50);
}

function createTaskElement(task) {
  const div = document.createElement('div');
  div.className = `task-card priority-${task.priority}`;
  div.dataset.id = task.id;
  div.setAttribute('role', 'listitem');
  div.tabIndex = 0; 

  let dateClass = '';
  if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done') dateClass = 'overdue';

  const safeTitle = escapeHTML(task.title);
  div.innerHTML = `
    <div class="task-actions">
      <button class="edit-btn" aria-label="Edit Task ${safeTitle}" tabindex="-1">✏️</button>
      <button class="delete-btn" aria-label="Delete Task ${safeTitle}" tabindex="-1">🗑️</button>
    </div>
    <div class="task-title">${safeTitle}</div>
    <div class="task-desc">${escapeHTML(task.description) || '<i>No description</i>'}</div>
    <div class="task-meta">
      <span class="due-date ${dateClass}">${task.dueDate ? '📅 ' + task.dueDate : ''}</span>
      <span class="priority-label">${task.priority.toUpperCase()}</span>
    </div>
  `;
  return div;
}

function updateCounter(status) { document.getElementById(`${status}-count`).textContent = lists[status].children.length; }
function updateAllCounters() { ['todo', 'in-progress', 'done'].forEach(updateCounter); }
function checkEmptyState(status) {
  const list = lists[status];
  const existingEmpty = list.querySelector('.empty-state');
  if (list.children.length === 0 && !existingEmpty) list.innerHTML = `<div class="empty-state" aria-hidden="true">No tasks here yet.</div>`;
  else if (list.children.length > 0 && existingEmpty) existingEmpty.remove();
}
function escapeHTML(str) { return str ? str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])) : ''; }
