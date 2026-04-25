import { addTask, updateTask, deleteTask, getTaskById, moveTask, syncDomOrderToState, undoAction, redoAction } from './state.js';
import { initialRender, showToast, setLoadingState, setModalVisibility } from './ui.js';

const form = document.getElementById('taskForm');
const errorDiv = document.getElementById('formError');
const modal = document.getElementById('taskModal');
const searchInput = document.getElementById('searchInput');

export function initEvents() {
  initialRender();

  // Search Debounce
  let debounceTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => { initialRender(e.target.value); }, 300);
  });

  // Undo / Redo Shortcuts
  document.addEventListener('keydown', async (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        if (await redoAction()) { showToast('Redone', 'success'); initialRender(searchInput.value); }
      } else {
        if (await undoAction()) { showToast('Undone', 'success'); initialRender(searchInput.value); }
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      if (await redoAction()) { showToast('Redone', 'success'); initialRender(searchInput.value); }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      openModal();
    }
  });

  // SortableJS integration
  document.querySelectorAll('.task-list').forEach(list => {
    new Sortable(list, {
      group: 'kanban', animation: 150, ghostClass: 'sortable-ghost', delay: 10, delayOnTouchOnly: true,
      onEnd: async (evt) => {
        const taskId = evt.item.dataset.id;
        const fromCol = evt.from.closest('.column').dataset.status;
        const toCol = evt.to.closest('.column').dataset.status;
        
        if (fromCol !== toCol || evt.oldIndex !== evt.newIndex) {
          await moveTask(taskId, fromCol, toCol, evt.oldIndex, evt.newIndex);
          
          const taskIds = Array.from(evt.to.querySelectorAll('.task-card')).map(el => el.dataset.id);
          syncDomOrderToState(toCol, taskIds);
          
          if(fromCol !== toCol) {
            const oldTaskIds = Array.from(evt.from.querySelectorAll('.task-card')).map(el => el.dataset.id);
            syncDomOrderToState(fromCol, oldTaskIds);
          }
          
          initialRender(searchInput.value); // Re-sync UI counters/empty states
          showToast('Task moved', 'success', { label: 'Undo', onClick: async () => { await undoAction(); initialRender(searchInput.value); } });
        }
      }
    });
  });

  const board = document.getElementById('board');
  board.addEventListener('click', handleTaskAction);
  board.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') handleTaskAction({ target: e.target, keyAction: 'edit' });
    if(e.key === 'Delete' || e.key === 'Backspace') handleTaskAction({ target: e.target, keyAction: 'delete' });
  });

  async function handleTaskAction(e) {
    const card = e.target.closest('.task-card');
    if (!card) return;
    
    const isEditClick = e.target.closest('.edit-btn');
    const isDeleteClick = e.target.closest('.delete-btn');
    const taskId = card.dataset.id;

    if (isDeleteClick || e.keyAction === 'delete') {
      if (confirm('Delete this task?')) {
        await deleteTask(taskId);
        initialRender(searchInput.value); 
        showToast('Task deleted', 'success', { label: 'Undo', onClick: async () => { await undoAction(); initialRender(searchInput.value); } });
      }
    }
    if (isEditClick || e.keyAction === 'edit') openModal(taskId);
  }

  modal.addEventListener('mousedown', (e) => { if (e.target === modal) setModalVisibility(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) setModalVisibility(false); });
  document.getElementById('addTaskBtn').addEventListener('click', () => openModal());
  document.getElementById('cancelBtn').addEventListener('click', () => setModalVisibility(false));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';
    const titleInput = document.getElementById('title');
    titleInput.classList.remove('error');

    const title = titleInput.value.trim();
    if (!title) {
      errorDiv.textContent = 'Title is required.';
      titleInput.classList.add('error');
      titleInput.focus();
      return;
    }

    setLoadingState('saveBtn', true);
    const id = document.getElementById('taskId').value;
    const taskData = { title, description: document.getElementById('description').value.trim(), priority: document.getElementById('priority').value, dueDate: document.getElementById('dueDate').value };

    try {
      if (id) {
        await updateTask(id, taskData);
        showToast('Task updated', 'success', { label: 'Undo', onClick: async () => { await undoAction(); initialRender(searchInput.value); } });
      } else {
        taskData.status = 'todo';
        await addTask(taskData);
        showToast('Task created', 'success', { label: 'Undo', onClick: async () => { await undoAction(); initialRender(searchInput.value); } });
      }
      initialRender(searchInput.value);
      setModalVisibility(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingState('saveBtn', false);
    }
  });
}

function openModal(taskId = null) {
  form.reset();
  errorDiv.textContent = '';
  document.getElementById('title').classList.remove('error');

  if (taskId) {
    const task = getTaskById(taskId);
    if(!task) return;
    document.getElementById('taskId').value = task.id;
    document.getElementById('title').value = task.title;
    document.getElementById('description').value = task.description;
    document.getElementById('priority').value = task.priority;
    document.getElementById('dueDate').value = task.dueDate;
    document.getElementById('modalTitle').textContent = 'Edit Task';
  } else {
    document.getElementById('taskId').value = '';
    document.getElementById('modalTitle').textContent = 'Add New Task';
  }
  setModalVisibility(true);
}
