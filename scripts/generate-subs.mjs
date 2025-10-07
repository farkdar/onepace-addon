// scripts/generate-subs.mjs
import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// série alvo
const SERIES_IMDB = "tt31228002";

// pastas
const SUBS_DIR = path.join(__dirname, "..", "assets", "subs");
const OUT_SUBS_DIR = path.join(__dirname, "..", "subtitles", "series");

// base pública (permite override via env)
const PUBLIC_BASE =
  process.env.PUBLIC_BASE?.replace(/\/$/, "") ||
  "https://farkdar.github.io/onepace-addon";

// mapa de idiomas
const LANG_MAP = {
  pt: "pt", ptbr: "pt", br: "pt",
  en: "en", eng: "en",
  fr: "fr", fra: "fr", fre: "fr",
  es: "es", spa: "es",
  it: "it",
  de: "de",
  ja: "ja", jp: "ja"
};

const ALLOWED_EXTS = new Set([".srt", ".vtt"]);

const ensureDir = p => fs.mkdirSync(p, { recursive: true });
const encodeId = id => encodeURIComponent(id);

function parseSubsFilename(fname) {
  // S{S}E{E}_{lang}.ext  (ex.: S1E1_pt.srt)
  const ext = path.extname(fname).toLowerCase();
  if (!ALLOWED_EXTS.has(ext)) return null;

  const m = /^S(\d+)E(\d+)_([^.]+)\.[^.]+$/i.exec(fname);
  if (!m) return null;

  const season = parseInt(m[1], 10);
  const episode = parseInt(m[2], 10);
  const rawLang = (m[3] || "").toLowerCase();
  const lang = LANG_MAP[rawLang] || rawLang || "und";

  return { season, episode, lang, ext, fname };
}

function collectByEpisode() {
  if (!fs.existsSync(SUBS_DIR)) return new Map();

  const map = new Map(); // key = `${S}:${E}`, value = [{lang, url, id}]
  const all = fs.readdirSync(SUBS_DIR);

  for (const fname of all) {
    const parsed = parseSubsFilename(fname);
    if (!parsed) {
      // arquivo ignorado
      continue;
    }
    const key = `${parsed.season}:${parsed.episode}`;
    const list = map.get(key) || [];

    // monta o objeto
    const entry = {
      lang: parsed.lang,
      url: `${PUBLIC_BASE}/assets/subs/${encodeURIComponent(fname)}`,
      id: parsed.lang
    };
    list.push(entry);
    map.set(key, list);
  }

  // dedupe + sort por lang
  for (const [k, arr] of map) {
    const byLang = new Map();
    for (const it of arr) if (!byLang.has(it.lang)) byLang.set(it.lang, it);
    const uniq = [...byLang.values()].sort((a, b) => a.lang.localeCompare(b.lang));
    map.set(k, uniq);
  }

  return map;
}

function writeJson(p, obj) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function main() {
  const byEp = collectByEpisode();

  // (opcional) limpar pasta de saída antes
  ensureDir(OUT_SUBS_DIR);
  for (const f of fs.readdirSync(OUT_SUBS_DIR)) {
    if (f.endsWith(".json")) fs.unlinkSync(path.join(OUT_SUBS_DIR, f));
  }

  let created = 0;
  for (const [key, subs] of byEp.entries()) {
    if (!subs || subs.length === 0) continue;
    const [S, E] = key.split(":").map(Number);
    const id = `${SERIES_IMDB}:${S}:${E}`;
    const outPath = path.join(OUT_SUBS_DIR, `${encodeId(id)}.json`);
    writeJson(outPath, { subtitles: subs });
    created++;
  }

  console.log(`✔ subtitles gerados: ${created}`);
  if (created === 0) {
    console.log("Nenhum arquivo criado. Padrão esperado: assets/subs/S{S}E{E}_{lang}.srt (ex.: S1E1_pt.srt).");
  }
}

main();
