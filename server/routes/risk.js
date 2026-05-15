const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');
const axios = require('axios');

const OPENWEATHERMAP_KEY = process.env.OPENWEATHERMAP_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Risk calculation per ward
function calculateRiskScore({ reservoirLevel, rainfallMm, reportCount, newsMentions, month }) {
  // Reservoir score: inverted (low level = high risk)
  const reservoirScore = Math.max(0, Math.min(40, Math.round((100 - (reservoirLevel || 60)) * 0.4)));

  // Rainfall score: no rain in 7 days = +20
  const rainfallScore = (rainfallMm || 0) < 1 ? 20 : (rainfallMm < 5 ? 10 : 0);

  // Report score: count × 5, capped at 30
  const reportScore = Math.min(30, (reportCount || 0) * 5);

  // News score: count × 3, capped at 15
  const newsScore = Math.min(15, (newsMentions || 0) * 3);

  // Seasonal score
  let seasonalScore = 0;
  if (month >= 3 && month <= 6) seasonalScore = 15;  // March-June: hot/dry
  else if (month >= 7 && month <= 9) seasonalScore = -10;  // Monsoon

  const total = reservoirScore + rainfallScore + reportScore + newsScore + seasonalScore;
  return Math.max(0, Math.min(100, total));
}

function getRiskLevel(score) {
  if (score <= 25) return 'green';
  if (score <= 50) return 'blue';
  if (score <= 75) return 'orange';
  return 'critical';
}

// Fetch weather data for Bengaluru
async function getWeatherData() {
  if (!OPENWEATHERMAP_KEY) return { rainfall: 0 };
  try {
    const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Bengaluru,IN&appid=${OPENWEATHERMAP_KEY}`);
    const rain = res.data.rain?.['1h'] || res.data.rain?.['3h'] || 0;
    return { rainfall: rain };
  } catch { return { rainfall: 0 }; }
}

// Search news for water scarcity
async function getNewsMentions(wardName) {
  if (!NEWS_API_KEY) return 0;
  try {
    const res = await axios.get(`https://newsapi.org/v2/everything?q=water+scarcity+Bengaluru+${wardName}&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`);
    return res.data.totalResults || 0;
  } catch { return 0; }
}

// Trigger risk recalculation
router.post('/calculate', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.json({ success: true, message: 'Mock mode: no recalculation', mock: true });

    const { data: wards } = await supabaseAdmin.from('wards').select('*');
    if (!wards) return res.status(500).json({ error: 'Could not fetch wards' });

    const weather = await getWeatherData();
    const month = new Date().getMonth() + 1;
    const results = [];

    for (const ward of wards) {
      // Get report count for this ward in last 48 hours
      const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      const { count: reportCount } = await supabaseAdmin.from('user_reports')
        .select('id', { count: 'exact' }).eq('ward_id', ward.id).gte('created_at', since);

      const newsMentions = await getNewsMentions(ward.ward_name);
      const reservoirLevel = 40 + Math.random() * 40; // Simulated

      const riskScore = calculateRiskScore({
        reservoirLevel, rainfallMm: weather.rainfall,
        reportCount: reportCount || 0, newsMentions, month,
      });
      const riskLevel = getRiskLevel(riskScore);
      const previousLevel = ward.risk_level;

      // Update ward
      await supabaseAdmin.from('wards').update({
        risk_score: riskScore, risk_level: riskLevel, last_updated: new Date().toISOString(),
      }).eq('id', ward.id);

      // Log to risk_data_log
      await supabaseAdmin.from('risk_data_log').insert({
        ward_id: ward.id, reservoir_level: reservoirLevel,
        rainfall_mm: weather.rainfall, report_count: reportCount || 0,
        news_mentions: newsMentions, risk_score: riskScore,
      });

      results.push({ ward: ward.ward_name, score: riskScore, level: riskLevel, previous: previousLevel });
    }

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
