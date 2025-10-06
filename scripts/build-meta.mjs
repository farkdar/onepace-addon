import fs from "node:fs/promises";

const OUT = "meta/series/tt31228002.json";
const SRC = "https://v3-cinemeta.strem.io/meta/series/tt31228002.json";

const poster = "https://raw.githubusercontent.com/farkdar/onepace-addon/main/assets/poster.png";
const logo = "https://raw.githubusercontent.com/farkdar/onepace-addon/main/assets/logo.png";
const background = "https://raw.githubusercontent.com/farkdar/onepace-addon/main/assets/banner.jpg";

// base de thumbs por episódio (usa imdb_id + season + episode)
const EP_THUMB = (imdbId, s, e) =>
  `https://episodes.metahub.space/${imdbId}/${s}/${e}/w780.jpg`;

const ensureDirs = async (filePath) => {
  const dir = filePath.split("/").slice(0, -1).join("/");
  await fs.mkdir(dir, { recursive: true });
};

const main = async () => {
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`Falha ao baixar Cinemeta: ${res.status}`);
  const data = await res.json();

  const base = data?.meta ?? {};
  const imdbId = base.imdb_id || "tt31228002";

  // trata a lista de vídeos copiando number -> episode e preenchendo thumbnail
  const treatedVideos = Array.isArray(base.videos)
    ? base.videos.map((v) => {
        const season = Number(v.season ?? 0);
        const number = Number(v.number ?? v.episode ?? 0);

        return {
          ...v,
          season,
          number,
          // garante episode (cópia do number)
          episode: Number(v.episode ?? number),
          // se não houver thumbnail, gera baseado no imdb/season/episode
          thumbnail: v.thumbnail || EP_THUMB(imdbId, season, number),
        };
      })
    : [];

  const merged = {
    meta: {
      id: "tt31228002",
      type: "series",
      name: base.name || "One Pace",
      // mantém tudo que veio do Cinemeta:
      ...base,
      // injeta/força suas imagens:
      poster,
      logo,
      background,
      // substitui a lista por vídeos tratados
      videos: treatedVideos,
    },
  };

  await ensureDirs(OUT);
  await fs.writeFile(OUT, JSON.stringify(merged, null, 2), "utf8");
  console.log(`OK: gerado ${OUT} com ${merged.meta.videos.length} vídeos`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
