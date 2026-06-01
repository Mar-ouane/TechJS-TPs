import express, { Request, Response } from 'express';
import mongoose, { Document, Schema, Model } from 'mongoose';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { IBook, BookStatus, BookFormat } from './types';

dotenv.config();

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// ─── MongoDB ──────────────────────────────────────────────────────────────────
const MONGO_URI: string = process.env.MONGO_URI ?? 'mongodb://localhost:27017/book_tracker';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB:', MONGO_URI))
  .catch((err: Error) => console.error('❌ MongoDB connection error:', err));

// ─── Mongoose Types & Schema ──────────────────────────────────────────────────
interface IBookDocument extends Omit<IBook, '_id'>, Document {}

const VALID_STATUSES: BookStatus[] = [
  'Read', 'Re-read', 'DNF', 'Currently reading', 'Returned Unread', 'Want to read',
];
const VALID_FORMATS: BookFormat[] = ['Print', 'PDF', 'Ebook', 'AudioBook'];

const bookSchema = new Schema<IBookDocument>(
  {
    title:       { type: String, required: true, trim: true },
    author:      { type: String, required: true, trim: true },
    pages:       { type: Number, required: true, min: 1 },
    pagesRead:   { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: VALID_STATUSES,
      default: 'Want to read' as BookStatus,
      required: true,
    },
    price:       { type: Number, default: 0, min: 0 },
    format: {
      type: String,
      enum: VALID_FORMATS,
      required: true,
    },
    suggestedBy: { type: String, default: '', trim: true },
    finished:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Pre-save hook: clamp pagesRead & auto-compute finished
bookSchema.pre('save', function (this: IBookDocument, next) {
  if (this.pagesRead > this.pages) this.pagesRead = this.pages;
  this.finished = this.pages > 0 && this.pagesRead >= this.pages;
  next();
});

const BookModel: Model<IBookDocument> = mongoose.model<IBookDocument>('Book', bookSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ALLOWED_FIELDS: Array<keyof IBook> = [
  'title', 'author', 'pages', 'pagesRead', 'status', 'price', 'format', 'suggestedBy',
];

// ─── API Routes ───────────────────────────────────────────────────────────────

// GET all books
app.get('/api/books', async (_req: Request, res: Response): Promise<void> => {
  try {
    const books = await BookModel.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET single book
app.get('/api/books/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const book = await BookModel.findById(req.params.id);
    if (!book) { res.status(404).json({ error: 'Book not found' }); return; }
    res.json(book);
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST – create book
app.post('/api/books', async (req: Request, res: Response): Promise<void> => {
  try {
    const book = new BookModel(req.body as Partial<IBook>);
    await book.save();
    res.status(201).json(book);
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// PUT – update book
app.put('/api/books/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const book = await BookModel.findById(req.params.id);
    if (!book) { res.status(404).json({ error: 'Book not found' }); return; }

    ALLOWED_FIELDS.forEach((field) => {
      const value = (req.body as Record<string, unknown>)[field];
      if (value !== undefined) {
        (book as any)[field] = value;
      }
    });

    await book.save();
    res.json(book);
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// DELETE – delete book
app.delete('/api/books/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const book = await BookModel.findByIdAndDelete(req.params.id);
    if (!book) { res.status(404).json({ error: 'Book not found' }); return; }
    res.json({ message: 'Book deleted', id: req.params.id });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Fallback – serve frontend
app.get('*', (_req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT: number = parseInt(process.env.PORT ?? '3000', 10);
app.listen(PORT, () => {
  console.log(`🚀 Book Tracker running → http://localhost:${PORT}`);
});
