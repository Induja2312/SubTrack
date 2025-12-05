// Set the base URL for your API
const apiBase = "http://localhost:5000/api";
let chartInstance = null; // This will hold our chart object

/**
 * Gets the JWT token from local storage.
 */
function getToken() { 
  return localStorage.getItem("token"); 
}

/**
 * A helper function to make authenticated requests.
 * It automatically adds the 'Authorization' header.
 */
function authFetch(url, opts = {}) {
  opts.headers = opts.headers || {};
  const token = getToken();
  if (token) {
    opts.headers["Authorization"] = `Bearer ${token}`;
  }
  opts.headers["Content-Type"] = opts.headers["Content-Type"] || "application/json";
  return fetch(url, opts);
}

/**
 * Handles the logout button click.
 * Clears local storage and redirects to the login page.
 */
document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  // Redirect to the new login page
  window.location.href = "login.html"; 
};

/**
 * Handles the submission of the "Add Subscription" form.
 */
document.getElementById("subForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const newSub = {
    name: document.getElementById("name").value,
    cost: Number(document.getElementById("cost").value),
    category: document.getElementById("category").value,
    renewalDate: document.getElementById("renewalDate").value,
    currency: document.getElementById("currency").value || "INR",
  };

  const res = await authFetch(`${apiBase}/subscriptions`, {
    method: "POST",
    body: JSON.stringify(newSub),
  });

  if (res.ok) {
    e.target.reset(); // Clear the form
    await loadSubscriptions(); // Refresh the table
    await loadBudget(); // Refresh the budget
  } else {
    const d = await res.json();
    alert(d.message || "Failed to add subscription");
  }
});

/**
 * Deletes a subscription by its ID.
 * This function is called from an onclick button in the table.
 */
async function deleteSub(id) {
  // Use a simple confirmation
  if (!confirm("Are you sure you want to delete this subscription?")) {
    return;
  }
  
  const res = await authFetch(`${apiBase}/subscriptions/${id}`, { method: "DELETE" });
  if (res.ok) {
    await loadSubscriptions(); // Refresh the table
    await loadBudget(); // Refresh the budget
  } else {
    const d = await res.json();
    alert(d.message || "Delete failed");
  }
}
window.deleteSub = deleteSub; // Make it globally accessible for onclick

/**
 * Fetches subscriptions from the API and populates the tiles.
 */
async function loadSubscriptions() {
  const res = await authFetch(`${apiBase}/subscriptions`);
  if (!res.ok) {
    // If the token is bad or expired, redirect to login
    window.location.href = "login.html";
    return;
  }
  const subs = await res.json();
  const tilesContainer = document.querySelector("#subscription-tiles");
  tilesContainer.innerHTML = ""; // Clear the tiles

  subs.forEach((s, index) => {
    const tile = document.createElement("div");
    tile.style.animationDelay = `${index * 0.1}s`;
    tile.classList.add('animate-fade-in-up');
    const isSubscription = s.renewalDate && s.renewalDate.trim() !== '';
    const typeIcon = isSubscription ? '🔄' : '💸';
    const typeLabel = isSubscription ? 'Subscription' : 'One-time Expense';
    
    tile.innerHTML = `
      <div class="p-4 rounded-lg border transition-all duration-300 hover:shadow-lg hover:transform hover:scale-105" style="background-color: var(--beige-light); border-color: var(--border);">
        <div class="flex justify-between items-start mb-2">
          <div class="flex items-center gap-2">
            <span class="text-lg">${typeIcon}</span>
            <h3 class="font-semibold text-lg" style="color: var(--brown-dark);">${s.name}</h3>
          </div>
          <span class="font-bold text-xl" style="color: var(--brown-medium);">${s.currency || 'INR'} ${s.cost.toFixed(2)}</span>
        </div>
        <div class="mb-3">
          <p class="text-sm" style="color: var(--brown-text);">Category: ${s.category || "Other"}</p>
          <p class="text-sm" style="color: var(--brown-text);">Type: ${typeLabel}</p>
          ${isSubscription ? `<p class="text-sm" style="color: var(--brown-text);">Next Renewal: ${s.renewalDate.split('T')[0]}</p>` : ''}
        </div>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm animate-pulse-hover" onclick="openEditModal('${s._id}')">Edit</button>
          <button class="btn btn-error btn-sm animate-pulse-hover" onclick="deleteSub('${s._id}')">Delete</button>
        </div>
      </div>
    `;
    tilesContainer.appendChild(tile);
  });

  updateExpiringSoon(subs); // Update expiring subscriptions
}

/**
 * Handles the submission of the "Set Budget" form.
 */
document.getElementById("budgetForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const budget = Number(document.getElementById("budgetInput").value);
  const res = await authFetch(`${apiBase}/user/budget`, {
    method: "PUT",
    body: JSON.stringify({ budget }),
  });

  if (res.ok) {
    await loadBudget(); // Refresh the budget display
  } else {
    const d = await res.json();
    alert(d.message || "Failed to set budget");
  }
});

