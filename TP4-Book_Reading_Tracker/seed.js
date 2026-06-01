/**
 * seed.js – Inserts all books from books.json into MongoDB via the REST API.
 * Run with: node seed.js
 */

const books = require('./books.json');

const API = 'http://localhost:3000/api/books';

async function seed() {
  console.log(`\n📚 Seeding ${books.length} books into the database...\n`);

  let inserted = 0;
  let failed   = 0;

  for (const book of books) {
    try {
      const res = await fetch(API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(book),
      });

      if (res.ok) {
        const created = await res.json();
        console.log(`  ✅  "${created.title}" — ${created.status}`);
        inserted++;
      } else {
        const err = await res.json();
        console.log(`  ❌  "${book.title}" — ${err.error}`);
        failed++;
      }
    } catch (err) {
      console.log(`  ❌  "${book.title}" — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`  Inserted : ${inserted}`);
  console.log(`  Failed   : ${failed}`);
  console.log(`─────────────────────────────────────\n`);
}

seed();
