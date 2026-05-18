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
    'Read':             'bg-[#A8E6CF]/25 text-[#1A2B3C] border-[#A8E6CF]',
    'Re-read':          'bg-[#A8E6CF]/15 text-[#2D4A6B] border-[#A8E6CF]/60',
    'DNF':              'bg-[#E17055]/15 text-[#C45E45] border-[#E17055]/50',
    'Currently reading':'bg-[#1A2B3C]/10 text-[#1A2B3C] border-[#1A2B3C]/25',
    'Returned Unread':  'bg-[#E8E3DC] text-[#1A2B3C]/60 border-[#E8E3DC]',
    'Want to read':     'bg-[#D4A853]/15 text-[#8B6914] border-[#D4A853]/50',
  };
  return map[status] || 'bg-[#E8E3DC] text-[#1A2B3C]/60 border-[#E8E3DC]';
}

function formatIcon(format) {
  const map = { Print: '📖', PDF: '📄', Ebook: '📱', AudioBook: '🎧' };
  return map[format] || '📚';
}

function progressColor(pct) {
  if (pct >= 100) return 'from-[#A8E6CF] to-[#5DADA1]';
  if (pct >= 60)  return 'from-[#E17055] to-[#F5A08B]';
  if (pct >= 30)  return 'from-[#E17055] to-[#D4A853]';
  return 'from-[#1A2B3C] to-[#2D4A6B]';
}

function createCard(book) {
  const pct = book.readingPercentage();
  const card = document.createElement('div');
  card.className = 'book-card bg-white border border-[#E8E3DC] rounded-2xl p-5 flex flex-col gap-4 card-hover shadow-sm';
  card.dataset.id = book._id;

  card.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-1.5 mb-2">
          <span class="text-base">${formatIcon(book.format)}</span>
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusColor(book.status)}">${book.status}</span>
          ${book.finished ? '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#A8E6CF]/25 text-[#2D6B5A] border border-[#A8E6CF]">✓ Finished</span>' : ''}
        </div>
        <h2 class="font-display font-bold text-[#1A2B3C] text-base leading-snug" title="${escHtml(book.title)}">${escHtml(book.title)}</h2>
        <p class="text-[#1A2B3C]/50 text-sm mt-0.5 font-medium">${escHtml(book.author)}</p>
      </div>
      <button class="delete-btn text-[#1A2B3C]/20 hover:text-[#E17055] transition-colors p-1.5 shrink-0 rounded-lg hover:bg-[#E17055]/10" title="Delete book">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>

    <!-- Progress Bar -->
    <div>
      <div class="flex justify-between items-center mb-1.5">
        <span class="text-xs font-semibold text-[#1A2B3C]/40 uppercase tracking-wider">Progress</span>
        <span class="text-xs font-bold text-[#1A2B3C]">${pct}%</span>
      </div>
      <div class="h-2 bg-[#F5F3F0] rounded-full overflow-hidden border border-[#E8E3DC]">
        <div class="h-full rounded-full bg-gradient-to-r ${progressColor(pct)} progress-bar" style="width: ${pct}%"></div>
      </div>
      <div class="flex justify-between mt-1.5">
        <span class="text-xs text-[#1A2B3C]/40">${book.pagesRead.toLocaleString()} read</span>
        <span class="text-xs text-[#1A2B3C]/40">${book.pages.toLocaleString()} total</span>
      </div>
    </div>

    <!-- Meta -->
    <div class="flex flex-wrap gap-3 text-xs text-[#1A2B3C]/50">
      <span class="flex items-center gap-1 font-medium">💰 $${Number(book.price).toFixed(2)}</span>
      ${book.suggestedBy ? `<span class="flex items-center gap-1 font-medium">👤 ${escHtml(book.suggestedBy)}</span>` : ''}
    </div>

    <!-- Actions -->
    <div class="flex gap-2 mt-auto pt-3 border-t border-[#E8E3DC]">
      <button class="update-pages-btn flex-1 text-xs bg-[#1A2B3C] hover:bg-[#2D4A6B] text-white rounded-lg py-2 font-semibold transition-colors">
        Update Pages
      </button>
      <button class="change-status-btn flex-1 text-xs bg-[#F5F3F0] hover:bg-[#E8E3DC] text-[#1A2B3C] border border-[#E8E3DC] rounded-lg py-2 font-semibold transition-colors">
        Status
      </button>
      <button class="edit-btn text-xs bg-[#E17055]/10 hover:bg-[#E17055]/20 text-[#C45E45] border border-[#E17055]/30 rounded-lg py-2 px-3 font-semibold transition-colors">
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
  const styles = {
    success: 'background:#1A2B3C; color:#A8E6CF; border:1px solid #A8E6CF55',
    error:   'background:#E17055; color:#fff; border:1px solid #C45E45',
    info:    'background:#FDFCFB; color:#1A2B3C; border:1px solid #E8E3DC',
  };
  toast.style.cssText = `position:fixed;bottom:24px;right:24px;${styles[type]};padding:12px 20px;border-radius:14px;box-shadow:0 8px 32px rgba(26,43,60,0.18);font-size:13px;font-weight:600;z-index:9999;font-family:Inter,sans-serif;transition:all 0.3s ease;`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ─── Boot ──────────────────────────────────────────────────────────────────────
init();
