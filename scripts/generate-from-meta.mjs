// scripts/generate-subs-from-folder.mjs
import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// ajustes principais
const SERIES_IMDB = "tt31228002"; // sua série
const SUBS_DIR = path.join(__dirname, "..", "assets", "subs");
const OUT_SUBS_DIR = path.join(__dirname, "..", "subtitles", "series");
const PUBLIC_BASE = "https://farkdar.github.io/onepace-addon"; // GitHub Pages

// mapeia sufixos de arquivo -> código de idioma pro Stremio
const LANG_MAP = {
  pt: "pt", ptbr: "pt", br: "pt",
  en: "en", eng: "en",
  fr: "fr", fra: "fr", fre: "fr",
  es: "es", spa: "es",
  it: "it",
  de: "de",
  ja: "ja", jp: "ja"
};

// aceita .srt e .vtt
const ALLOWED_EXTS = new Set([".srt", ".vtt"]);

// util
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function encodeId(id) { return encodeURIComponent(id); } // ":" -> %3A
function pad2(n) { return String(n).padStart(2, "0"); }

function parseSubsFilename(fname) {
  // Esperado: S{S}E{E}_{lang}.ext  (ex.: S1E1_pt.srt)
  const base = path.basename(fname);
  const ext = path.extname(base).toLowerCase();
  if (!ALLOWED_EXTS.has(ext)) return null;

  const m = /^S(\d+)E(\d+)_([^.]+)\.[^.]+$/i.exec(base);
  if (!m) return null;

  const season = parseInt(m[1], 10);
  const episode = parseInt(m[2], 10);
  const rawLang = (m[3] || "").toLowerCase();
  const lang = LANG_MAP[rawLang] || rawLang || "und";

  return { season, episode, lang, ext, fname: base };
}

function collectByEpisode() {
  if (!fs.existsSync(SUBS_DIR)) return new Map();
  const all = fs.readdirSync(SUBS_DIR);

  const map = new Map(); // key = `${S}:${E}`, value = [{lang, url}]
  for (const f of all) {
    const parsed = parseSubsFilename(f);
    if (!parsed) continue;

    const key = `${parsed.season}:${parsed.episode}`;
    const arr = map.get(key) || [];
    arr.push({
      lang: parsed.lang,
      url: `${PUBLIC_BASE}/assets/subs/${encodeURIComponent(parsed.fname)}`,
      id: parsed.lang
    });
    map.set(key, arr);
  }
  return map;
}

function writeJson(p, obj) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function main() {
  const byEp = collectByEpisode();

  // Limpeza opcional: não apagar nada; apenas sobrescrever os que existem no mapa.
  // Se quiser limpar antigos, descomente o bloco abaixo:
  // if (fs.existsSync(OUT_SUBS_DIR)) {
  //   for (const f of fs.readdirSync(OUT_SUBS_DIR)) {
  //     fs.unlinkSync(path.join(OUT_SUBS_DIR, f));
  //   }
  // }

  let created = 0;
  for (const [key, subs] of byEp.entries()) {
    if (!subs || subs.length === 0) continue; // evita "vazios"
    const [S, E] = key.split(":").map(Number);
    const id = `${SERIES_IMDB}:${S}:${E}`;
    const out = { subtitles: subs };
    const outPath = path.join(OUT_SUBS_DIR, `${encodeId(id)}.json`);
    writeJson(outPath, out);
    created++;
  }

  console.log(`✔ subtitles gerados: ${created}`);
  if (created === 0) {
    console.log("Nenhum arquivo criado. Verifique nomes em assets/subs (ex.: S1E1_pt.srt).");
  }
}

main();
