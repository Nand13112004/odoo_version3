const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

function getModel() {
  if (!genAI) throw new Error('GEMINI_API_KEY is not set');
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
  const dataStr = JSON.stringify(
    { vehiclesCount: fleetData.vehicles?.length, tripsCount: fleetData.trips?.length },
    null,
 2);
  const prompt = `Fleet data context: ${dataStr}

User question: ${queryText}

Reply in one short paragraph. Be concise.`;
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
