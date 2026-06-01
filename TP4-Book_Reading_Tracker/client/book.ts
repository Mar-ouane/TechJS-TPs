/**
 * book.ts – Book ES6 Class Module (TypeScript)
 * Communicates with the REST API for all persistence operations.
 */

import { IBook, IBookInfo, IBookUpdate, BookStatus, BookFormat } from './types.js';

const API_BASE = '/api/books';

export class Book implements IBook {
  _id:         string | undefined;
  title:       string;
  author:      string;
  pages:       number;
  pagesRead:   number;
  status:      BookStatus;
  price:       number;
  format:      BookFormat;
  suggestedBy: string;
  finished:    boolean;
  createdAt?:  string;
  updatedAt?:  string;

  constructor(data: IBook) {
    this._id         = data._id;
    this.title       = data.title;
    this.author      = data.author;
    this.pages       = Number(data.pages);
    this.pagesRead   = Number(data.pagesRead) || 0;
    this.status      = data.status || 'Want to read';
    this.price       = Number(data.price) || 0;
    this.format      = data.format;
    this.suggestedBy = data.suggestedBy || '';
    this.createdAt   = data.createdAt;
    this.updatedAt   = data.updatedAt;
    // Auto-compute finished
    this.finished    = this.pages > 0 && this.pagesRead >= this.pages;
  }

  // ─── Computed ───────────────────────────────────────────────────────────────

  /** Returns reading completion percentage (0–100) */
  readingPercentage(): number {
    if (this.pages === 0) return 0;
    return Math.min(100, Math.round((this.pagesRead / this.pages) * 1000) / 10);
  }

  /** Returns a plain-object representation */
  getInfo(): IBookInfo {
    return {
      _id:               this._id,
      title:             this.title,
      author:            this.author,
      pages:             this.pages,
      pagesRead:         this.pagesRead,
      status:            this.status,
      price:             this.price,
      format:            this.format,
      suggestedBy:       this.suggestedBy,
      finished:          this.finished,
      readingPercentage: this.readingPercentage(),
    };
  }

  // ─── Instance Methods ───────────────────────────────────────────────────────

  /** Updates the current reading position (0 ≤ pageNumber ≤ pages) */
  async currentlyAt(pageNumber: number): Promise<Book> {
    if (pageNumber < 0)          throw new Error('Page number cannot be negative');
    if (pageNumber > this.pages) throw new Error(`Page cannot exceed total pages (${this.pages})`);
    this.pagesRead = pageNumber;
    this.finished  = this.pagesRead >= this.pages;
    if (this.finished) this.status = 'Read';
    return this._syncToServer();
  }

  /** Changes the book status */
  async updateStatus(newStatus: BookStatus): Promise<Book> {
    if (!(Book.STATUSES as readonly string[]).includes(newStatus)) {
      throw new Error(`Invalid status: "${newStatus}"`);
    }
    this.status = newStatus;
    return this._syncToServer();
  }

  /** Generic partial update – merges fields and syncs */
  async update(fields: IBookUpdate): Promise<Book> {
    Object.assign(this, fields);
    this.finished = this.pages > 0 && this.pagesRead >= this.pages;
    return this._syncToServer();
  }

  /** Deletes this book from the database */
  async deleteBook(): Promise<boolean> {
    if (!this._id) throw new Error('Cannot delete a book without an ID');
    const res = await fetch(`${API_BASE}/${this._id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete book');
    return true;
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async _syncToServer(): Promise<Book> {
    if (!this._id) throw new Error('Cannot update a book without an ID');
    const res = await fetch(`${API_BASE}/${this._id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(this.getInfo()),
    });
    if (!res.ok) {
      const err = (await res.json()) as { error: string };
      throw new Error(err.error || 'Server update failed');
    }
    const updated = (await res.json()) as IBook;
    Object.assign(this, new Book(updated));
    return this;
  }

  // ─── Static Methods ─────────────────────────────────────────────────────────

  /** Fetches all books from the API */
  static async getAll(): Promise<Book[]> {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch books');
    return ((await res.json()) as IBook[]).map((b: IBook) => new Book(b));
  }

  /** Creates a new book via the API */
  static async create(data: Omit<IBook, '_id' | 'finished'>): Promise<Book> {
    const res = await fetch(API_BASE, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (!res.ok) {
      const err = (await res.json()) as { error: string };
      throw new Error(err.error || 'Failed to create book');
    }
    return new Book((await res.json()) as IBook);
  }

  // ─── Enum Constants ──────────────────────────────────────────────────────────

  static readonly STATUSES: readonly BookStatus[] = [
    'Read', 'Re-read', 'DNF', 'Currently reading', 'Returned Unread', 'Want to read',
  ] as const;

  static readonly FORMATS: readonly BookFormat[] = [
    'Print', 'PDF', 'Ebook', 'AudioBook',
  ] as const;
}
