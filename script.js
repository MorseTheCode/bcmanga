document.addEventListener("DOMContentLoaded", function() {
  // Elementos da interface
  const elements = {
    mangaList: document.getElementById("mangaList"),
    volumeSelector: document.getElementById("volumeSelector"),
    mangaTitle: document.getElementById("mangaTitle"),
    mangaCover: document.getElementById("mangaCover"),
    volumeDropdown: document.getElementById("volumeDropdown"),
    readButton: document.getElementById("readButton"),
    backButton: document.getElementById("backButton"),
    viewer: document.getElementById("viewer"),
    closeViewer: document.getElementById("closeViewer"),
    volumeTitle: document.getElementById("volumeTitle"),
    viewerVolumeDropdown: document.getElementById("viewerVolumeDropdown"),
    pagesContainer: document.getElementById("pagesContainer"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    pageDropdown: document.getElementById("pageDropdown"),
    totalPages: document.getElementById("totalPages"),
    doublePageMode: document.getElementById("doublePageMode"),
    loadingScreen: document.getElementById("loadingScreen")
  };

  // Estado do aplicativo
  const state = {
    mangas: [],
    currentManga: null,
    currentVolume: null,
    currentVolumeIndex: 0,
    currentPages: [],
    currentPageIndex: 0,
    isDoublePage: true,
    isLoading: false,
    pageImages: [] // Cache para imagens carregadas
  };

  // Inicialização
  async function init() {
    try {
      showLoading(true);
      
      const response = await fetch('manifest.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (!data.mangas || !Array.isArray(data.mangas)) throw new Error("Estrutura inválida do manifest.json");
      
      state.mangas = data.mangas;
      renderMangaList();
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showError("Falha ao carregar a lista de mangás. Recarregue a página.");
    } finally {
      showLoading(false);
    }
  }

  function showLoading(show) {
    state.isLoading = show;
    elements.loadingScreen.style.display = show ? 'flex' : 'none';
  }

  function showError(message) {
    elements.mangaList.innerHTML = `
      <div class="error-message">
        ${message}
        <button onclick="window.location.reload()">Recarregar</button>
      </div>
    `;
  }

  function renderMangaList() {
    elements.mangaList.innerHTML = '';
    
    if (!state.mangas || state.mangas.length === 0) {
      elements.mangaList.innerHTML = '<div>Nenhum mangá encontrado no catálogo.</div>';
      return;
    }
    
    state.mangas.forEach(manga => {
      const mangaCard = document.createElement('div');
      mangaCard.className = 'manga-card';
      mangaCard.innerHTML = `
        <img src="${manga.cover}" alt="${manga.title}" class="manga-cover" 
             onerror="this.src='images/default-cover.jpg'">
        <div class="manga-info">
          <h3>${manga.title}</h3>
          <p>${manga.author || 'Autor não especificado'}</p>
        </div>
      `;
      mangaCard.addEventListener('click', () => showMangaVolumes(manga));
      elements.mangaList.appendChild(mangaCard);
    });
  }

  function showMangaVolumes(manga) {
    try {
      state.currentManga = manga;
      
      if (!manga.volumes || manga.volumes.length === 0) {
        throw new Error("Este mangá não possui volumes disponíveis");
      }
      
      elements.mangaTitle.textContent = manga.title;
      elements.mangaCover.src = manga.cover;
      elements.mangaCover.onerror = () => elements.mangaCover.src = 'images/default-cover.jpg';
      
      elements.volumeSelector.style.display = 'block';
      elements.mangaList.style.display = 'none';
      
      elements.volumeDropdown.innerHTML = '<option value="">-- Selecionar Volume --</option>';
      manga.volumes.forEach((volume, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = volume.title;
        elements.volumeDropdown.appendChild(option);
      });
      
      elements.readButton.disabled = true;
      
    } catch (error) {
      console.error('Erro ao mostrar volumes:', error);
      alert(error.message);
      elements.backButton.click();
    }
  }

  elements.backButton.addEventListener('click', () => {
    elements.volumeSelector.style.display = 'none';
    elements.mangaList.style.display = 'grid';
  });

  elements.volumeDropdown.addEventListener('change', function() {
    elements.readButton.disabled = this.value === '';
  });

  elements.readButton.addEventListener('click', function() {
    const volumeIndex = elements.volumeDropdown.value;
    if (volumeIndex === '') return;
    loadVolume(parseInt(volumeIndex));
  });

  async function loadVolume(volumeIndex, pageIndex = 0) {
    try {
      showLoading(true);
      
      state.currentVolumeIndex = volumeIndex;
      state.currentVolume = state.currentManga.volumes[volumeIndex];
      state.currentPages = state.currentVolume.pages;
      state.currentPageIndex = pageIndex;
      state.isDoublePage = elements.doublePageMode.checked;
      state.pageImages = [];
      
      elements.volumeTitle.textContent = state.currentVolume.title;
      
      elements.viewerVolumeDropdown.innerHTML = '';
      state.currentManga.volumes.forEach((volume, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = volume.title;
        option.selected = index === volumeIndex;
        elements.viewerVolumeDropdown.appendChild(option);
      });
      
      updatePageDropdown();
      elements.viewer.style.display = 'flex';
      await preloadImages();
      renderPages();
      
    } catch (error) {
      console.error('Erro ao carregar volume:', error);
      alert(error.message);
    } finally {
      showLoading(false);
    }
  }

  async function preloadImages() {
    const promises = state.currentPages.map((src, index) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          state.pageImages[index] = img;
          resolve();
        };
        img.onerror = () => {
          const defaultImg = new Image();
          defaultImg.src = 'images/default-page.jpg';
          state.pageImages[index] = defaultImg;
          resolve();
        };
      });
    });
    await Promise.all(promises);
  }

  function updatePageDropdown() {
    elements.pageDropdown.innerHTML = '';
    for (let i = 0; i < state.currentPages.length; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i + 1;
      option.selected = i === state.currentPageIndex;
      elements.pageDropdown.appendChild(option);
    }
    elements.totalPages.textContent = `/ ${state.currentPages.length}`;
  }

  function shouldShowSinglePage(index) {
    if (!state.pageImages[index]) return true;
    const img = state.pageImages[index];
    return img.width > img.height;
  }

  function renderPages() {
    elements.pagesContainer.innerHTML = '';
    
    if (state.isDoublePage) {
      const currentShouldBeSingle = shouldShowSinglePage(state.currentPageIndex);
      const nextShouldBeSingle = state.currentPageIndex + 1 < state.currentPages.length ? 
        shouldShowSinglePage(state.currentPageIndex + 1) : true;
      
      if (currentShouldBeSingle || nextShouldBeSingle) {
        const page = createPageElement(state.currentPages[state.currentPageIndex]);
        page.classList.add('single-page');
        elements.pagesContainer.appendChild(page);
      } else {
        const spread = document.createElement('div');
        spread.className = 'page-spread';
        
        const rightPageIndex = state.currentPageIndex;
        if (rightPageIndex < state.currentPages.length) {
          const rightPage = createPageElement(state.currentPages[rightPageIndex]);
          spread.appendChild(rightPage);
        }
        
        const leftPageIndex = state.currentPageIndex + 1;
        if (leftPageIndex < state.currentPages.length) {
          const leftPage = createPageElement(state.currentPages[leftPageIndex]);
          spread.appendChild(leftPage);
        }
        
        elements.pagesContainer.appendChild(spread);
      }
    } else {
      const page = createPageElement(state.currentPages[state.currentPageIndex]);
      page.classList.add('single-page');
      elements.pagesContainer.appendChild(page);
    }
    
    updatePageDropdown();
  }

  function createPageElement(src) {
    const img = document.createElement('img');
    img.src = src;
    img.className = 'page';
    img.loading = 'eager';
    img.onerror = function() { this.src = 'images/default-page.jpg' };
    
    img.addEventListener('click', (e) => {
      const rect = img.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const isLeftClick = clickX < rect.width / 2;
      navigatePages(isLeftClick ? 1 : -1);
    });
    
    return img;
  }

  function navigatePages(direction) {
    // Tentativa de mudar de volume se necessário
    if (direction === 1 && isLastPage() && !isLastVolume()) {
      loadNextVolume();
      return;
    } else if (direction === -1 && isFirstPage() && !isFirstVolume()) {
      loadPreviousVolume();
      return;
    }

    // Navegação normal entre páginas
    if (state.isDoublePage) {
      const currentShouldBeSingle = shouldShowSinglePage(state.currentPageIndex);
      const nextShouldBeSingle = state.currentPageIndex + 1 < state.currentPages.length ? 
        shouldShowSinglePage(state.currentPageIndex + 1) : true;
      
      if (currentShouldBeSingle || nextShouldBeSingle) {
        state.currentPageIndex = Math.max(0, Math.min(
          state.currentPageIndex + direction,
          state.currentPages.length - 1
        ));
      } else {
        state.currentPageIndex = Math.max(0, Math.min(
          state.currentPageIndex + (direction * 2),
          state.currentPages.length - 1
        ));
      }
    } else {
      state.currentPageIndex = Math.max(0, Math.min(
        state.currentPageIndex + direction,
        state.currentPages.length - 1
      ));
    }
    renderPages();
  }

  function isFirstPage() {
    return state.currentPageIndex === 0;
  }

  function isLastPage() {
    if (state.isDoublePage) {
      const currentShouldBeSingle = shouldShowSinglePage(state.currentPageIndex);
      const nextShouldBeSingle = state.currentPageIndex + 1 < state.currentPages.length ? 
        shouldShowSinglePage(state.currentPageIndex + 1) : true;
      
      if (currentShouldBeSingle || nextShouldBeSingle) {
        return state.currentPageIndex >= state.currentPages.length - 1;
      } else {
        return state.currentPageIndex >= state.currentPages.length - 2;
      }
    } else {
      return state.currentPageIndex >= state.currentPages.length - 1;
    }
  }

  function isFirstVolume() {
    return state.currentVolumeIndex === 0;
  }

  function isLastVolume() {
    return state.currentVolumeIndex >= state.currentManga.volumes.length - 1;
  }

  function loadNextVolume() {
    if (!isLastVolume()) {
      loadVolume(state.currentVolumeIndex + 1, 0);
    }
  }

  function loadPreviousVolume() {
    if (!isFirstVolume()) {
      const prevVolumeIndex = state.currentVolumeIndex - 1;
      const prevVolume = state.currentManga.volumes[prevVolumeIndex];
      const lastPageIndex = prevVolume.pages.length - 1;
      
      // Se for double page, ajusta para começar no par correto
      let startPageIndex = lastPageIndex;
      if (state.isDoublePage && lastPageIndex > 0) {
        startPageIndex = lastPageIndex % 2 === 0 ? lastPageIndex - 1 : lastPageIndex;
      }
      
      loadVolume(prevVolumeIndex, startPageIndex);
    }
  }

  elements.prevBtn.addEventListener('click', () => navigatePages(-1));
  elements.nextBtn.addEventListener('click', () => navigatePages(1));

  elements.pageDropdown.addEventListener('change', function() {
    state.currentPageIndex = parseInt(this.value);
    renderPages();
  });

  elements.viewerVolumeDropdown.addEventListener('change', function() {
    const newVolumeIndex = parseInt(this.value);
    if (newVolumeIndex !== state.currentVolumeIndex) {
      loadVolume(newVolumeIndex);
    }
  });

  elements.doublePageMode.addEventListener('change', function() {
    state.isDoublePage = this.checked;
    renderPages();
  });

  elements.closeViewer.addEventListener('click', function() {
    elements.viewer.style.display = 'none';
  });

  document.addEventListener('keydown', function(e) {
    if (elements.viewer.style.display === 'flex' && !state.isLoading) {
      if (e.key === 'ArrowLeft') elements.nextBtn.click();
      else if (e.key === 'ArrowRight') elements.prevBtn.click();
      else if (e.key === 'Escape') elements.closeViewer.click();
    }
  });

  init();
});