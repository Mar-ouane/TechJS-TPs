import { IBook } from './types';

const books: IBook[] = require('../books.json') as IBook[];

const API = 'http://localhost:3000/api/books';

async function seed(): Promise<void> {
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
        const created = (await res.json()) as IBook;
        console.log(`  ✅  "${created.title}" — ${created.status}`);
        inserted++;
      } else {
        const err = (await res.json()) as { error: string };
        console.log(`  ❌  "${book.title}" — ${err.error}`);
        failed++;
      }
    } catch (err: unknown) {
      console.log(`  ❌  "${book.title}" — ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`  Inserted : ${inserted}`);
  console.log(`  Failed   : ${failed}`);
  console.log(`─────────────────────────────────────\n`);
}

seed();
