import { Book } from './book.js';

// ─── State ─────────────────────────────────────────────────────────────────────
let books = [];
let filterStatus = '';
let filterFormat = '';
let searchQuery  = '';

// ─── DOM Refs ──────────────────────────────────────────────────────────────────
const booksGrid     = document.getElementById('books-grid');
const emptyState    = document.getElementById('empty-state');
const statTotal     = document.getElementById('stat-total');
const statFinished  = document.getElementById('stat-finished');
const statReading   = document.getElementById('stat-reading');
const statPages     = document.getElementById('stat-pages');
const searchInput   = document.getElementById('search-input');
const filterStatusEl = document.getElementById('filter-status');
const filterFormatEl = document.getElementById('filter-format');
const openFormBtn   = document.getElementById('open-form-btn');
const modal         = document.getElementById('book-modal');
const modalClose    = document.getElementById('modal-close');
const bookForm      = document.getElementById('book-form');
const pagesInput    = document.getElementById('form-pages');
const pagesReadInput= document.getElementById('form-pagesRead');
const formError     = document.getElementById('form-error');
const formTitle     = document.getElementById('modal-title');

// ─── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  await loadBooks();
  attachEventListeners();
}

async function loadBooks() {
  try {
    books = await Book.getAll();
    renderAll();
  } catch (err) {
    showAlert('Could not connect to the server. Make sure it is running.', 'error');
    console.error(err);
  }
}

// ─── Render ────────────────────────────────────────────────────────────────────
function renderAll() {
  updateStats();
  renderBooks();
}

function updateStats() {
  statTotal.textContent    = books.length;
  statFinished.textContent = books.filter(b => b.finished).length;
  statReading.textContent  = books.filter(b => b.status === 'Currently reading').length;
  statPages.textContent    = books.reduce((sum, b) => sum + b.pagesRead, 0).toLocaleString();
}

function filteredBooks() {
  return books.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    const matchStatus = !filterStatus || b.status === filterStatus;
    const matchFormat = !filterFormat || b.format === filterFormat;
    return matchSearch && matchStatus && matchFormat;
  });
}

