// scripts/generate-stream-stubs.mjs
import { readdir, mkdir, writeFile } from 'fs/promises';
import path from 'path';

const SUB_DIR = 'subtitles/series';
const OUT_DIR = 'stream/series';

// pega ids dos arquivos de legenda e normaliza
const getIdsFromSubtitleFiles = async () => {
  const files = await readdir(SUB_DIR).catch(() => []);
  // pega só jsons, remove extensão e decodifica %3A -> :
  const ids = files
    .filter(f => f.toLowerCase().endsWith('.json'))
    .map(f => f.replace(/\.json$/i, ''))
    .map(id => decodeURIComponent(id));
  // remove duplicados
  return Array.from(new Set(ids));
};

const writeStubForId = async (id) => {
  await mkdir(OUT_DIR, { recursive: true });
  const payload = JSON.stringify({ streams: [] });

  // com dois formatos:
  const colonName = `${id}.json`;                  // tt31228002:1:1.json
  const encName = `${encodeURIComponent(id)}.json`; // tt31228002%3A1%3A1.json

  await writeFile(path.join(OUT_DIR, colonName), payload);
  await writeFile(path.join(OUT_DIR, encName), payload);
};

const run = async () => {
  const ids = await getIdsFromSubtitleFiles();
  if (!ids.length) {
    console.log('Nenhuma legenda encontrada em subtitles/series — sem stubs de stream.');
    return;
  }
  for (const id of ids) await writeStubForId(id);
  console.log(`Gerados stubs de stream para ${ids.length} episódio(s).`);
};

run().catch(err => {
  console.error('Erro gerando stubs de stream:', err);
  process.exit(1);
});
