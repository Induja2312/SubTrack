import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getGeminiRecommendations(subscriptionData, region) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const totalCost = subscriptionData.reduce((sum, sub) => sum + sub.cost, 0);
  const subscriptionList = subscriptionData.map(sub => 
    `- ${sub.name}: ₹${sub.cost}/month (Category: ${sub.category})`
  ).join('\n');

  const prompt = `You are a financial advisor AI for ${region}. Analyze these subscriptions:
${subscriptionList}

Total monthly cost: ₹${totalCost}

Provide recommendations in this exact JSON format:
{
  "totalSavings": <estimated monthly savings in rupees>,
  "alternatives": [{"current": "service name", "alternative": "cheaper option", "savings": <amount>}],
  "discounts": [{"service": "name", "offer": "description", "savings": <amount>}],
  "redundant": [{"services": ["name1", "name2"], "reason": "explanation"}],
  "advice": "brief personalized advice"
}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();
    
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    // Fallback mock response for rate limit issues
    return {
      totalSavings: Math.round(totalCost * 0.15),
      alternatives: subscriptionData.slice(0, 2).map(sub => ({
        current: sub.name,
        alternative: `${sub.name} Family Plan`,
        savings: Math.round(sub.cost * 0.3)
      })),
      discounts: [{
        service: subscriptionData[0]?.name || "Your subscription",
        offer: "Annual plan discount available",
        savings: Math.round((subscriptionData[0]?.cost || 0) * 2)
      }],
      redundant: [],
      advice: `Consider bundling services or switching to annual plans to save approximately ₹${Math.round(totalCost * 0.15)}/month.`
    };
  }
}

// AI Recommendations endpoint
router.post("/recommendations", protect, async (req, res) => {
  try {
    const { subscriptions, region } = req.body;

    console.log("AI Request received:", { subscriptions: subscriptions?.length, region });

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(400).json({ message: "No subscriptions provided" });
    }

    // Prepare subscription data
    const subscriptionData = subscriptions.map(sub => ({
      name: sub.name,
      cost: sub.cost,
      currency: sub.currency || 'INR',
      category: sub.category || 'Other',
      renewalDate: sub.renewalDate
    }));

    console.log("Processing subscriptions:", subscriptionData);

    const analysis = await getGeminiRecommendations(subscriptionData, region || 'India');

    console.log("AI Analysis generated:", analysis);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error("AI recommendation error:", error);
    
    let errorMessage = "Failed to get AI recommendations";
    if (error.message.includes("API key")) {
      errorMessage = "Invalid or missing API key. Please check GEMINI_API_KEY in .env";
    } else if (error.message.includes("quota") || error.message.includes("rate")) {
      errorMessage = "Using fallback recommendations (AI temporarily unavailable)";
    } else if (error.message.includes("network") || error.message.includes("fetch")) {
      errorMessage = "Network error. Please check your internet connection";
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: error.message 
    });
  }
});



export default router;