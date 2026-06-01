/**
 * app.ts – Frontend application logic (TypeScript)
 * Fetches books from the API, renders the dashboard, handles form & interactions.
 */

import { Book } from './book.js';
import type { BookStatus, BookFormat, IBookUpdate } from './types.js';

// ─── State ─────────────────────────────────────────────────────────────────────
let books: Book[]   = [];
let filterStatus    = '';
let filterFormat    = '';
let searchQuery     = '';
let editingId: string | null = null;

// ─── DOM Helpers ───────────────────────────────────────────────────────────────
function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

// ─── DOM Refs ──────────────────────────────────────────────────────────────────
const booksGrid      = $('books-grid') as HTMLDivElement;
const emptyState     = $('empty-state') as HTMLDivElement;
const statTotal      = $('stat-total');
const statFinished   = $('stat-finished');
const statReading    = $('stat-reading');
const statPages      = $('stat-pages');
const searchInput    = $('search-input') as HTMLInputElement;
const filterStatusEl = $('filter-status') as HTMLSelectElement;
const filterFormatEl = $('filter-format') as HTMLSelectElement;
const openFormBtn    = $('open-form-btn') as HTMLButtonElement;
const modal          = $('book-modal') as HTMLDivElement;
const modalClose     = $('modal-close') as HTMLButtonElement;
const bookForm       = $('book-form') as HTMLFormElement;
const pagesInput     = $('form-pages') as HTMLInputElement;
const pagesReadInput = $('form-pagesRead') as HTMLInputElement;
const formError      = $('form-error') as HTMLDivElement;
const formTitle      = $('modal-title') as HTMLHeadingElement;

// ─── Init ──────────────────────────────────────────────────────────────────────
async function init(): Promise<void> {
  await loadBooks();
  attachEventListeners();
}

async function loadBooks(): Promise<void> {
  try {
    books = await Book.getAll();
    renderAll();
  } catch (err: unknown) {
    showAlert('Could not connect to the server. Make sure it is running.', 'error');
    console.error(err);
  }
}

// ─── Render ────────────────────────────────────────────────────────────────────
function renderAll(): void {
  updateStats();
  renderBooks();
}

function updateStats(): void {
  statTotal.textContent    = String(books.length);
  statFinished.textContent = String(books.filter(b => b.finished).length);
  statReading.textContent  = String(books.filter(b => b.status === 'Currently reading').length);
  statPages.textContent    = books.reduce((sum, b) => sum + b.pagesRead, 0).toLocaleString();
}

function filteredBooks(): Book[] {
  return books.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    const matchStatus = !filterStatus || b.status === filterStatus;
    const matchFormat = !filterFormat || b.format === filterFormat;
    return matchSearch && matchStatus && matchFormat;
  });
}

function renderBooks(): void {
  const list = filteredBooks();
  booksGrid.innerHTML = '';

  if (list.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');
  list.forEach(book => booksGrid.appendChild(createCard(book)));
}

// ─── Card Styling ──────────────────────────────────────────────────────────────

function statusColor(status: BookStatus): string {
  const map: Record<BookStatus, string> = {
    'Read':             'bg-[#A8E6CF]/25 text-[#1A2B3C] border-[#A8E6CF]',
    'Re-read':          'bg-[#A8E6CF]/15 text-[#2D4A6B] border-[#A8E6CF]/60',
    'DNF':              'bg-[#E17055]/15 text-[#C45E45] border-[#E17055]/50',
    'Currently reading':'bg-[#1A2B3C]/10 text-[#1A2B3C] border-[#1A2B3C]/25',
    'Returned Unread':  'bg-[#E8E3DC] text-[#1A2B3C]/60 border-[#E8E3DC]',
    'Want to read':     'bg-[#D4A853]/15 text-[#8B6914] border-[#D4A853]/50',
  };
  return map[status] || 'bg-[#E8E3DC] text-[#1A2B3C]/60 border-[#E8E3DC]';
}

function formatIcon(format: BookFormat): string {
  const map: Record<BookFormat, string> = { Print: '📖', PDF: '📄', Ebook: '📱', AudioBook: '🎧' };
  return map[format] || '📚';
}

function progressColor(pct: number): string {
  if (pct >= 100) return 'from-[#A8E6CF] to-[#5DADA1]';
  if (pct >= 60)  return 'from-[#E17055] to-[#F5A08B]';
  if (pct >= 30)  return 'from-[#E17055] to-[#D4A853]';
  return 'from-[#1A2B3C] to-[#2D4A6B]';
}

// ─── Card Builder ──────────────────────────────────────────────────────────────

function createCard(book: Book): HTMLDivElement {
  const pct = book.readingPercentage();
  const card = document.createElement('div');
  card.className = 'book-card bg-white border border-[#E8E3DC] rounded-2xl p-5 flex flex-col gap-4 card-hover shadow-sm';
  card.dataset.id = book._id!;

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
function attachEventListeners(): void {
  // Open/close modal
  openFormBtn.addEventListener('click', () => openModal());
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e: MouseEvent) => { if (e.target === modal) closeModal(); });

  // Form submit
  bookForm.addEventListener('submit', handleFormSubmit);

  // Validate pagesRead <= pages in real-time
  [pagesInput, pagesReadInput].forEach(el => {
    el.addEventListener('input', () => {
      const p = parseInt(pagesInput.value) || 0;
      const r = parseInt(pagesReadInput.value) || 0;
      pagesReadInput.max = String(p);
      if (r > p) pagesReadInput.value = String(p);
    });
  });

  // Filters & search
  searchInput.addEventListener('input', (e: Event) => { searchQuery = (e.target as HTMLInputElement).value; renderBooks(); });
  filterStatusEl.addEventListener('change', (e: Event) => { filterStatus = (e.target as HTMLSelectElement).value; renderBooks(); });
  filterFormatEl.addEventListener('change', (e: Event) => { filterFormat = (e.target as HTMLSelectElement).value; renderBooks(); });

  // Card action buttons (delegated)
  booksGrid.addEventListener('click', handleCardActions);
}

