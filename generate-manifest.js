const fs = require('fs');
const path = require('path');

const mangaDir = path.join(__dirname, 'mangas');
const manifest = {
  mangas: []
};

fs.readdirSync(mangaDir).forEach(mangaFolder => {
  const mangaPath = path.join(mangaDir, mangaFolder);
  if (!fs.statSync(mangaPath).isDirectory()) return;

  const manga = {
    title: mangaFolder,
    cover: `mangas/${mangaFolder}/cover.jpg`,
    volumes: []
  };

  fs.readdirSync(mangaPath).forEach(item => {
    const volumePath = path.join(mangaPath, item);
    if (fs.statSync(volumePath).isDirectory() && item.startsWith('Volume')) {
      const pages = fs.readdirSync(volumePath)
        .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      manga.volumes.push({
        title: item.replace(/-/g, ' '),
        path: `mangas/${mangaFolder}/${item}/`,
        pages: pages.map(p => `${item}/${p}`)
      });
    }
  });

  manifest.mangas.push(manga);
});

fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
console.log('manifest.json gerado com sucesso!');