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
    pagesContainer: document.getElementById("pagesContainer"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    pageCounter: document.getElementById("pageCounter"),
    doublePageMode: document.getElementById("doublePageMode")
  };

  // Estado do aplicativo
  const state = {
    mangas: [],
    currentManga: null,
    currentVolume: null,
    currentPages: [],
    currentPageIndex: 0,
    isDoublePage: true
  };

  // Inicialização
  async function init() {
    try {
      showLoading(true);
      
      // Carrega o manifest.json
      const response = await fetch('manifest.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Verifica se a estrutura do manifest está correta
      if (!data.mangas || !Array.isArray(data.mangas)) {
        throw new Error("Estrutura inválida do manifest.json");
      }
      
      state.mangas = data.mangas;
      renderMangaList();
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showError("Falha ao carregar a lista de mangás. Recarregue a página.");
    } finally {
      showLoading(false);
    }
  }

  // Mostra/oculta o loading
  function showLoading(show) {
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
      loadingElement.style.display = show ? 'block' : 'none';
    }
  }

  // Mostra mensagem de erro
  function showError(message) {
    elements.mangaList.innerHTML = `
      <div class="error-message" style="grid-column:1/-1;text-align:center;padding:40px;color:red;">
        ${message}
        <button onclick="window.location.reload()" style="margin-top:10px;">Recarregar</button>
      </div>
    `;
  }

  // Renderiza a lista de mangás
  function renderMangaList() {
    elements.mangaList.innerHTML = '';
    
    if (!state.mangas || state.mangas.length === 0) {
      elements.mangaList.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;">
          Nenhum mangá encontrado no catálogo.
        </div>
      `;
      return;
    }
    
    state.mangas.forEach(manga => {
      // Verifica se o mangá tem a estrutura mínima necessária
      if (!manga.title || !manga.cover || !manga.volumes) {
        console.warn('Mangá com estrutura inválida:', manga);
        return;
      }
      
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

  // Mostra os volumes de um mangá
  function showMangaVolumes(manga) {
    try {
      state.currentManga = manga;
      
      // Verifica se há volumes
      if (!manga.volumes || manga.volumes.length === 0) {
        throw new Error("Este mangá não possui volumes disponíveis");
      }
      
      // Atualiza a UI
      elements.mangaTitle.textContent = manga.title;
      elements.mangaCover.src = manga.cover;
      elements.mangaCover.onerror = () => {
        elements.mangaCover.src = 'images/default-cover.jpg';
      };
      
      elements.volumeSelector.style.display = 'block';
      elements.mangaList.style.display = 'none';
      
      // Preenche o dropdown de volumes
      elements.volumeDropdown.innerHTML = '<option value="">-- Selecionar Volume --</option>';
      manga.volumes.forEach((volume, index) => {
        if (!volume.title || !volume.pages) {
          console.warn('Volume com estrutura inválida:', volume);
          return;
        }
        
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

  // Volta para a lista de mangás
  elements.backButton.addEventListener('click', () => {
    elements.volumeSelector.style.display = 'none';
    elements.mangaList.style.display = 'grid';
  });

  // Habilita o botão de ler quando seleciona um volume
  elements.volumeDropdown.addEventListener('change', function() {
    elements.readButton.disabled = this.value === '';
  });

  // Carrega o volume selecionado
  elements.readButton.addEventListener('click', function() {
    const volumeIndex = elements.volumeDropdown.value;
    if (volumeIndex === '') return;
    
    loadVolume(parseInt(volumeIndex));
  });

  // Carrega um volume específico
  async function loadVolume(volumeIndex) {
    try {
      state.currentVolume = state.currentManga.volumes[volumeIndex];
      
      // Verifica se há páginas
      if (!state.currentVolume.pages || state.currentVolume.pages.length === 0) {
        throw new Error("Este volume não possui páginas disponíveis");
      }
      
      state.currentPages = state.currentVolume.pages;
      state.currentPageIndex = 0;
      state.isDoublePage = elements.doublePageMode.checked;
      
      // Prepara o visualizador
      elements.volumeTitle.textContent = state.currentVolume.title;
      elements.viewer.style.display = 'flex';
      
      // Renderiza as páginas
      renderPages();
      
    } catch (error) {
      console.error('Erro ao carregar volume:', error);
      alert(error.message);
    }
  }

  // Renderiza as páginas no visualizador
  function renderPages() {
    elements.pagesContainer.innerHTML = '';
    
    if (state.isDoublePage) {
      // Modo página dupla (right-to-left)
      const spread = document.createElement('div');
      spread.className = 'page-spread';
      
      // Página da direita (primeira)
      const rightPageIndex = state.currentPageIndex;
      if (rightPageIndex < state.currentPages.length) {
        const rightPage = createPageElement(state.currentPages[rightPageIndex]);
        spread.appendChild(rightPage);
      }
      
      // Página da esquerda (segunda)
      const leftPageIndex = state.currentPageIndex + 1;
      if (leftPageIndex < state.currentPages.length) {
        const leftPage = createPageElement(state.currentPages[leftPageIndex]);
        spread.appendChild(leftPage);
      }
      
      elements.pagesContainer.appendChild(spread);
      elements.pageCounter.textContent = `${rightPageIndex + 1}-${Math.min(leftPageIndex + 1, state.currentPages.length)}/${state.currentPages.length}`;
      
    } else {
      // Modo página única
      const page = createPageElement(state.currentPages[state.currentPageIndex]);
      page.classList.add('single-page');
      elements.pagesContainer.appendChild(page);
      elements.pageCounter.textContent = `${state.currentPageIndex + 1}/${state.currentPages.length}`;
    }
  }

  // Cria um elemento de página com tratamento de erro
  function createPageElement(src) {
    const img = document.createElement('img');
    img.src = src;
    img.className = 'page';
    img.loading = 'eager';
    img.onerror = function() {
      this.src = 'images/default-page.jpg';
      console.error(`Erro ao carregar página: ${src}`);
    };
    return img;
  }

  // Navegação entre páginas
  elements.prevBtn.addEventListener('click', () => {
    if (state.isDoublePage) {
      state.currentPageIndex = Math.max(state.currentPageIndex - 2, 0);
    } else {
      state.currentPageIndex = Math.max(state.currentPageIndex - 1, 0);
    }
    renderPages();
  });

  elements.nextBtn.addEventListener('click', () => {
    if (state.isDoublePage) {
      state.currentPageIndex = Math.min(state.currentPageIndex + 2, state.currentPages.length - 1);
    } else {
      state.currentPageIndex = Math.min(state.currentPageIndex + 1, state.currentPages.length - 1);
    }
    renderPages();
  });

  // Alternar entre modos de página
  elements.doublePageMode.addEventListener('change', function() {
    state.isDoublePage = this.checked;
    renderPages();
  });

  // Fechar visualizador
  elements.closeViewer.addEventListener('click', function() {
    elements.viewer.style.display = 'none';
  });

  // Navegação por teclado (right-to-left)
  document.addEventListener('keydown', function(e) {
    if (elements.viewer.style.display === 'flex') {
      if (e.key === 'ArrowRight') elements.prevBtn.click(); // → Avança
      if (e.key === 'ArrowLeft') elements.nextBtn.click();  // ← Volta
      if (e.key === 'Escape') elements.closeViewer.click();
    }
  });

  // Inicia o aplicativo
  init();
});