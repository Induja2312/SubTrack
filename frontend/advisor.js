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

function updateFunStats(data) {
  const { total, byCategory } = data;
  const statsContainer = document.getElementById('fun-stats');
  
  if (!byCategory || Object.keys(byCategory).length === 0) {
    statsContainer.innerHTML = `
      <div class="text-center p-4" style="color: var(--brown-text);">
        <div class="text-4xl mb-2">😴</div>
        <p>No data to show yet!</p>
      </div>
    `;
    return;
  }
  
  const categories = Object.entries(byCategory);
  const [topCategory, topAmount] = categories.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );
  
  const avgPerSub = total / categories.length;
  
  statsContainer.innerHTML = `
    <div class="space-y-3">
      <div class="text-center p-3 rounded" style="background-color: var(--beige-light); border: 1px solid var(--border);">
        <div class="text-2xl">💸</div>
        <div class="font-bold" style="color: var(--brown-dark);">₹${total.toFixed(2)}</div>
        <div class="text-xs" style="color: var(--brown-text);">Total Monthly</div>
      </div>
      <div class="text-center p-3 rounded" style="background-color: var(--beige-light); border: 1px solid var(--border);">
        <div class="text-2xl">🏆</div>
        <div class="font-bold text-sm" style="color: var(--brown-dark);">${topCategory}</div>
        <div class="text-xs" style="color: var(--brown-text);">Biggest Expense</div>
      </div>
      <div class="text-center p-3 rounded" style="background-color: var(--beige-light); border: 1px solid var(--border);">
        <div class="text-2xl">📊</div>
        <div class="font-bold" style="color: var(--brown-dark);">₹${avgPerSub.toFixed(2)}</div>
        <div class="text-xs" style="color: var(--brown-text);">Avg per Category</div>
      </div>
      <div class="text-center p-3 rounded" style="background-color: var(--beige-light); border: 1px solid var(--border);">
        <div class="text-2xl">📈</div>
        <div class="font-bold" style="color: var(--brown-dark);">${categories.length}</div>
        <div class="text-xs" style="color: var(--brown-text);">Categories</div>
      </div>
    </div>
  `;
}

function getPersonalityAdvice(data) {
  const { total, byCategory } = data;
  
  if (!byCategory || Object.keys(byCategory).length === 0) {
    return "You haven't added any subscriptions yet! Either you're incredibly disciplined or you're living under a rock. 🪨";
  }

  // Find highest spending category
  const categories = Object.entries(byCategory);
  const [highestCategory, highestAmount] = categories.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );

  const percentage = (highestAmount / total) * 100;

  // Fun personality-based advice
  if (highestCategory.toLowerCase().includes('entertainment') && percentage > 50) {
    return `You spent ${percentage.toFixed(1)}% on entertainment... Are you okay? 😅 Maybe it's time to discover the free entertainment called 'going outside'!`;
  }
  
  if (highestCategory.toLowerCase().includes('shopping') && highestAmount > 3000) {
    return `₹${highestAmount.toFixed(2)} on shopping?! Your delivery driver must know you by name. 📦 Consider giving them a Christmas bonus!`;
  }
  
  if (highestCategory.toLowerCase().includes('food') && percentage > 40) {
    return `${percentage.toFixed(1)}% on food subscriptions? You're either a food critic or you've forgotten how to cook. 🍕 Gordon Ramsay is disappointed!`;
  }
  
  if (highestCategory.toLowerCase().includes('music') && highestAmount > 1000) {
    return `₹${highestAmount.toFixed(2)} on music? You must have REALLY good taste... or you're paying for everyone's Spotify! 🎵`;
  }
  
  if (total < 500) {
    return "Wow, you're either incredibly frugal or you're hiding your real subscriptions from me! 🕵️ Either way, your wallet is happy!";
  }
  
  if (total > 10000) {
    return `₹${total.toFixed(2)} in subscriptions?! You're single-handedly keeping the subscription economy alive! 💸 Maybe it's time for a subscription... to a budgeting app?`;
  }
  
  if (categories.length > 8) {
    return `${categories.length} different categories? You're like a subscription collector! 🎯 Do you have a subscription for managing subscriptions yet?`;
  }
  
  // Default advice
  return `Your biggest expense is ${highestCategory} at ₹${highestAmount.toFixed(2)}. Not bad, but remember: money can't buy happiness... but it can buy subscriptions, which is basically the same thing! 😄`;
}

document.getElementById("get-advice-btn").addEventListener("click", async () => {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const button = document.getElementById("get-advice-btn");
  const adviceBox = document.getElementById("advice-message");
  
  // Show loading state
  button.disabled = true;
  button.textContent = "Analyzing your poor choices...";
  adviceBox.innerHTML = '<p style="color: var(--brown-text);">🤔 Crunching the numbers...</p>';

  try {
    const res = await authFetch(`${apiBase}/user/summary/monthly`);
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    
    const data = await res.json();
    const advice = getPersonalityAdvice(data);
    
    // Update fun stats
    updateFunStats(data);
    
    // Show advice with animation
    setTimeout(() => {
      adviceBox.innerHTML = `
        <div class="text-center">
          <div class="text-2xl mb-2">🗣️</div>
          <p class="text-lg font-medium" style="color: var(--brown-dark);">${advice}</p>
        </div>
      `;
      adviceBox.classList.remove('animate-jiggle', 'animate-tada');
      adviceBox.classList.add('animate-tada');
      
      // Reset button
      button.disabled = false;
      button.textContent = '🔄 Get New Advice';
    }, 1000);
    
  } catch (error) {
    adviceBox.innerHTML = '<p style="color: var(--brown-text);">Oops! Something went wrong. Even I can\'t analyze this mess! 😅</p>';
    adviceBox.classList.add('animate-jiggle');
    
    button.disabled = false;
    button.textContent = 'Try Again';
  }
});

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
};

// Auth guard
(function() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
  }
})();