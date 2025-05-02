document.addEventListener("DOMContentLoaded", function() {
  // Elementos da interface
  const mangaList = document.getElementById("mangaList");
  const volumeList = document.getElementById("volumeList");
  const volumesContainer = document.getElementById("volumesContainer");
  const backButton = document.getElementById("backButton");
  const volumeListTitle = document.getElementById("volumeListTitle");
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
    .then(response => response.json())
    .then(data => {
      data.mangas.forEach(manga => {
        const mangaCard = document.createElement("div");
        mangaCard.className = "manga-card";
        mangaCard.innerHTML = `
          <img src="${manga.cover}" alt="${manga.title}" class="manga-cover">
          <div class="manga-info">
            <h3>${manga.title}</h3>
            <p>${manga.author}</p>
          </div>
        `;
        mangaCard.addEventListener("click", () => showVolumes(manga));
        mangaList.appendChild(mangaCard);
      });
    });

  // Mostra volumes de um mangá
  function showVolumes(manga) {
    currentManga = manga;
    mangaList.style.display = "none";
    volumeList.style.display = "block";
    volumeListTitle.textContent = manga.title;
    volumesContainer.innerHTML = "";

    manga.volumes.forEach(volume => {
      const volumeCard = document.createElement("div");
      volumeCard.className = "volume-card";
      volumeCard.innerHTML = `
        <h4>${volume.title}</h4>
      `;
      volumeCard.addEventListener("click", () => openVolume(volume));
      volumesContainer.appendChild(volumeCard);
    });
  }

  // Voltar para a lista de mangás
  backButton.addEventListener("click", () => {
    mangaList.style.display = "flex";
    volumeList.style.display = "none";
  });

  // Fechar visualizador
  closeViewer.addEventListener("click", () => {
    viewer.style.display = "none";
  });

  // Abrir um volume (ZIP)
  async function openVolume(volume) {
    currentVolume = volume;
    viewerTitle.textContent = volume.title;
    
    try {
      const response = await fetch(volume.zip);
      const blob = await response.blob();
      const zip = await JSZip.loadAsync(blob);
      
      currentPages = [];
      const files = [];
      
      // Coletar todos os arquivos de imagem
      zip.forEach((relativePath, file) => {
        if (!file.dir && relativePath.match(/\.(jpg|jpeg|png|webp)$/i)) {
          files.push({
            name: relativePath,
            file: file
          });
        }
      });
      
      // Ordenar páginas numericamente
      files.sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      });
      
      // Extrair URLs das páginas
      for (const item of files) {
        const blob = await item.file.async('blob');
        currentPages.push(URL.createObjectURL(blob));
      }
      
      // Mostrar primeira página
      if (currentPages.length > 0) {
        currentPageIndex = 0;
        showCurrentPage();
        viewer.style.display = "flex";
      } else {
        alert("Nenhuma página encontrada neste volume!");
      }
    } catch (error) {
      console.error("Erro ao carregar volume:", error);
      alert("Erro ao carregar o volume!");
    }
  }

  // Mostrar página atual
  function showCurrentPage() {
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

  // Navegação por teclado
  document.addEventListener("keydown", (e) => {
    if (viewer.style.display === "flex") {
      if (e.key === "ArrowLeft") {
        prevPageBtn.click();
      } else if (e.key === "ArrowRight") {
        nextPageBtn.click();
      } else if (e.key === "Escape") {
        closeViewer.click();
      }
    }
  });
});