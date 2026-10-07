// Semeia a base local (kolha.db) com os dados demo sem apagar fretes já fechados.
import { readFileSync } from 'node:fs';
import { createSqliteDb } from '../shared/db.js';

async function main() {
  const db = await createSqliteDb(process.env.KOLHA_DB ?? './kolha.db');
  const seed = readFileSync('./seed.sql', 'utf8');
  let ok = 0;
  for (const raw of seed.split(';')) {
    const s = raw.trim();
    if (!s) continue;
    const lines = s.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n').trim();
    if (!lines) continue;
    try {
      await db.run(lines);
      ok++;
    } catch (e) {
      console.error('seed falhou:', String(e).slice(0, 160));
    }
  }
  console.log(`seed ok (${ok} comandos)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
