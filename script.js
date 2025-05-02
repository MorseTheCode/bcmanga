document.addEventListener("DOMContentLoaded", function() {
  // Elementos da interface
  const mangaList = document.getElementById("mangaList");
  const volumeSelector = document.getElementById("volumeSelector");
  const mangaCover = document.getElementById("mangaCover");
  const volumeDropdown = document.getElementById("volumeDropdown");
  const readButton = document.getElementById("readButton");
  const loadingMessage = document.getElementById("loadingMessage");
  const viewer = document.getElementById("viewer");
  const closeViewer = document.getElementById("closeViewer");
  const viewerTitle = document.getElementById("viewerTitle");
  const currentPageImg = document.getElementById("currentPage");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageIndicator = document.getElementById("pageIndicator");

  // Variáveis de estado
  let currentManga = null;
  let currentVolume = null;
  let currentPages = [];
  let currentPageIndex = 0;

  // Carrega mangás do volumes.json
  fetch("volumes.json")
    .then(response => {
      if (!response.ok) throw new Error("Erro ao carregar volumes.json");
      return response.json();
    })
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
    })
    .catch(error => {
      console.error("Erro ao carregar mangás:", error);
      alert("Erro ao carregar a lista de mangás. Verifique o console (F12) para detalhes.");
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
    loadingMessage.style.display = "none";
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
      console.log("Tentando carregar:", selectedZip);
      
      const response = await fetch(selectedZip);
      if (!response.ok) throw new Error(`Erro HTTP! status: ${response.status}`);
      
      const blob = await response.blob();
      console.log("Tamanho do ZIP:", blob.size, "bytes");
      
      if (blob.size === 0) throw new Error("Arquivo ZIP vazio ou inválido");
      
      const zip = await JSZip.loadAsync(blob);
      const files = [];
      
      // Processar arquivos do ZIP
      zip.forEach((relativePath, file) => {
        if (!file.dir && /\.(jpg|jpeg|png|webp)$/i.test(relativePath)) {
          files.push({ name: relativePath, file: file });
        }
      });
      
      if (files.length === 0) throw new Error("Nenhuma imagem encontrada no ZIP");
      
      // Ordenar páginas numericamente
      files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      
      // Extrair URLs das imagens
      currentPages = [];
      for (const { file } of files) {
        const blob = await file.async('blob');
        currentPages.push(URL.createObjectURL(blob));
      }
      
      // Configurar visualizador
      currentVolume = currentManga.volumes.find(v => v.zip === selectedZip);
      viewerTitle.textContent = currentVolume.title;
      currentPageIndex = 0;
      showCurrentPage();
      viewer.style.display = "flex";
      
    } catch (error) {
      console.error("Erro detalhado:", error);
      alert(`Falha ao carregar volume: ${error.message}\nVerifique o console (F12) para detalhes.`);
    } finally {
      loadingMessage.style.display = "none";
    }
  });

  // Mostrar página atual no visualizador
  function showCurrentPage() {
    if (currentPages.length === 0) return;
    
    currentPageImg.src = currentPages[currentPageIndex];
    pageIndicator.textContent = `${currentPageIndex + 1}/${currentPages.length}`;
    
    // Atualizar estado dos botões
    prevPageBtn.disabled = currentPageIndex === 0;
    nextPageBtn.disabled = currentPageIndex === currentPages.length - 1;
  }

  // Navegação entre páginas
  prevPageBtn.addEventListener("click", () => {
    if (currentPageIndex > 0) {
      currentPageIndex--;
      showCurrentPage();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPageIndex < currentPages.length - 1) {
      currentPageIndex++;
      showCurrentPage();
    }
  });

  // Fechar visualizador
  closeViewer.addEventListener("click", () => {
    viewer.style.display = "none";
    // Liberar URLs das imagens da memória
    currentPages.forEach(url => URL.revokeObjectURL(url));
    currentPages = [];
  });

  // Navegação por teclado
  document.addEventListener("keydown", (e) => {
    if (viewer.style.display === "flex") {
      if (e.key === "ArrowLeft") prevPageBtn.click();
      if (e.key === "ArrowRight") nextPageBtn.click();
      if (e.key === "Escape") closeViewer.click();
    }
  });
});