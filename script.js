document.addEventListener("DOMContentLoaded", function() {
  // Elementos da interface
  const mangaList = document.getElementById("mangaList");
  const volumeSelector = document.getElementById("volumeSelector");
  const mangaCover = document.getElementById("mangaCover");
  const volumeDropdown = document.getElementById("volumeDropdown");
  const readButton = document.getElementById("readButton");
  const loadingMessage = document.getElementById("loadingMessage");
  
  // ... (outros elementos do visualizador mantidos)

  // Variáveis de estado
  let currentManga = null;
  let currentVolume = null;
  let currentPages = [];
  let currentPageIndex = 0;

  // Carrega mangás do volumes.json
  fetch("volumes.json")
    .then(response => response.json())
    .then(data => {
      data.mangas.forEach(manga => {
        const mangaCard = document.createElement("div");
        mangaCard.className = "manga-card";
        mangaCard.innerHTML = `
          <img src="${manga.cover}" alt="${manga.title}" class="manga-cover-small">
          <div class="manga-info">
            <h3>${manga.title}</h3>
            <p>${manga.author}</p>
          </div>
        `;
        mangaCard.addEventListener("click", () => showVolumeSelector(manga));
        mangaList.appendChild(mangaCard);
      });
    });

  // Mostra seletor de volumes
  function showVolumeSelector(manga) {
    currentManga = manga;
    mangaList.style.display = "none";
    volumeSelector.style.display = "block";
    mangaCover.src = manga.cover;
    
    // Preencher dropdown
    volumeDropdown.innerHTML = '<option value="">-- Selecionar Volume --</option>';
    manga.volumes.forEach(volume => {
      const option = document.createElement("option");
      option.value = volume.zip;
      option.textContent = volume.title;
      volumeDropdown.appendChild(option);
    });
    
    // Resetar estado
    readButton.disabled = true;
  }

  // Habilitar botão quando selecionar volume
  volumeDropdown.addEventListener("change", function() {
    readButton.disabled = !this.value;
  });

  // Botão Ler
  readButton.addEventListener("click", async function() {
    const selectedZip = volumeDropdown.value;
    if (!selectedZip) return;
    
    // Mostrar mensagem de carregamento
    loadingMessage.style.display = "block";
    readButton.disabled = true;
    
    try {
      // Encontrar o volume selecionado
      currentVolume = currentManga.volumes.find(v => v.zip === selectedZip);
      
      // Carregar ZIP
      const response = await fetch(currentVolume.zip);
      const blob = await response.blob();
      const zip = await JSZip.loadAsync(blob);
      
      currentPages = [];
      const files = [];
      
      // Processar arquivos
      zip.forEach((relativePath, file) => {
        if (!file.dir && relativePath.match(/\.(jpg|jpeg|png|webp)$/i)) {
          files.push({ name: relativePath, file: file });
        }
      });
      
      // Ordenar páginas
      files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      
      // Extrair URLs
      for (const item of files) {
        const blob = await item.file.async('blob');
        currentPages.push(URL.createObjectURL(blob));
      }
      
      // Mostrar visualizador
      if (currentPages.length > 0) {
        viewerTitle.textContent = currentVolume.title;
        currentPageIndex = 0;
        showCurrentPage();
        viewer.style.display = "flex";
      } else {
        alert("Nenhuma página encontrada neste volume!");
      }
    } catch (error) {
      console.error("Erro ao carregar volume:", error);
      alert("Erro ao carregar o volume!");
    } finally {
      loadingMessage.style.display = "none";
    }
  });

  // ... (manter o resto das funções do visualizador)
});