async function handleCardActions(e: MouseEvent): Promise<void> {
  const target = e.target as HTMLElement;
  const card = target.closest('.book-card') as HTMLElement | null;
  if (!card) return;
  const id   = card.dataset.id!;
  const book = books.find(b => b._id === id);
  if (!book) return;

  if (target.closest('.delete-btn')) {
    if (!confirm(`Delete "${book.title}"?`)) return;
    try {
      await book.deleteBook();
      books = books.filter(b => b._id !== id);
      renderAll();
      showAlert('Book deleted.', 'info');
    } catch (err: unknown) { showAlert((err as Error).message, 'error'); }
  }

  if (target.closest('.update-pages-btn')) {
    const page = prompt(`Current page (0 – ${book.pages}):`, String(book.pagesRead));
    if (page === null) return;
    const num = parseInt(page, 10);
    if (isNaN(num)) return showAlert('Invalid page number.', 'error');
    try {
      await book.currentlyAt(num);
      renderAll();
      showAlert('Progress updated!', 'success');
    } catch (err: unknown) { showAlert((err as Error).message, 'error'); }
  }

  if (target.closest('.change-status-btn')) {
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
    } catch (err: unknown) { showAlert((err as Error).message, 'error'); }
  }

  if (target.closest('.edit-btn')) {
    openModal(book);
  }
}

// ─── Modal / Form ──────────────────────────────────────────────────────────────

function openModal(book: Book | null = null): void {
  editingId = book ? book._id! : null;
  formTitle.textContent = book ? 'Edit Book' : 'Add New Book';
  formError.classList.add('hidden');
  bookForm.reset();

  if (book) {
    (bookForm.elements.namedItem('form-title') as HTMLInputElement).value      = book.title;
    (bookForm.elements.namedItem('form-author') as HTMLInputElement).value     = book.author;
    (bookForm.elements.namedItem('form-pages') as HTMLInputElement).value      = String(book.pages);
    (bookForm.elements.namedItem('form-pagesRead') as HTMLInputElement).value  = String(book.pagesRead);
    (bookForm.elements.namedItem('form-status') as HTMLSelectElement).value    = book.status;
    (bookForm.elements.namedItem('form-price') as HTMLInputElement).value      = String(book.price);
    (bookForm.elements.namedItem('form-format') as HTMLSelectElement).value    = book.format;
    (bookForm.elements.namedItem('form-suggestedBy') as HTMLInputElement).value= book.suggestedBy;
    pagesReadInput.max = String(book.pages);
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeModal(): void {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  editingId = null;
}

async function handleFormSubmit(e: Event): Promise<void> {
  e.preventDefault();
  formError.classList.add('hidden');

  const get = (name: string): string => (bookForm.elements.namedItem(name) as HTMLInputElement).value;

  const data: IBookUpdate & { title: string; author: string; pages: number; pagesRead: number; status: BookStatus; format: BookFormat; suggestedBy: string } = {
    title:       get('form-title').trim(),
    author:      get('form-author').trim(),
    pages:       parseInt(get('form-pages'), 10),
    pagesRead:   parseInt(get('form-pagesRead'), 10) || 0,
    status:      get('form-status') as BookStatus,
    price:       parseFloat(get('form-price')) || 0,
    format:      get('form-format') as BookFormat,
    suggestedBy: get('form-suggestedBy').trim(),
  };

  if (data.pagesRead > data.pages) {
    return showFormError('Pages read cannot exceed total pages.');
  }

  try {
    if (editingId) {
      const book = books.find(b => b._id === editingId);
      if (book) await book.update(data);
    } else {
      const created = await Book.create(data as any);
      books.unshift(created);
    }
    if (!editingId) await loadBooks(); else renderAll();
    closeModal();
    showAlert(editingId ? 'Book updated!' : 'Book added!', 'success');
  } catch (err: unknown) {
    showFormError((err as Error).message);
  }
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

function showFormError(msg: string): void {
  formError.textContent = msg;
  formError.classList.remove('hidden');
}

type AlertType = 'success' | 'error' | 'info';

function showAlert(msg: string, type: AlertType = 'info'): void {
  const toast = document.createElement('div');
  const styles: Record<AlertType, string> = {
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
