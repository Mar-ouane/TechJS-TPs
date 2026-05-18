# TP: Book Reading Tracker

This repository contains the implementation of the Book Reading Tracker practical work (TP). This `ReadMe.md` file tracks the project progress, task breakdown, and folder structure.

---

## 📁 Folder Structure

```text
TP4-Book_Reading_Tracker/
├── index.html          # Main HTML entry point containing the registration form and reading dashboard (TailwindCSS)
├── books.json     # Sample mock dataset adhering to the Book schema for testing & seeding
├── TASK.md             # Original task specifications and requirements
├── ReadMe.md           # Project documentation, process tracking, and roadmap
└── .gitignore          # Git ignore configuration
```

*(Note: Additional files such as `book.js` for the Book module and backend/MongoDB connection scripts will be added as implementation progresses).*

---

## 📋 Task Breakdown & Roadmap

### Phase 1: Data Modeling & Mock Data (Current)
- [x] **Analyze Requirements:** Review `TASK.MD` to extract entity schema, enum constraints, and business logic.
- [x] **Create Fake Books Data:** Generate a comprehensive JSON dataset (`fake_books.json`) with diverse entries covering all `status` (`Read`, `Currently reading`, `DNF`, `Want to read`, `Re-read`, `Returned Unread`) and `format` (`Print`, `PDF`, `Ebook`, `AudioBook`) enums.
- [x] **Initialize Project Tracking:** Set up `ReadMe.md` with folder structure and progress tracking.

### Phase 2: Domain Logic & Book Module
- [ ] **Create Book Class Module (`book.js`):**
  - Implement as a standalone ES6 module.
  - Define the `constructor` handling `title`, `author`, `pages`, `status`, `price`, `pagesRead`, `format`, `suggestedBy`, and `finished`.
  - Implement automatic `finished` toggling logic (`finished = pagesRead === pages`).
  - Implement required methods: `currentlyAt(pageNumber)`, `deleteBook()`, `updateStatus(newStatus)`, `getInfo()`.

### Phase 3: Frontend UI & Dashboard
- [ ] **Book Registration Form (`index.html`):**
  - Build a clean, modern form using TailwindCSS to input all book attributes.
  - Add client-side validation (e.g., ensuring `pagesRead <= pages`).
- [ ] **Reading Tracking Dashboard:**
  - Create a dynamic list/grid displaying registered books.
  - Show visual progress bars/percentages (`(pagesRead / pages) * 100`) for each book.
- [ ] **Global Statistics Section:**
  - Display aggregate metrics: Total Books Read and Total Pages Read.

### Phase 4: Database & Backend Integration
- [ ] **MongoDB Setup:** Configure MongoDB database and collection for storing books.
- [ ] **Storage Integration:** Connect the frontend/Book module to MongoDB to persist new book registrations, updates, and deletions.

---

## 🏷️ Book Schema Definition

| Field | Type | Description / Constraints |
| :--- | :--- | :--- |
| `title` | String | Title of the book |
| `author` | String | Author of the book |
| `pages` | Number | Total number of pages |
| `status` | String Enum | `Read`, `Re-read`, `DNF`, `Currently reading`, `Returned Unread`, `Want to read` |
| `price` | Number | Cost of the book |
| `pagesRead`| Number | Pages completed (`pagesRead <= pages`) |
| `format` | String Enum | `Print`, `PDF`, `Ebook`, `AudioBook` |
| `suggestedBy`| String | Person or entity who recommended the book |
| `finished` | Boolean | Default `false` (`0`). Automatically becomes `true` (`1`) when `pagesRead == pages` |
