import fs from "node:fs/promises";

const SRC = "https://v3-cinemeta.strem.io/meta/series/tt31228002.json";
const OUT = "meta/series/onepace%3Att31228002.json";

const IMG_BASE = "https://episodes.metahub.space"; // thumbnails por IMDb
const poster = "https://raw.githubusercontent.com/farkdar/onepace-addon/main/assets/poster.png";
const logo = "https://raw.githubusercontent.com/farkdar/onepace-addon/main/assets/logo.png";
const background = "https://raw.githubusercontent.com/farkdar/onepace-addon/main/assets/banner.jpg";

const ensureDir = async (p) => fs.mkdir(p.split("/").slice(0, -1).join("/"), { recursive: true });

const epThumb = (imdb, s, e) => `${IMG_BASE}/${imdb}/${s}/${e}/w780.jpg`;

const main = async () => {
  const r = await fetch(SRC);
  if (!r.ok) throw new Error(`Cinemeta ${r.status}`);
  const { meta: base = {} } = await r.json();

  const imdbId = base.imdb_id || "tt31228002";

  const videos = (base.videos || []).map(v => {
    const season = Number(v.season || 0);
    const number = Number(v.number || v.episode || 0);
    const id = String(v.id || "").replace(/^tt31228002:/, "onepace:tt31228002:");
    return {
      ...v,
      id,
      season,
      number,
      episode: number,                              // <<< chave para separar temporadas
      thumbnail: v.thumbnail || epThumb(imdbId, season, number)
    };
  });

  const meta = {
    meta: {
      ...base,
      id: "onepace:tt31228002",
      type: "series",
      poster, logo, background,
      behaviorHints: {
        ...(base.behaviorHints || {}),
        hasSeasons: true,
        defaultVideoId: "onepace:tt31228002:1:1"
      },
      videos
    }
  };

  await ensureDir(OUT);
  await fs.writeFile(OUT, JSON.stringify(meta, null, 2), "utf8");
  console.log(`OK: ${videos.length} vídeos tratados, escrito em ${OUT}`);
};

main().catch(e => { console.error(e); process.exit(1); });
