const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/book_tracker';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB:', MONGO_URI))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ─── Mongoose Schema ───────────────────────────────────────────────────────────
const bookSchema = new mongoose.Schema({
  title:      { type: String, required: true, trim: true },
  author:     { type: String, required: true, trim: true },
  pages:      { type: Number, required: true, min: 1 },
  pagesRead:  { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['Read', 'Re-read', 'DNF', 'Currently reading', 'Returned Unread', 'Want to read'],
    default: 'Want to read',
    required: true,
  },
  price:      { type: Number, default: 0, min: 0 },
  format: {
    type: String,
    enum: ['Print', 'PDF', 'Ebook', 'AudioBook'],
    required: true,
  },
  suggestedBy: { type: String, default: '', trim: true },
  finished:    { type: Boolean, default: false },
}, { timestamps: true });

// Pre-save hook: auto-compute finished, clamp pagesRead
bookSchema.pre('save', function (next) {
  if (this.pagesRead > this.pages) this.pagesRead = this.pages;
  this.finished = (this.pages > 0 && this.pagesRead >= this.pages);
  next();
});

const BookModel = mongoose.model('Book', bookSchema);

// ─── API Routes ────────────────────────────────────────────────────────────────

// GET all books
app.get('/api/books', async (req, res) => {
  try {
    const books = await BookModel.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single book
app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST – create book
app.post('/api/books', async (req, res) => {
  try {
    const book = new BookModel(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT – update book
app.put('/api/books/:id', async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    const allowed = ['title', 'author', 'pages', 'pagesRead', 'status', 'price', 'format', 'suggestedBy'];
    allowed.forEach(f => { if (req.body[f] !== undefined) book[f] = req.body[f]; });
    await book.save(); // pre-save hook recomputes finished
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE – delete book
app.delete('/api/books/:id', async (req, res) => {
  try {
    const book = await BookModel.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json({ message: 'Book deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback – serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Book Tracker running → http://localhost:${PORT}`);
});
