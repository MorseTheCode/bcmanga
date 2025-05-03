const fs = require('fs');
const path = require('path');

// Configurações
const CONFIG = {
  mangaDir: path.join(__dirname, 'mangas'),          // Pasta principal dos mangás
  coversDir: path.join(__dirname, 'images', 'covers'), // Pasta das capas
  outputFile: path.join(__dirname, 'manifest.json'),   // Arquivo de saída
  coverExtensions: ['.jpg', '.jpeg', '.png', '.webp'], // Extensões de capa
  pageExtensions: ['.jpg', '.jpeg', '.png', '.webp'],  // Extensões de páginas
  volumeRegex: /^volume[\s-]*(\d+)/i                  // Regex para identificar pastas de volume
};

// Função principal
async function generateManifest() {
  try {
    console.log('🔍 Iniciando geração do manifest.json...');

    // Verifica se as pastas existem
    verifyDirectories();

    // Estrutura para o manifest
    const manifest = { mangas: [] };

    // Processa cada arquivo de capa
    const coverFiles = getCoverFiles();
    
    for (const coverFile of coverFiles) {
      const mangaName = cleanMangaName(coverFile);
      const mangaPath = path.join(CONFIG.mangaDir, mangaName.folderFormat);

      if (!fs.existsSync(mangaPath)) {
        console.warn(`⚠️  Pasta não encontrada para "${mangaName.display}": ${mangaPath}`);
        continue;
      }

      const manga = {
        title: mangaName.display,
        cover: `images/covers/${coverFile}`,
        volumes: processVolumes(mangaPath, mangaName.folderFormat)
      };

      if (manga.volumes.length > 0) {
        manifest.mangas.push(manga);
        console.log(`✓ Processado: ${manga.title} (${manga.volumes.length} volumes)`);
      }
    }

    // Salva o manifest.json
    saveManifest(manifest);
    console.log(`✅ Manifest gerado com sucesso! ${manifest.mangas.length} mangás encontrados.`);

  } catch (error) {
    console.error('❌ Erro ao gerar manifest:', error.message);
    process.exit(1);
  }
}

// Funções auxiliares
function verifyDirectories() {
  if (!fs.existsSync(CONFIG.mangaDir)) {
    throw new Error(`Pasta de mangás não encontrada: ${CONFIG.mangaDir}`);
  }
  if (!fs.existsSync(CONFIG.coversDir)) {
    throw new Error(`Pasta de capas não encontrada: ${CONFIG.coversDir}`);
  }
}

function getCoverFiles() {
  return fs.readdirSync(CONFIG.coversDir)
    .filter(file => CONFIG.coverExtensions.includes(path.extname(file).toLowerCase()));
}

function cleanMangaName(filename) {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  return {
    display: nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    folderFormat: nameWithoutExt.toLowerCase().replace(/\s+/g, '-')
  };
}

function processVolumes(mangaPath, mangaFolder) {
  const volumes = [];

  const volumeFolders = fs.readdirSync(mangaPath)
    .filter(item => {
      const itemPath = path.join(mangaPath, item);
      return fs.statSync(itemPath).isDirectory() && CONFIG.volumeRegex.test(item);
    })
    .sort((a, b) => {
      const numA = parseInt(a.match(CONFIG.volumeRegex)[1]) || 0;
      const numB = parseInt(b.match(CONFIG.volumeRegex)[1]) || 0;
      return numA - numB;
    });

  for (const volumeFolder of volumeFolders) {
    const volumePath = path.join(mangaPath, volumeFolder);
    const pages = getSortedPages(volumePath);
    
    if (pages.length > 0) {
      volumes.push({
        title: volumeFolder.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        pages: pages.map(page => `mangas/${mangaFolder}/${volumeFolder}/${page}`)
      });
    }
  }

  return volumes;
}

function getSortedPages(volumePath) {
  return fs.readdirSync(volumePath)
    .filter(file => CONFIG.pageExtensions.includes(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function saveManifest(manifest) {
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(manifest, null, 2));
  console.log(`📁 Manifest salvo em: ${CONFIG.outputFile}`);
}

// Executa o script
generateManifest();