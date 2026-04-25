import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTasks, addTask, deleteTask, undoAction, redoAction, initDB } from '../src/state.js';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    clear: vi.fn(() => { store = {}; })
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Kanban State Management & History', () => {
  beforeEach(() => {
    localStorage.clear();
    initDB(); 
  });

  it('should add a task and persist to localStorage', async () => {
    const task = await addTask({ title: 'Test Task', status: 'todo' });
    const tasks = await getTasks();
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Test Task');
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should undo a task creation', async () => {
    await addTask({ title: 'Mistake Task', status: 'todo' });
    let tasks = await getTasks();
    expect(tasks.length).toBe(1);

    const undoSuccess = await undoAction();
    expect(undoSuccess).toBe(true);
    
    tasks = await getTasks();
    expect(tasks.length).toBe(0); 
  });

  it('should redo a reverted task creation', async () => {
    await addTask({ title: 'Mistake Task', status: 'todo' });
    await undoAction(); 
    
    const redoSuccess = await redoAction();
    expect(redoSuccess).toBe(true);
    
    const tasks = await getTasks();
    expect(tasks.length).toBe(1);
  });

  it('should undo a task deletion', async () => {
    const task = await addTask({ title: 'Important Task', status: 'done' });
    await deleteTask(task.id);
    
    let tasks = await getTasks();
    expect(tasks.length).toBe(0); 

    await undoAction();
    
    tasks = await getTasks();
    expect(tasks.length).toBe(1);
    expect(tasks[0].id).toBe(task.id); 
  });
});
