// scripts/generate-subs.mjs
import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Série alvo
const SERIES_IMDB = "tt31228002";

// Pastas
const SUBS_DIR = path.join(__dirname, "..", "assets", "subs");
const OUT_SUBS_DIR = path.join(__dirname, "..", "subtitles", "series");

// Base pública (permite override via env)
const PUBLIC_BASE =
  process.env.PUBLIC_BASE?.replace(/\/$/, "") ||
  "https://farkdar.github.io/onepace-addon";

// Map de idiomas (normaliza sufixos do arquivo para lang do Stremio)
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

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const encodeId = (id) => encodeURIComponent(id);

function parseSubsFilename(fname) {
  // Padrão: S{S}E{E}_{lang}.ext  (ex.: S1E1_pt.srt)
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
    if (!parsed) continue;

    const key = `${parsed.season}:${parsed.episode}`;
    const list = map.get(key) || [];

    const entry = {
      lang: parsed.lang,
      url: `${PUBLIC_BASE}/assets/subs/${encodeURIComponent(fname)}`,
      id: parsed.lang
    };
    list.push(entry);
    map.set(key, list);
  }

  // Dedupe por lang + ordena por lang
  for (const [k, arr] of map) {
    const byLang = new Map();
    for (const it of arr) {
      if (!byLang.has(it.lang)) byLang.set(it.lang, it);
    }
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

  // Limpa pasta de saída para refletir exatamente o que existe em assets/subs/
  ensureDir(OUT_SUBS_DIR);
  for (const f of fs.readdirSync(OUT_SUBS_DIR)) {
    if (f.endsWith(".json")) fs.unlinkSync(path.join(OUT_SUBS_DIR, f));
  }

  let episodesWritten = 0;
  let filesWritten = 0;

  for (const [key, subs] of byEp.entries()) {
    if (!subs || subs.length === 0) continue;

    const [S, E] = key.split(":").map(Number);
    const id = `${SERIES_IMDB}:${S}:${E}`; // ID com ":" (forma preferida no Stremio)
    const payload = { subtitles: subs };

    // 1) Variante percent-encoded (tt31228002%3A1%3A1.json)
    const encodedName = `${encodeId(id)}.json`;
    writeJson(path.join(OUT_SUBS_DIR, encodedName), payload);
    filesWritten++;

    // 2) Variante com dois-pontos literal (tt31228002:1:1.json)
    //    - Linux/Actions: OK
    //    - Windows: pode falhar; protegemos com try/catch
    const colonName = `${id}.json`;
    try {
      writeJson(path.join(OUT_SUBS_DIR, colonName), payload);
      filesWritten++;
    } catch (err) {
      // Provavelmente rodando no Windows; apenas avisa e segue
      console.warn(`(aviso) não foi possível criar "${colonName}" neste SO: ${err.message}`);
    }

    episodesWritten++;
  }

  console.log(`✔ episódios processados: ${episodesWritten}`);
  console.log(`✔ arquivos gerados (somando %3A e :): ${filesWritten}`);
  if (episodesWritten === 0) {
    console.log(
      "Nenhum episódio gerado. Verifique nomes em assets/subs/ — padrão: S{S}E{E}_{lang}.srt (ex.: S1E1_pt.srt)."
    );
  }
}

main();
