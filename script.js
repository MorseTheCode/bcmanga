document.addEventListener("DOMContentLoaded", function() {
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
    spreadContainer: document.getElementById("spreadContainer"),
    prevSpread: document.getElementById("prevSpread"),
    nextSpread: document.getElementById("nextSpread"),
    pageIndicator: document.getElementById("pageIndicator"),
    singlePageMode: document.getElementById("singlePageMode")
  };

  // Estado do aplicativo
  const state = {
    currentManga: null,
    currentVolume: null,
    currentPages: [],
    currentSpreadIndex: 0,
    viewMode: 'double', // 'double' ou 'single'
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

  // Carrega um volume específico
  async function loadVolume(volumeIndex) {
    try {
      elements.loadingMessage.style.display = "block";
      elements.readButton.disabled = true;
      
      state.currentVolume = state.currentManga.volumes[volumeIndex];
      state.currentPages = state.currentVolume.pages;
      state.currentSpreadIndex = 0;
      state.viewMode = 'double';
      elements.singlePageMode.checked = false;
      
      elements.viewerTitle.textContent = state.currentVolume.title;
      elements.viewer.style.display = "flex";
      
      showSpread();
      
    } catch (error) {
      console.error("Erro:", error);
      alert(`Erro: ${error.message}\nVerifique o console (F12)`);
    } finally {
      elements.loadingMessage.style.display = "none";
    }
  }

  // Mostra as páginas no visualizador
  function showSpread() {
    elements.spreadContainer.innerHTML = '';
    const spread = document.createElement('div');
    spread.className = `spread spread-${state.viewMode}`;

    if (state.viewMode === 'double') {
      // Modo página dupla (right-to-left)
      const rightPageIndex = state.currentSpreadIndex;
      const leftPageIndex = state.currentSpreadIndex + 1;

      // Página da direita (primeira a aparecer)
      if (rightPageIndex < state.currentPages.length) {
        const rightPage = createPageElement(rightPageIndex, 'page-right');
        spread.appendChild(rightPage);
      }

      // Página da esquerda (segunda a aparecer)
      if (leftPageIndex < state.currentPages.length) {
        const leftPage = createPageElement(leftPageIndex, 'page-left');
        spread.appendChild(leftPage);
      }

      // Atualiza indicador (ex: "1-2/30")
      const startPage = Math.min(state.currentSpreadIndex + 1, state.currentPages.length);
      const endPage = Math.min(state.currentSpreadIndex + 2, state.currentPages.length);
      elements.pageIndicator.textContent = `${startPage}-${endPage}/${state.currentPages.length}`;
    } else {
      // Modo página única
      const page = createPageElement(state.currentSpreadIndex, 'page-center');
      spread.appendChild(page);
      elements.pageIndicator.textContent = `${state.currentSpreadIndex + 1}/${state.currentPages.length}`;
    }

    elements.spreadContainer.appendChild(spread);
  }

  // Cria elemento de página
  function createPageElement(pageIndex, className) {
    const page = document.createElement('div');
    page.className = `page ${className}`;
    
    const img = document.createElement('img');
    img.src = state.currentPages[pageIndex];
    img.alt = `Página ${pageIndex + 1}`;
    img.loading = 'lazy';
    
    page.appendChild(img);
    return page;
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

  elements.closeViewer.addEventListener("click", function() {
    elements.viewer.style.display = "none";
  });

  elements.prevSpread.addEventListener("click", function() {
    if (state.viewMode === 'double') {
      state.currentSpreadIndex = Math.max(state.currentSpreadIndex - 2, 0);
    } else {
      state.currentSpreadIndex = Math.max(state.currentSpreadIndex - 1, 0);
    }
    showSpread();
  });

  elements.nextSpread.addEventListener("click", function() {
    if (state.viewMode === 'double') {
      state.currentSpreadIndex = Math.min(state.currentSpreadIndex + 2, state.currentPages.length - 1);
    } else {
      state.currentSpreadIndex = Math.min(state.currentSpreadIndex + 1, state.currentPages.length - 1);
    }
    showSpread();
  });

  elements.singlePageMode.addEventListener("change", function(e) {
    state.viewMode = e.target.checked ? 'single' : 'double';
    showSpread();
  });

  // Navegação por teclado (right-to-left)
  document.addEventListener("keydown", function(e) {
    if (elements.viewer.style.display === "flex") {
      // Setas invertidas para leitura oriental
      if (e.key === "ArrowRight") elements.prevSpread.click(); // ← Avança
      if (e.key === "ArrowLeft") elements.nextSpread.click(); // → Volta
      if (e.key === "Escape") elements.closeViewer.click();
    }
  });

  // Inicializa o app
  init();
});