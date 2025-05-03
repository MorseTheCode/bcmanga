const fs = require('fs');
const path = require('path');

function normalizePath(path) {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}

// Função para ordenar volumes numericamente
function sortVolumes(a, b) {
    const getVolumeNumber = (str) => parseInt(str.match(/Volume (\d+)/i)?.[1] || 0);
    return getVolumeNumber(a) - getVolumeNumber(b);
}

const mangaDir = path.join(__dirname, 'mangas');
const manifest = {
    mangas: []
};

fs.readdirSync(mangaDir).forEach(mangaFolder => {
    const mangaPath = path.join(mangaDir, mangaFolder);
    if (!fs.statSync(mangaPath).isDirectory()) return;

    // Ordena os volumes antes de processar
    const volumeFolders = fs.readdirSync(mangaPath)
        .filter(item => fs.statSync(path.join(mangaPath, item)).isDirectory())
        .filter(item => /^Volume \d+/i.test(item))
        .sort(sortVolumes); // Aplica a ordenação numérica

    const manga = {
        title: mangaFolder,
        cover: `mangas/${mangaFolder}/cover.jpg`,
        path: `mangas/${mangaFolder}/`,
        volumes: []
    };

    volumeFolders.forEach(volumeFolder => {
        const volumePath = path.join(mangaPath, volumeFolder);
        const pages = fs.readdirSync(volumePath)
            .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
            .sort((a, b) => a.localeCompare(b, undefined, {
                numeric: true
            }));

        manga.volumes.push({
            title: volumeFolder.replace(/-/g, ' '),
            folder: volumeFolder,
            number: parseInt(volumeFolder.match(/\d+/)[0]),
            pages: pages.map(p => normalizePath(`mangas/${mangaFolder}/${volumeFolder}/${p}`)) // Caminho completo aqui
        });
    });

    // Ordena novamente por garantia
    manga.volumes.sort((a, b) => a.number - b.number);

    manifest.mangas.push(manga);
});

fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
console.log('manifest.json gerado com sucesso!');