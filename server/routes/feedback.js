const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');

router.post('/', async (req, res) => {
  try {
    const { user_id, booking_id, rating, comment, display_public } = req.body;
    if (!supabaseAdmin) return res.json({ success: true, mock: true });
    const { data, error } = await supabaseAdmin.from('feedback').insert({ user_id, booking_id, rating, comment, display_public }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/public', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.json({ data: [] });
    const { data } = await supabaseAdmin.from('feedback').select('*, users(name)').eq('display_public', true)
      .order('created_at', { ascending: false }).limit(10);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
