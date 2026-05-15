const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');

// Admin: get all bookings
router.get('/bookings', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.json({ data: [] });
    const { data } = await supabaseAdmin.from('water_bookings').select('*, users(name, email)').order('created_at', { ascending: false });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all users
router.get('/users', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.json({ data: [] });
    const { data } = await supabaseAdmin.from('users').select('*').order('created_at', { ascending: false });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update booking status
router.put('/bookings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!supabaseAdmin) return res.json({ success: true, mock: true });
    const { data, error } = await supabaseAdmin.from('water_bookings').update({ status }).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: stats
router.get('/stats', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.json({ totalBookings: 47, pending: 12, ofd: 8, delivered: 27, users: 1243, reports: 34, avgRisk: 52 });
    const today = new Date().toISOString().split('T')[0];
    const [bookings, users, reports, wards] = await Promise.all([
      supabaseAdmin.from('water_bookings').select('status', { count: 'exact' }).gte('created_at', today),
      supabaseAdmin.from('users').select('id', { count: 'exact' }),
      supabaseAdmin.from('user_reports').select('id', { count: 'exact' }).gte('created_at', today),
      supabaseAdmin.from('wards').select('risk_score'),
    ]);
    const avgRisk = wards.data?.length ? Math.round(wards.data.reduce((a, w) => a + w.risk_score, 0) / wards.data.length) : 0;
    res.json({
      totalBookings: bookings.count || 0,
      pending: bookings.data?.filter(b => b.status === 'pending').length || 0,
      ofd: bookings.data?.filter(b => b.status === 'out_for_delivery').length || 0,
      delivered: bookings.data?.filter(b => b.status === 'delivered').length || 0,
      users: users.count || 0,
      reports: reports.count || 0,
      avgRisk,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
