const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

function getModel() {
  if (!genAI) throw new Error('GEMINI_API_KEY is not set');
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

async function analyzeVehicleRisk(vehicleData) {
  if (!genAI) {
    return {
      riskScore: vehicleData.riskScore ?? 0,
      suggestion: 'Configure GEMINI_API_KEY for AI analysis. Using stored risk score.',
      financialImpact: 'N/A',
    };
  }
  const vehicleJson = JSON.stringify(vehicleData, null, 2);
  const prompt = `Analyze this fleet vehicle data and return ONLY valid JSON with no markdown or code fences:
${vehicleJson}

Return exactly this structure:
{
  "riskScore": number (0-100),
  "suggestion": string (one short recommendation),
  "financialImpact": string (one short sentence)
}`;
  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response?.text?.() || '{}';
    const cleaned = text.replace(/```json?\s*|\s*```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    return {
      riskScore: vehicleData.riskScore ?? 0,
      suggestion: err.message || 'Analysis failed',
      financialImpact: 'N/A',
    };
  }
}

async function generateFinancialAdvice(fleetData) {
  if (!genAI) {
    return {
      summary: 'Configure GEMINI_API_KEY for AI financial advice.',
      recommendations: [],
    };
  }
  const dataStr = JSON.stringify(
    { vehicles: fleetData.vehicles?.length, trips: fleetData.trips?.length, sample: fleetData.vehicles?.slice(0, 3) },
    null,
 2);
  const prompt = `Based on this fleet data summary, return ONLY valid JSON:
${dataStr}

Return:
{
  "summary": "2-3 sentence financial summary",
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;
  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response?.text?.() || '{}';
    const cleaned = text.replace(/```json?\s*|\s*```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    return { summary: err.message || 'Failed', recommendations: [] };
  }
}

async function naturalLanguageQuery(queryText, fleetData) {
  if (!genAI) {
    return { answer: 'Configure GEMINI_API_KEY for natural language queries.' };
  }
  
  // Safely stringify the full fleetData to pass to Gemini
  // To avoid huge payloads, if data grows extremely large, consider truncating or summarizing,
  // but for the user's request, provide the full structured database data to Gemini.
  const dataStr = JSON.stringify(fleetData, null, 2);
  
  const prompt = `You are an AI assistant for a fleet management system.
Your ONLY source of knowledge is the following JSON database export:

=== DATABASE CONTEXT START ===
${dataStr}
=== DATABASE CONTEXT END ===

Instructions:
1. Answer the user's question using ONLY the data provided in the DATABASE CONTEXT above.
2. If the user's question cannot be answered using this data, respond explicitly with: "I do not have enough information in the database to answer this question." Do not guess or use outside knowledge.
3. Be helpful, concise, and format your output as a single, clear paragraph or simple list unless requested otherwise.

User question: ${queryText}`;
  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const answer = result.response?.text?.() || 'No response';
    return { answer };
  } catch (err) {
    return { answer: err.message || 'Query failed' };
  }
}

module.exports = {
  analyzeVehicleRisk,
  generateFinancialAdvice,
  naturalLanguageQuery,
};
