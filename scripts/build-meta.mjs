import fs from "node:fs/promises";

const OUT = "meta/series/tt31228002.json";
const SRC = "https://v3-cinemeta.strem.io/meta/series/tt31228002.json";

const poster = "https://raw.githubusercontent.com/farkdar/onepace-addon/main/assets/poster.png";
const logo = "https://raw.githubusercontent.com/farkdar/onepace-addon/main/assets/logo.png";
const background = "https://raw.githubusercontent.com/farkdar/onepace-addon/main/assets/banner.jpg";

const ensureDirs = async (filePath) => {
  const dir = filePath.split("/").slice(0, -1).join("/");
  await fs.mkdir(dir, { recursive: true });
};

const main = async () => {
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`Falha ao baixar Cinemeta: ${res.status}`);
  const data = await res.json();

  const base = data?.meta ?? {};
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
      background
    }
  };

  // garantia: sempre tenha videos (copiados do cinemeta)
  if (!Array.isArray(merged.meta.videos)) merged.meta.videos = base.videos || [];

  await ensureDirs(OUT);
  await fs.writeFile(OUT, JSON.stringify(merged, null, 2), "utf8");
  console.log(`OK: gerado ${OUT} com ${merged.meta.videos.length} vídeos`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
