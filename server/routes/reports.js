const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');

router.post('/', async (req, res) => {
  try {
    const { user_id, ward_id, report_type, description } = req.body;
    if (!supabaseAdmin) return res.json({ success: true, mock: true });
    const { data, error } = await supabaseAdmin.from('user_reports').insert({ user_id, ward_id, report_type, description }).select().single();
    if (error) {
      if (error.message.includes('Could not find the table')) {
        return res.json({ success: true, mock: true, note: 'Table missing, returned mock success' });
      }
      return res.status(400).json({ error: error.message });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ward/:wardId', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.json({ data: [], count: 0 });
    const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const { data, count } = await supabaseAdmin.from('user_reports').select('*', { count: 'exact' })
      .eq('ward_id', req.params.wardId).gte('created_at', since);
    res.json({ data, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