function renderBooks() {
  const list = filteredBooks();
  booksGrid.innerHTML = '';

  if (list.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');
  list.forEach(book => booksGrid.appendChild(createCard(book)));
}

function statusColor(status) {
  const map = {
    'Read':             'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'Re-read':          'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'DNF':              'bg-red-500/20 text-red-300 border-red-500/30',
    'Currently reading':'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    'Returned Unread':  'bg-slate-500/20 text-slate-300 border-slate-500/30',
    'Want to read':     'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };
  return map[status] || 'bg-slate-500/20 text-slate-300';
}

function formatIcon(format) {
  const map = { Print: '📖', PDF: '📄', Ebook: '📱', AudioBook: '🎧' };
  return map[format] || '📚';
}

function progressColor(pct) {
  if (pct >= 100) return 'from-emerald-500 to-green-400';
  if (pct >= 60)  return 'from-indigo-500 to-blue-400';
  if (pct >= 30)  return 'from-purple-500 to-indigo-400';
  return 'from-pink-500 to-purple-400';
}

function createCard(book) {
  const pct = book.readingPercentage();
  const card = document.createElement('div');
  card.className = 'book-card bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4 card-hover';
  card.dataset.id = book._id;

  card.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg">${formatIcon(book.format)}</span>
          <span class="text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor(book.status)}">${book.status}</span>
          ${book.finished ? '<span class="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✓ Finished</span>' : ''}
        </div>
        <h2 class="font-bold text-white text-base leading-tight truncate" title="${escHtml(book.title)}">${escHtml(book.title)}</h2>
        <p class="text-slate-400 text-sm mt-0.5 truncate">${escHtml(book.author)}</p>
      </div>
      <button class="delete-btn text-slate-600 hover:text-red-400 transition-colors p-1 shrink-0" title="Delete book">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>

    <!-- Progress Bar -->
    <div>
      <div class="flex justify-between items-center mb-1.5">
        <span class="text-xs text-slate-400">Progress</span>
        <span class="text-xs font-semibold text-white">${pct}%</span>
      </div>
      <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div class="h-full rounded-full bg-gradient-to-r ${progressColor(pct)} progress-bar" style="width: ${pct}%"></div>
      </div>
      <div class="flex justify-between mt-1">
        <span class="text-xs text-slate-500">${book.pagesRead.toLocaleString()} read</span>
        <span class="text-xs text-slate-500">${book.pages.toLocaleString()} pages</span>
      </div>
    </div>

    <!-- Meta -->
    <div class="flex flex-wrap gap-2 text-xs text-slate-400">
      <span class="flex items-center gap-1"><span>💰</span> $${Number(book.price).toFixed(2)}</span>
      ${book.suggestedBy ? `<span class="flex items-center gap-1"><span>👤</span> ${escHtml(book.suggestedBy)}</span>` : ''}
    </div>

    <!-- Actions -->
    <div class="flex gap-2 mt-auto pt-2 border-t border-slate-700">
      <button class="update-pages-btn flex-1 text-xs bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-600/30 rounded-lg py-2 font-medium transition-colors">
        Update Pages
      </button>
      <button class="change-status-btn flex-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 rounded-lg py-2 font-medium transition-colors">
        Change Status
      </button>
      <button class="edit-btn text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 rounded-lg py-2 px-3 font-medium transition-colors">
        Edit
      </button>
    </div>
  `;
  return card;
}

// ─── Event Listeners ───────────────────────────────────────────────────────────
function attachEventListeners() {
  // Open/close modal
  openFormBtn.addEventListener('click', () => openModal());
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  // Form submit
  bookForm.addEventListener('submit', handleFormSubmit);

  // Validate pagesRead <= pages in real-time
  [pagesInput, pagesReadInput].forEach(el => {
    el.addEventListener('input', () => {
      const p = parseInt(pagesInput.value) || 0;
      const r = parseInt(pagesReadInput.value) || 0;
      pagesReadInput.max = p;
      if (r > p) pagesReadInput.value = p;
    });
  });

  // Filters & search
  searchInput.addEventListener('input', e => { searchQuery = e.target.value; renderBooks(); });
  filterStatusEl.addEventListener('change', e => { filterStatus = e.target.value; renderBooks(); });
  filterFormatEl.addEventListener('change', e => { filterFormat = e.target.value; renderBooks(); });

  // Card action buttons (delegated)
  booksGrid.addEventListener('click', handleCardActions);
}

async function handleCardActions(e) {
  const card = e.target.closest('.book-card');
  if (!card) return;
  const id   = card.dataset.id;
  const book = books.find(b => b._id === id);
  if (!book) return;

  if (e.target.closest('.delete-btn')) {
    if (!confirm(`Delete "${book.title}"?`)) return;
    try {
      await book.deleteBook();
      books = books.filter(b => b._id !== id);
      renderAll();
      showAlert('Book deleted.', 'info');
    } catch (err) { showAlert(err.message, 'error'); }
  }

  if (e.target.closest('.update-pages-btn')) {
    const page = prompt(`Current page (0 – ${book.pages}):`, book.pagesRead);
    if (page === null) return;
    const num = parseInt(page, 10);
    if (isNaN(num)) return showAlert('Invalid page number.', 'error');
    try {
      await book.currentlyAt(num);
      renderAll();
      showAlert('Progress updated!', 'success');
    } catch (err) { showAlert(err.message, 'error'); }
  }

  if (e.target.closest('.change-status-btn')) {
    const opts = Book.STATUSES.map((s, i) => `${i + 1}. ${s}`).join('\n');
    const choice = prompt(`Choose new status:\n${opts}`, book.status);
    if (!choice) return;
    const newStatus = Book.STATUSES.find(s => s === choice) ||
                      Book.STATUSES[parseInt(choice, 10) - 1];
    if (!newStatus) return showAlert('Invalid status.', 'error');
    try {
      await book.updateStatus(newStatus);
      renderAll();
      showAlert('Status updated!', 'success');
    } catch (err) { showAlert(err.message, 'error'); }
  }

  if (e.target.closest('.edit-btn')) {
    openModal(book);
  }
}

// ─── Modal / Form ──────────────────────────────────────────────────────────────
let editingId = null;

function openModal(book = null) {
  editingId = book ? book._id : null;
  formTitle.textContent = book ? 'Edit Book' : 'Add New Book';
  formError.classList.add('hidden');
  bookForm.reset();

  if (book) {
    bookForm['form-title'].value      = book.title;
    bookForm['form-author'].value     = book.author;
    bookForm['form-pages'].value      = book.pages;
    bookForm['form-pagesRead'].value  = book.pagesRead;
    bookForm['form-status'].value     = book.status;
    bookForm['form-price'].value      = book.price;
    bookForm['form-format'].value     = book.format;
    bookForm['form-suggestedBy'].value= book.suggestedBy;
    pagesReadInput.max = book.pages;
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeModal() {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  editingId = null;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  formError.classList.add('hidden');

  const data = {
    title:      bookForm['form-title'].value.trim(),
    author:     bookForm['form-author'].value.trim(),
    pages:      parseInt(bookForm['form-pages'].value, 10),
    pagesRead:  parseInt(bookForm['form-pagesRead'].value, 10) || 0,
    status:     bookForm['form-status'].value,
    price:      parseFloat(bookForm['form-price'].value) || 0,
    format:     bookForm['form-format'].value,
    suggestedBy:bookForm['form-suggestedBy'].value.trim(),
  };

  if (data.pagesRead > data.pages) {
    return showFormError('Pages read cannot exceed total pages.');
  }

  try {
    if (editingId) {
      const book = books.find(b => b._id === editingId);
      await book.update(data);
    } else {
      const created = await Book.create(data);
      books.unshift(created);
    }
    if (!editingId) await loadBooks(); else renderAll();
    closeModal();
    showAlert(editingId ? 'Book updated!' : 'Book added!', 'success');
  } catch (err) {
    showFormError(err.message);
  }
}

// ─── Utilities ─────────────────────────────────────────────────────────────────
function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

function showFormError(msg) {
  formError.textContent = msg;
  formError.classList.remove('hidden');
}

function showAlert(msg, type = 'info') {
  const toast = document.createElement('div');
  const colors = {
    success: 'bg-emerald-600',
    error:   'bg-red-600',
    info:    'bg-slate-700',
  };
  toast.className = `fixed bottom-6 right-6 ${colors[type]} text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium z-50 transform translate-y-0 opacity-100 transition-all duration-300`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(16px)';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ─── Boot ──────────────────────────────────────────────────────────────────────
init();
