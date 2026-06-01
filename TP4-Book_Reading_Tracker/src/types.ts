/**
 * types.ts – Shared type definitions for Book Reading Tracker.
 */

export type BookStatus =
  | 'Read'
  | 'Re-read'
  | 'DNF'
  | 'Currently reading'
  | 'Returned Unread'
  | 'Want to read';

export type BookFormat = 'Print' | 'PDF' | 'Ebook' | 'AudioBook';

export interface IBook {
  _id?:        string;
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
}

export interface IBookInfo extends IBook {
  readingPercentage: number;
}

export type IBookUpdate = Partial<
  Pick<IBook, 'title' | 'author' | 'pages' | 'pagesRead' | 'status' | 'price' | 'format' | 'suggestedBy'>
>;

export interface IApiError {
  error: string;
}
