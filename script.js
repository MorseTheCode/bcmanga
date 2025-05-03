document.addEventListener("DOMContentLoaded", async function() {
  // Elementos da interface
  const elements = {
    mangaList: document.getElementById("mangaList"),
    volumeSelector: document.getElementById("volumeSelector"),
    mangaCover: document.getElementById("mangaCover"),
    volumeDropdown: document.getElementById("volumeDropdown"),
    readButton: document.getElementById("readButton"),
    loadingMessage: document.getElementById("loadingMessage"),
    viewer: document.getElementById("viewer"),
    closeViewer: document.getElementById("closeViewer"),
    viewerTitle: document.getElementById("viewerTitle"),
    currentPageImg: document.getElementById("currentPage"),
    prevPageBtn: document.getElementById("prevPage"),
    nextPageBtn: document.getElementById("nextPage"),
    pageIndicator: document.getElementById("pageIndicator")
  };

  // Estado do aplicativo
  const state = {
    currentManga: null,
    currentVolume: null,
    currentPages: [],
    currentPageIndex: 0,
    manifest: null
  };

  // Inicialização
  async function init() {
    try {
      const response = await fetch('manifest.json');
      if (!response.ok) throw new Error('Erro ao carregar manifest.json');
      state.manifest = await response.json();
      loadMangas();
    } catch (error) {
      console.error('Erro:', error);
      alert('Falha ao carregar dados. Verifique o console.');
    }
  }

  // Carrega a lista de mangás
  function loadMangas() {
    elements.mangaList.innerHTML = '';
    state.manifest.mangas.forEach(manga => {
      const mangaCard = document.createElement("div");
      mangaCard.className = "manga-card";
      mangaCard.innerHTML = `
        <img src="${manga.cover}" alt="${manga.title}" class="manga-cover-small">
        <div class="manga-info">
          <h3>${manga.title}</h3>
        </div>
      `;
      mangaCard.addEventListener("click", () => showVolumeSelector(manga));
      elements.mangaList.appendChild(mangaCard);
    });
  }

  // Mostra seletor de volumes
  function showVolumeSelector(manga) {
    state.currentManga = manga;
    elements.mangaList.style.display = "none";
    elements.volumeSelector.style.display = "block";
    elements.mangaCover.src = manga.cover;
    
    elements.volumeDropdown.innerHTML = '<option value="">-- Selecionar Volume --</option>';
    manga.volumes.forEach((volume, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = volume.title;
      elements.volumeDropdown.appendChild(option);
    });
    
    elements.readButton.disabled = true;
  }

  // Event Listeners
  elements.volumeDropdown.addEventListener("change", function() {
    elements.readButton.disabled = this.value === "";
  });

  elements.readButton.addEventListener("click", function() {
    const volumeIndex = elements.volumeDropdown.value;
    if (volumeIndex === "") return;
    
    loadVolume(parseInt(volumeIndex));
  });

  // Carrega um volume específico
  async function loadVolume(volumeIndex) {
    try {
      elements.loadingMessage.style.display = "block";
      elements.readButton.disabled = true;
      
      state.currentVolume = state.currentManga.volumes[volumeIndex];
      elements.viewerTitle.textContent = state.currentVolume.title;
      
      state.currentPages = state.currentVolume.pages.map(p => 
        `${state.currentManga.path}${state.currentVolume.path}${p}`
      );
      
      if (state.currentPages.length === 0) throw new Error("Nenhuma página encontrada");
      
      state.currentPageIndex = 0;
      showCurrentPage();
      elements.viewer.style.display = "flex";
      
    } catch (error) {
      console.error("Erro:", error);
      alert(`Erro: ${error.message}`);
    } finally {
      elements.loadingMessage.style.display = "none";
    }
  }

  // Mostra a página atual
  function showCurrentPage() {
    elements.currentPageImg.src = state.currentPages[state.currentPageIndex];
    elements.pageIndicator.textContent = `${state.currentPageIndex + 1}/${state.currentPages.length}`;
    elements.prevPageBtn.disabled = state.currentPageIndex === 0;
    elements.nextPageBtn.disabled = state.currentPageIndex === state.currentPages.length - 1;
  }

  // Navegação
  elements.prevPageBtn.addEventListener("click", () => {
    if (state.currentPageIndex > 0) {
      state.currentPageIndex--;
      showCurrentPage();
    }
  });

  elements.nextPageBtn.addEventListener("click", () => {
    if (state.currentPageIndex < state.currentPages.length - 1) {
      state.currentPageIndex++;
      showCurrentPage();
    }
  });

  elements.closeViewer.addEventListener("click", () => {
    elements.viewer.style.display = "none";
  });

  // Navegação por teclado
  document.addEventListener("keydown", (e) => {
    if (elements.viewer.style.display === "flex") {
      if (e.key === "ArrowLeft") elements.prevPageBtn.click();
      if (e.key === "ArrowRight") elements.nextPageBtn.click();
      if (e.key === "Escape") elements.closeViewer.click();
    }
  });

  // Inicializa o app
  init();
});