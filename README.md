# Enterprise Kanban Board

A production-ready, accessible, and heavily tested Kanban task management application. 

This project was built to demonstrate architectural best practices in Vanilla JavaScript, moving beyond basic DOM manipulation to implement robust state management and software design patterns.

## ✨ Key Features
- **Command Pattern (Undo/Redo System):** Full transactional history allowing users to Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`) task creations, deletions, and drag-and-drop movements.
- **Accessible (A11y):** Full keyboard navigation support, screen-reader friendly ARIA labels, focus trapping in modals, and body scroll locking.
- **Robust Drag & Drop:** Integrated with SortableJS for smooth animations, mobile touch support, and state synchronization.
- **Test-Driven:** Business logic isolated and covered by a `Vitest` unit testing suite mocking browser APIs.
- **Enterprise UI:** Debounced searching, empty states, CSS-variable theming (Dark/Light mode), and toast notification feedback loops.

## 🚀 Getting Started

1. **Clone the repo:**
   ```bash
   git clone [https://github.com/kiraa888/enterprise-kanban-board.git](https://github.com/kiraa888/enterprise-kanban-board.git)
