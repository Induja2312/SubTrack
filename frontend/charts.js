const apiBase = "http://localhost:5000/api";
let chartInstance = null;

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

function drawChart(subs) {
  const ctx = document.getElementById("chart").getContext("2d");
  const categories = {};
  subs.forEach((s) => {
    categories[s.category || "Other"] = (categories[s.category || "Other"] || 0) + s.cost;
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);
  const totalSpending = data.reduce((sum, value) => sum + value, 0);
  
  // Update total spending display
  document.getElementById("total-spending").textContent = `₹${totalSpending.toFixed(2)}`;

  if (chartInstance) {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = data;
    chartInstance.update();
  } else {
    chartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels,
        datasets: [{ 
          data,
          backgroundColor: ['#9CAF88', '#D4A5A5', '#C65D07', '#8B8680', '#F7F3E9', '#483C32']
        }]
      },
      options: { 
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const categoryName = chartInstance.data.labels[index];
            showCategoryDetails(categoryName);
          }
        }
      }
    });
  }
}

async function showCategoryDetails(categoryName) {
  const res = await authFetch(`${apiBase}/subscriptions`);
  if (!res.ok) return;
  
  const subs = await res.json();
  const categorySubscriptions = subs.filter(sub => (sub.category || "Other") === categoryName);
  
  const detailsList = document.getElementById("category-details-list");
  
  if (categorySubscriptions.length === 0) {
    detailsList.innerHTML = `<p class="text-sm" style="color: var(--brown-text);">No subscriptions in ${categoryName}</p>`;
    return;
  }
  
  const categoryTotal = categorySubscriptions.reduce((sum, sub) => sum + sub.cost, 0);
  
  detailsList.innerHTML = `
    <div class="mb-4 p-3 rounded text-center" style="background-color: var(--beige-light); border: 2px solid var(--brown-medium);">
      <h3 class="font-bold text-lg" style="color: var(--brown-dark);">🏷️ ${categoryName}</h3>
      <div class="text-xl font-bold" style="color: var(--brown-medium);">₹${categoryTotal.toFixed(2)} total</div>
      <div class="text-sm" style="color: var(--brown-text);">${categorySubscriptions.length} subscription(s)</div>
    </div>
    <div class="space-y-2">
      ${categorySubscriptions.map((sub, index) => `
        <div class="p-3 rounded animate-fade-in-up" style="background-color: var(--beige-light); border: 1px solid var(--border); animation-delay: ${index * 0.1}s;">
          <div class="flex justify-between items-center">
            <div>
              <span class="font-medium" style="color: var(--brown-dark);">${sub.name}</span>
              <div class="text-xs" style="color: var(--brown-text);">Renewal: ${sub.renewalDate ? sub.renewalDate.split('T')[0] : 'Not set'}</div>
            </div>
            <span class="font-bold text-lg" style="color: var(--brown-medium);">₹${sub.cost.toFixed(2)}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function init() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const res = await authFetch(`${apiBase}/subscriptions`);
  if (!res.ok) {
    window.location.href = "login.html";
    return;
  }
  
  const subs = await res.json();
  drawChart(subs);
}

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
};

init();