/**
 * Fetches the user's budget and spending summary.
 * Updates the budget progress bar and text.
 */
async function loadBudget() {
  const res = await authFetch(`${apiBase}/user/summary/monthly`);
  if (!res.ok) return;
  const { total, byCategory, budget } = await res.json();
  const remaining = (budget || 0) - (total || 0);
  const usedPercent = budget ? Math.min(100, Math.round((total / budget) * 100)) : 0;

  const bar = document.getElementById("budgetBar");
  
  // Update the progress bar width and color
  bar.style.width = `${usedPercent}%`;
  
  // Set color based on usage
  if (usedPercent < 50) {
    bar.style.backgroundColor = "var(--brown-medium)";
  } else if (usedPercent < 75) {
    bar.style.backgroundColor = "#C65D07"; // Terracotta
  } else if (usedPercent < 100) {
    bar.style.backgroundColor = "#D4A5A5"; // Dusty Rose
  } else {
    bar.style.backgroundColor = "#8B4513"; // Dark red-brown
  }

  // Update text elements
  document.getElementById("budgetAmount").textContent = `₹${(budget||0).toFixed(2)}`;
  document.getElementById("spentAmount").textContent = `₹${(total||0).toFixed(2)}`;
  document.getElementById("remainingAmount").textContent = `₹${remaining.toFixed(2)}`;
  document.getElementById("progressPercent").textContent = `${usedPercent}%`;
}

/**
 * Updates the expiring soon subscriptions list.
 */
function updateExpiringSoon(subs) {
  const expiringSoonList = document.getElementById('expiringSoonList');
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const expiringSubs = subs.filter(sub => {
    if (!sub.renewalDate) return false;
    const renewalDate = new Date(sub.renewalDate);
    return renewalDate >= today && renewalDate <= nextWeek;
  });

  if (expiringSubs.length === 0) {
    expiringSoonList.innerHTML = '<div class="text-sm animate-fade-in-up" style="color: var(--brown-text);">No renewals due soon</div>';
  } else {
    expiringSoonList.innerHTML = expiringSubs.map((sub, index) => `
      <div class="p-2 rounded animate-fade-in-up" style="background-color: var(--beige-light); border: 1px solid var(--border); animation-delay: ${index * 0.1}s;">
        <div class="font-medium">${sub.name}</div>
        <div class="text-sm" style="color: var(--brown-text);">Renews: ${sub.renewalDate.split('T')[0]}</div>
      </div>
    `).join('');
  }
}



// --- EDIT MODAL LOGIC (New Feature) ---

/**
 * Opens the edit modal and populates it with subscription data.
 */
async function openEditModal(id) {
  // Fetch the latest data for this specific sub
  const res = await authFetch(`${apiBase}/subscriptions`);
  const subs = await res.json();
  const sub = subs.find(s => s._id === id);

  if (!sub) {
    alert("Could not find subscription data");
    return;
  }

  // Populate the edit form
  document.getElementById("editId").value = sub._id;
  document.getElementById("editName").value = sub.name;
  document.getElementById("editCost").value = sub.cost;
  document.getElementById("editCategory").value = sub.category || "";
  document.getElementById("editRenewalDate").value = sub.renewalDate ? sub.renewalDate.split('T')[0] : "";
  document.getElementById("editCurrency").value = sub.currency || "INR";

  // Show the modal
  document.getElementById("editModal").showModal();
}
window.openEditModal = openEditModal; // Make it globally accessible for onclick

/**
 * Handles the submission of the "Edit" form.
 */
document.getElementById("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("editId").value;
  
  const updatedSub = {
    name: document.getElementById("editName").value,
    cost: Number(document.getElementById("editCost").value),
    category: document.getElementById("editCategory").value,
    renewalDate: document.getElementById("editRenewalDate").value,
    currency: document.getElementById("editCurrency").value,
  };

  const res = await authFetch(`${apiBase}/subscriptions/${id}`, {
    method: "PUT",
    body: JSON.stringify(updatedSub),
  });

  if (res.ok) {
    document.getElementById("editModal").close();
    await loadSubscriptions(); // Refresh the table
    await loadBudget(); // Refresh the budget
  } else {
    alert("Failed to update subscription");
  }
});

/**
 * This is the "Auth Guard" for the page.
 * It runs on load, checks for a token, and either loads the app
 * or redirects to the login page.
 */
(async function init() {
  const token = getToken();
  if (token) {
    // If we have a token, show the app and load data
    document.getElementById("app").style.display = "block"; // This un-hides the app
    document.getElementById("logoutBtn").classList.remove("hidden"); // Show the logout button
    await loadSubscriptions();
    await loadBudget();
  } else {
    // NO token, redirect to login page
    window.location.href = "login.html";
  }
})();