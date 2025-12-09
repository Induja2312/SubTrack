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

// Get AI recommendations
async function getAIRecommendations(subscriptions) {
  try {
    console.log('Sending AI request with subscriptions:', subscriptions.length);
    
    const response = await authFetch(`${apiBase}/ai/recommendations`, {
      method: 'POST',
      body: JSON.stringify({ 
        subscriptions,
        region: 'India'
      })
    });
    
    console.log('AI Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Failed to get AI recommendations');
    }
    
    const result = await response.json();
    console.log('AI Response received:', result);
    return result;
  } catch (error) {
    console.error('AI recommendation error:', error);
    throw error;
  }
}

function updateFunStats(data) {
  const { total, byCategory } = data;
  const statsContainer = document.getElementById('fun-stats');
  
  if (!byCategory || Object.keys(byCategory).length === 0) {
    return;
  }
  
  const categories = Object.entries(byCategory);
  const [topCategory, topAmount] = categories.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );
  
  const avgPerSub = total / categories.length;
  
  statsContainer.innerHTML = `
    <div class="text-center p-3 rounded" style="background-color: var(--beige-light); border: 1px solid var(--border);">
      <div class="text-2xl mb-1">💸</div>
      <div class="font-bold text-sm" style="color: var(--brown-dark);">₹${total.toFixed(0)}</div>
      <div class="text-xs" style="color: var(--brown-text);">Total Monthly</div>
    </div>
    <div class="text-center p-3 rounded" style="background-color: var(--beige-light); border: 1px solid var(--border);">
      <div class="text-2xl mb-1">🏆</div>
      <div class="font-bold text-xs" style="color: var(--brown-dark);">${topCategory.substring(0, 8)}</div>
      <div class="text-xs" style="color: var(--brown-text);">Top Category</div>
    </div>
    <div class="text-center p-3 rounded" style="background-color: var(--beige-light); border: 1px solid var(--border);">
      <div class="text-2xl mb-1">📊</div>
      <div class="font-bold text-sm" style="color: var(--brown-dark);">₹${avgPerSub.toFixed(0)}</div>
      <div class="text-xs" style="color: var(--brown-text);">Average Cost</div>
    </div>
    <div class="text-center p-3 rounded" style="background-color: var(--beige-light); border: 1px solid var(--border);">
      <div class="text-2xl mb-1">📈</div>
      <div class="font-bold text-sm" style="color: var(--brown-dark);">${categories.length}</div>
      <div class="text-xs" style="color: var(--brown-text);">Categories</div>
    </div>
  `;
}

function displayAIRecommendations(recommendations) {
  const adviceBox = document.getElementById("advice-message");
  
  if (!recommendations || !recommendations.analysis) {
    adviceBox.innerHTML = '<div class="text-center"><div class="text-3xl mb-2">🤖</div><p style="color: var(--brown-text);">AI couldn\'t analyze your subscriptions. Try again!</p></div>';
    return;
  }

  const { analysis } = recommendations;
  
  adviceBox.innerHTML = `
    <div class="space-y-4">
      <!-- Savings Summary -->
      <div class="text-center p-4 rounded" style="background-color: var(--brown-medium); color: white;">
        <div class="text-2xl mb-2">💰</div>
        <div class="font-bold text-lg">Potential Monthly Savings</div>
        <div class="text-3xl font-bold">₹${analysis.totalSavings || 0}</div>
      </div>
      
      <!-- Recommendations Grid -->
      <div class="grid grid-cols-2 gap-3">
        ${analysis.alternatives && analysis.alternatives.length > 0 ? analysis.alternatives.slice(0, 2).map(alt => `
          <div class="p-3 rounded" style="background-color: var(--beige-light); border: 1px solid var(--border);">
            <div class="text-lg mb-2">🔄</div>
            <div class="font-semibold text-sm mb-1">${alt.current}</div>
            <div class="text-xs mb-2" style="color: var(--brown-text);">Switch to ${alt.alternative}</div>
            <div class="font-bold text-sm" style="color: var(--brown-medium);">Save ₹${alt.savings}/month</div>
          </div>
        `).join('') : ''}
        
        ${analysis.discounts && analysis.discounts.length > 0 ? analysis.discounts.slice(0, 2).map(discount => `
          <div class="p-3 rounded" style="background-color: var(--beige-light); border: 1px solid var(--border);">
            <div class="text-lg mb-2">🏷️</div>
            <div class="font-semibold text-sm mb-1">${discount.service}</div>
            <div class="text-xs mb-2" style="color: var(--brown-text);">${discount.offer}</div>
            <div class="font-bold text-sm" style="color: var(--brown-medium);">Save ₹${discount.savings}/month</div>
          </div>
        `).join('') : ''}
      </div>
      
      ${analysis.redundant && analysis.redundant.length > 0 ? `
        <div class="p-3 rounded" style="background-color: #ffebee; border: 1px solid #f44336;">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">⚠️</span>
            <span class="font-semibold text-sm">Redundant Subscriptions Found</span>
          </div>
          <div class="text-xs" style="color: #666;">${analysis.redundant[0].services.join(' + ')} - ${analysis.redundant[0].reason}</div>
        </div>
      ` : ''}
      
      ${analysis.advice ? `
        <div class="p-3 rounded" style="background-color: var(--beige-light); border: 1px solid var(--border);">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">💡</span>
            <span class="font-semibold text-sm">AI Recommendation</span>
          </div>
          <p class="text-xs" style="color: var(--brown-dark);">${analysis.advice.substring(0, 150)}${analysis.advice.length > 150 ? '...' : ''}</p>
        </div>
      ` : ''}
    </div>
  `;
  
  adviceBox.classList.remove('animate-jiggle', 'animate-tada');
  adviceBox.classList.add('animate-tada');
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
  button.textContent = "🤖 AI is analyzing your subscriptions...";
  adviceBox.innerHTML = '<div class="text-center"><div class="text-3xl mb-2">🧠</div><p style="color: var(--brown-text);">Getting personalized recommendations...</p></div>';

  try {
    // Get user subscriptions
    const subsRes = await authFetch(`${apiBase}/subscriptions`);
    if (!subsRes.ok) throw new Error("Failed to fetch subscriptions");
    
    const subscriptions = await subsRes.json();
    
    if (subscriptions.length === 0) {
      adviceBox.innerHTML = '<div class="text-center"><div class="text-3xl mb-2">📝</div><p style="color: var(--brown-text);">Add some subscriptions first to get AI recommendations!</p></div>';
      button.disabled = false;
      button.textContent = '✨ Get AI Advice ✨';
      return;
    }
    
    // Get AI recommendations
    const aiRecommendations = await getAIRecommendations(subscriptions);
    
    // Update stats
    const summaryRes = await authFetch(`${apiBase}/user/summary/monthly`);
    if (summaryRes.ok) {
      const data = await summaryRes.json();
      updateFunStats(data);
    }
    
    // Display AI recommendations
    displayAIRecommendations(aiRecommendations);
    
    button.disabled = false;
    button.textContent = '🔄 Get Fresh AI Advice';
    
  } catch (error) {
    console.error('Error:', error);
    const errorMsg = error.message || 'AI is taking a coffee break! Try again in a moment.';
    adviceBox.innerHTML = `<div class="text-center"><div class="text-3xl mb-2">⚠️</div><p style="color: var(--brown-text);">${errorMsg}</p></div>`;
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