import { initDB } from './state.js';
import { initEvents } from './events.js';

function initApp() {
  const savedTheme = localStorage.getItem('kanbanTheme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  document.getElementById('themeToggle').addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('kanbanTheme', next);
  });

  initDB();
  initEvents();
}

document.addEventListener('DOMContentLoaded', initApp);
