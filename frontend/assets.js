const apiBase = "http://localhost:5000/api";

function getToken() { 
  return localStorage.getItem("token"); 
}

function authFetch(url, opts = {}) {
  opts.headers = opts.headers || {};
  const token = getToken();
  if (token) {
    opts.headers["Authorization"] = `Bearer ${token}`;
  }
  opts.headers["Content-Type"] = opts.headers["Content-Type"] || "application/json";
  return fetch(url, opts);
}

// Mock asset storage (in real app, this would be backend API)
let assets = JSON.parse(localStorage.getItem('assets') || '[]');

function saveAssets() {
  localStorage.setItem('assets', JSON.stringify(assets));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getAssetIcon(type) {
  const icons = {
    'Cash': '💰',
    'Investment': '📈',
    'Property': '🏠',
    'Vehicle': '🚗',
    'Other': '📦'
  };
  return icons[type] || '📦';
}

function loadAssets() {
  const tilesContainer = document.getElementById("asset-tiles");
  tilesContainer.innerHTML = "";

  if (assets.length === 0) {
    tilesContainer.innerHTML = `
      <div class="col-span-full text-center p-8" style="color: var(--brown-text);">
        <div class="text-4xl mb-2">💎</div>
        <p>No assets added yet. Start building your portfolio!</p>
      </div>
    `;
    updateAssetSummary();
    return;
  }

  assets.forEach((asset, index) => {
    const tile = document.createElement("div");
    tile.style.animationDelay = `${index * 0.1}s`;
    tile.classList.add('animate-fade-in-up');
    
    tile.innerHTML = `
      <div class="p-4 rounded-lg border transition-all duration-300 hover:shadow-lg hover:transform hover:scale-105" style="background-color: var(--beige-light); border-color: var(--border);">
        <div class="flex justify-between items-start mb-2">
          <div class="flex items-center gap-2">
            <span class="text-lg">${getAssetIcon(asset.type)}</span>
            <h3 class="font-semibold text-lg" style="color: var(--brown-dark);">${asset.name}</h3>
          </div>
          <span class="font-bold text-xl" style="color: var(--brown-medium);">${asset.currency || 'INR'} ${asset.value.toFixed(2)}</span>
        </div>
        <div class="mb-3">
          <p class="text-sm" style="color: var(--brown-text);">Type: ${asset.type}</p>
          <p class="text-sm" style="color: var(--brown-text);">Added: ${new Date(asset.createdAt).toLocaleDateString()}</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm" onclick="openEditAssetModal('${asset.id}')">Edit</button>
          <button class="btn btn-error btn-sm" onclick="deleteAsset('${asset.id}')">Delete</button>
        </div>
      </div>
    `;
    tilesContainer.appendChild(tile);
  });

  updateAssetSummary();
}

function updateAssetSummary() {
  const total = assets.reduce((sum, asset) => sum + asset.value, 0);
  document.getElementById("totalAssets").textContent = `₹${total.toFixed(2)}`;

  const breakdown = {};
  assets.forEach(asset => {
    breakdown[asset.type] = (breakdown[asset.type] || 0) + asset.value;
  });

  const breakdownContainer = document.getElementById("assetBreakdown");
  if (Object.keys(breakdown).length === 0) {
    breakdownContainer.innerHTML = `
      <div class="text-center" style="color: var(--brown-text);">
        <div class="text-2xl mb-2">📊</div>
        <p>Add assets to see breakdown</p>
      </div>
    `;
  } else {
    breakdownContainer.innerHTML = Object.entries(breakdown).map(([type, value]) => `
      <div class="flex justify-between items-center p-2 rounded" style="background-color: var(--beige-light);">
        <span class="text-sm flex items-center gap-1">
          ${getAssetIcon(type)} ${type}
        </span>
        <span class="font-semibold">₹${value.toFixed(2)}</span>
      </div>
    `).join('');
  }
}

document.getElementById("assetForm").addEventListener("submit", (e) => {
  e.preventDefault();
  
  const newAsset = {
    id: generateId(),
    name: document.getElementById("assetName").value,
    value: Number(document.getElementById("assetValue").value),
    type: document.getElementById("assetType").value,
    currency: document.getElementById("assetCurrency").value || "INR",
    createdAt: new Date().toISOString()
  };

  assets.push(newAsset);
  saveAssets();
  e.target.reset();
  loadAssets();
});

function openEditAssetModal(id) {
  const asset = assets.find(a => a.id === id);
  if (!asset) return;

  document.getElementById("editAssetId").value = asset.id;
  document.getElementById("editAssetName").value = asset.name;
  document.getElementById("editAssetValue").value = asset.value;
  document.getElementById("editAssetType").value = asset.type;
  document.getElementById("editAssetCurrency").value = asset.currency;

  document.getElementById("editAssetModal").showModal();
}

document.getElementById("editAssetForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("editAssetId").value;
  
  const assetIndex = assets.findIndex(a => a.id === id);
  if (assetIndex === -1) return;

  assets[assetIndex] = {
    ...assets[assetIndex],
    name: document.getElementById("editAssetName").value,
    value: Number(document.getElementById("editAssetValue").value),
    type: document.getElementById("editAssetType").value,
    currency: document.getElementById("editAssetCurrency").value
  };

  saveAssets();
  document.getElementById("editAssetModal").close();
  loadAssets();
});

function deleteAsset(id) {
  if (!confirm("Are you sure you want to delete this asset?")) return;
  
  assets = assets.filter(a => a.id !== id);
  saveAssets();
  loadAssets();
}

window.openEditAssetModal = openEditAssetModal;
window.deleteAsset = deleteAsset;

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
};

// Auth guard and initialization
(function() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  loadAssets();
})();