// 🎁 PortHub - script.js

document.addEventListener("DOMContentLoaded", async () => {
  const tabs = document.querySelectorAll(".tab-btn");
  const content = document.getElementById("content");
  const addBtn = document.getElementById("addBtn");
  const balanceLabel = document.getElementById("balance");

  let currentUser = { id: 0, balance: 0 };

  // 🔹 Симуляция Telegram WebApp user
  // (Позже можно заменить на Telegram initData)
  currentUser.id = Math.floor(Math.random() * 99999999);

  async function loadBalance() {
    const res = await fetch(`/api/user/${currentUser.id}`);
    const user = await res.json();
    currentUser = user;
    balanceLabel.textContent = `TON: ${user.balance.toFixed(2)} +`;
  }

  async function loadNFTs() {
    const res = await fetch("/api/nfts");
    const nfts = await res.json();
    content.innerHTML = nfts.map(nft => `
      <div class="nft-card">
        <img src="${nft.image}" alt="${nft.name}" />
        <h3>${nft.name}</h3>
        <p>Цена: ${nft.price.toFixed(2)} TON</p>
        <button onclick="showNFT(${nft.id})">Подробнее</button>
      </div>
    `).join("");
  }

  // Переключение вкладок
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;

      if (tab === "nfts") loadNFTs();
      else if (tab === "mygifts") content.innerHTML = "<h2>🎁 Мои подарки</h2><p>Пока пусто...</p>";
      else if (tab === "terms") content.innerHTML = `
        <h2>📜 Terms</h2>
        <p>Используя PortHub, вы соглашаетесь, что все подарки являются цифровыми NFT-объектами и не подлежат возврату. 
        Проект создан для коллекционирования и развлечения. Все риски пользователь принимает на себя.</p>`;
    });
  });

  addBtn.addEventListener("click", () => {
    alert("🧩 Функция выставления лота скоро будет добавлена!");
  });

  await loadBalance();
  await loadNFTs();
});
