// index.js - One Pace addon (corrigido usando serveHTTP)
// Requisitos: node >= 14
// npm install stremio-addon-sdk

const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');

const PORT = process.env.PORT || 7000;
const INFOHASH_S01 = 'cdab4a928dbbff643bbe5531f216eb36a60c85af'; // seu infoHash (temporada 1 com 4 eps)

const manifest = {
  id: 'org.onepace.addon',
  version: '1.0.3',
  name: 'One Pace',
  description: 'Add-on One Pace (IMDb tt0388629) — temporada 1 via torrent',
  resources: ['catalog', 'stream'],
  types: ['series'],
  catalogs: [{ id: 'onepace_catalog', type: 'series', name: 'One Pace (Edits)' }]
};

const builder = new addonBuilder(manifest);

/* Catalog handler */
builder.defineCatalogHandler(({ type }) => {
  if (type !== 'series') return Promise.resolve({ metas: [] });

  const metas = [
    {
      id: 'tt0388629',
      type: 'series',
      name: 'One Pace (Edit)',
      poster: 'https://example.com/poster.jpg' // substitua se quiser
    }
  ];
  return Promise.resolve({ metas });
});

/* Stream handler — todos 4 episódios apontam para o mesmo torrent (s01) */
builder.defineStreamHandler(({ type, id }) => {
  if (type !== 'series') return Promise.resolve({ streams: [] });

  const streamsMap = {
    'tt0388629:1:1': [{ title: 'S01E01 - 1080p (Torrent)', infoHash: INFOHASH_S01, quality: '1080p' }],
    'tt0388629:1:2': [{ title: 'S01E02 - 1080p (Torrent)', infoHash: INFOHASH_S01, quality: '1080p' }],
    'tt0388629:1:3': [{ title: 'S01E03 - 1080p (Torrent)', infoHash: INFOHASH_S01, quality: '1080p' }],
    'tt0388629:1:4': [{ title: 'S01E04 - 1080p (Torrent)', infoHash: INFOHASH_S01, quality: '1080p' }]
  };

  const streams = streamsMap[id] || [];
  return Promise.resolve({ streams });
});

/* Start server via serveHTTP (recomendado) */
serveHTTP(builder.getInterface(), { port: PORT });

console.log(`One Pace addon (serveHTTP) — rodando em http://127.0.0.1:${PORT}/manifest.json`);
console.log('No mesmo PC use http://127.0.0.1:7000/manifest.json; de outro dispositivo use http://<SEU_IP_LOCAL>:7000/manifest.json');
