import express from "express";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

// Simple AI simulation for testing
function simulateAI(subscriptions) {
  const totalCost = subscriptions.reduce((sum, sub) => sum + sub.cost, 0);
  
  return {
    totalSavings: Math.floor(totalCost * 0.2), // 20% potential savings
    alternatives: subscriptions.slice(0, 2).map(sub => ({
      current: sub.name,
      alternative: `${sub.name} Student Plan`,
      savings: Math.floor(sub.cost * 0.3)
    })),
    discounts: [
      {
        service: subscriptions[0]?.name || "Netflix",
        offer: "Annual plan - 2 months free",
        savings: Math.floor((subscriptions[0]?.cost || 500) * 0.17)
      }
    ],
    redundant: subscriptions.length > 3 ? [
      {
        services: [subscriptions[0]?.name, subscriptions[1]?.name],
        reason: "Both provide similar entertainment content"
      }
    ] : [],
    advice: `You're spending ₹${totalCost}/month on subscriptions. Consider annual plans and student discounts to save money. Look for free alternatives for services you rarely use.`
  };
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

    // For now, use simulated AI (you can replace this with real Gemini later)
    const analysis = simulateAI(subscriptionData);

    console.log("AI Analysis generated:", analysis);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error("AI recommendation error:", error);
    res.status(500).json({ 
      message: "Failed to get AI recommendations",
      error: error.message 
    });
  }
});

// Real Gemini AI implementation (uncomment when ready to use)
/*
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getRealAIRecommendations(subscriptionData, region) {
  const subscriptionList = subscriptionData.map(sub => 
    `- ${sub.name}: ₹${sub.cost}/month (Category: ${sub.category})`
  ).join('\n');

  const prompt = `You are a financial advisor AI for ${region}. Analyze these subscriptions and provide JSON recommendations:\n${subscriptionList}\n\nReturn JSON with: totalSavings, alternatives[], discounts[], redundant[], advice`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const aiText = response.text();
  
  const jsonMatch = aiText.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : simulateAI(subscriptionData);
}
*/

export default router;