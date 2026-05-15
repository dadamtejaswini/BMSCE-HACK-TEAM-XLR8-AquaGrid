const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');

const WARDS_FALLBACK = [
  { id: 1, ward_name: 'Koramangala', ward_number: 150, zone: 'South', lat: 12.9352, lng: 77.6245, risk_score: 72, risk_level: 'orange' },
  { id: 2, ward_name: 'Indiranagar', ward_number: 82, zone: 'East', lat: 12.9784, lng: 77.6408, risk_score: 35, risk_level: 'blue' },
  { id: 3, ward_name: 'Whitefield', ward_number: 85, zone: 'East', lat: 12.9698, lng: 77.7500, risk_score: 82, risk_level: 'critical' },
];

router.get('/', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.json({ data: WARDS_FALLBACK });
    const { data, error } = await supabaseAdmin.from('wards').select('*').order('ward_name');
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.json({ data: WARDS_FALLBACK[0] });
    const { data } = await supabaseAdmin.from('wards').select('*').eq('id', req.params.id).single();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/risk', async (req, res) => {
  try {
    const { risk_score } = req.body;
    const risk_level = risk_score <= 25 ? 'green' : risk_score <= 50 ? 'blue' : risk_score <= 75 ? 'orange' : 'critical';
    if (!supabaseAdmin) return res.json({ success: true, mock: true });
    const { data, error } = await supabaseAdmin.from('wards')
      .update({ risk_score, risk_level, last_updated: new Date().toISOString() })
      .eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
