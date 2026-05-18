/**
 * book.js – Book ES6 Class Module
 * Communicates with the REST API for all persistence operations.
 */

const API_BASE = '/api/books';

export class Book {
  /**
   * @param {Object} data – Raw book data from the API or a form
   */
  constructor(data) {
    this._id        = data._id        || null;
    this.title      = data.title;
    this.author     = data.author;
    this.pages      = Number(data.pages);
    this.pagesRead  = Number(data.pagesRead) || 0;
    this.status     = data.status     || 'Want to read';
    this.price      = Number(data.price)     || 0;
    this.format     = data.format;
    this.suggestedBy = data.suggestedBy || '';
    this.createdAt  = data.createdAt  || null;
    this.updatedAt  = data.updatedAt  || null;
    // Auto-compute finished
    this.finished   = this.pages > 0 && this.pagesRead >= this.pages;
  }

  // ─── Computed Properties ───────────────────────────────────────────────────

  /** Returns the reading completion percentage (0–100) */
  readingPercentage() {
    if (this.pages === 0) return 0;
    return Math.min(100, Math.round((this.pagesRead / this.pages) * 1000) / 10);
  }

  /** Returns a plain-object representation of the book */
  getInfo() {
    return {
      _id:             this._id,
      title:           this.title,
      author:          this.author,
      pages:           this.pages,
      pagesRead:       this.pagesRead,
      status:          this.status,
      price:           this.price,
      format:          this.format,
      suggestedBy:     this.suggestedBy,
      finished:        this.finished,
      readingPercentage: this.readingPercentage(),
    };
  }

  // ─── Instance Methods ──────────────────────────────────────────────────────

  /**
   * Updates the current reading position.
   * @param {number} pageNumber – Must be 0 ≤ pageNumber ≤ pages
   * @returns {Promise<Book>}
   */
  async currentlyAt(pageNumber) {
    if (pageNumber < 0)            throw new Error('Page number cannot be negative');
    if (pageNumber > this.pages)   throw new Error(`Page cannot exceed total pages (${this.pages})`);
    this.pagesRead = pageNumber;
    this.finished  = this.pagesRead >= this.pages;
    if (this.finished) this.status = 'Read';
    return this._syncToServer();
  }

  /**
   * Changes the book status.
   * @param {string} newStatus – Must be one of Book.STATUSES
   * @returns {Promise<Book>}
   */
  async updateStatus(newStatus) {
    if (!Book.STATUSES.includes(newStatus))
      throw new Error(`Invalid status: "${newStatus}"`);
    this.status = newStatus;
    return this._syncToServer();
  }

  /**
   * Generic field update – merges fields and syncs.
   * @param {Object} fields
   * @returns {Promise<Book>}
   */
  async update(fields) {
    Object.assign(this, fields);
    this.finished = this.pages > 0 && this.pagesRead >= this.pages;
    return this._syncToServer();
  }

  /**
   * Deletes this book from the database.
   * @returns {Promise<boolean>}
   */
  async deleteBook() {
    if (!this._id) throw new Error('Cannot delete a book without an ID');
    const res = await fetch(`${API_BASE}/${this._id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete book');
    return true;
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  async _syncToServer() {
    if (!this._id) throw new Error('Cannot update a book without an ID');
    const res = await fetch(`${API_BASE}/${this._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.getInfo()),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Server update failed');
    }
    const updated = await res.json();
    Object.assign(this, new Book(updated));
    return this;
  }

  // ─── Static Methods ────────────────────────────────────────────────────────

  /** Fetches all books from the API. @returns {Promise<Book[]>} */
  static async getAll() {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch books');
    return (await res.json()).map(b => new Book(b));
  }

  /** Creates a new book via the API. @returns {Promise<Book>} */
  static async create(data) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create book');
    }
    return new Book(await res.json());
  }

  // ─── Enum Constants ────────────────────────────────────────────────────────

  static get STATUSES() {
    return ['Read', 'Re-read', 'DNF', 'Currently reading', 'Returned Unread', 'Want to read'];
  }

  static get FORMATS() {
    return ['Print', 'PDF', 'Ebook', 'AudioBook'];
  }
}
