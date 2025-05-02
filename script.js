document.addEventListener("DOMContentLoaded", function() {
  const mangaList = document.getElementById("mangaList");
  const volumeList = document.getElementById("volumeList");
  const volumesContainer = document.getElementById("volumesContainer");
  const backButton = document.getElementById("backButton");
  const volumeListTitle = document.getElementById("volumeListTitle");

  let currentManga = null;

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

  // Abrir um volume (ZIP)
  function openVolume(volume) {
  fetch(volume.zip)
    .then(response => response.blob())
    .then(blob => JSZip.loadAsync(blob))
    .then(zip => {
      const pages = [];
      zip.forEach((path, file) => {
        if (!file.dir && path.match(/\.(jpg|png|webp)$/i)) {
          pages.push(file);
        }
      });
      // Ordene as páginas (ex: page1.jpg, page2.jpg...)
      pages.sort((a, b) => a.name.localeCompare(b.name));
      // Exemplo: exibir nomes das páginas
      alert(`Páginas no ZIP: ${pages.map(p => p.name).join(", ")}`);
      // Aqui você pode criar um visualizador de páginas
    });
}
});