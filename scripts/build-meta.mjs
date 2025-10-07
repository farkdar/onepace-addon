// scripts/build-meta.mjs
import fs from "node:fs/promises";

// ARQUIVOS / URLS
const OUT = "meta/series/tt31228002.json";
const SRC = "https://v3-cinemeta.strem.io/meta/series/tt31228002.json";

// Use sempre GitHub Pages (mais estável que raw.githubusercontent)
const poster     = "https://farkdar.github.io/onepace-addon/assets/poster.png";
const logo       = "https://farkdar.github.io/onepace-addon/assets/logo.png";
const background = "https://farkdar.github.io/onepace-addon/assets/banner.jpg";

const ensureDirs = async (filePath) => {
  const dir = filePath.split("/").slice(0, -1).join("/");
  await fs.mkdir(dir, { recursive: true });
};

const normalizeVideos = (videos = []) => {
  // 1) dedupe por id (se houver)
  const seen = new Set();
  const deduped = [];
  for (const v of videos) {
    const key = v.id || `${v.season}:${v.number ?? v.episode}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(v);
    }
  }

  // 2) garantir "episode" e números inteiros
  const withEpisode = deduped.map((v) => ({
    ...v,
    season: Number(v.season ?? v.S ?? 0),
    number: Number(v.number ?? v.N ?? v.episode ?? 0),
    episode: Number(v.episode ?? v.number ?? 0),
  }));

  // 3) ordenar por season asc, episode asc
  withEpisode.sort((a, b) =>
    (a.season - b.season) || (a.episode - b.episode)
  );

  return withEpisode;
};

const main = async () => {
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`Falha ao baixar Cinemeta: ${res.status}`);
  const data = await res.json();

  const base = data?.meta ?? {};

  // Monta UM ÚNICO objeto meta. Nada fora de "meta" no arquivo final.
  const mergedMeta = {
    // mantemos tudo do Cinemeta primeiro…
    ...base,

    // …e sobrescrevemos/forçamos o que é crítico:
    id: "tt31228002",
    type: "series",
    name: base.name || "One Pace",

    poster,
    logo,
    background,

    // vídeos normalizados ao final (para garantir consistência)
    videos: normalizeVideos(base.videos),
  };

  const finalDoc = { meta: mergedMeta };

  await ensureDirs(OUT);
  await fs.writeFile(OUT, JSON.stringify(finalDoc, null, 2), "utf8");
  console.log(`OK: gerado ${OUT} com ${mergedMeta.videos?.length ?? 0} vídeos`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
