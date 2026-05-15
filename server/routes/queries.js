const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');
const { sendQueryAcknowledgement, sendQueryResolved } = require('../services/email');

// Submit a query
router.post('/', async (req, res) => {
  try {
    const { user_id, booking_id, name, phone, email, query_type, message } = req.body;

    if (!supabaseAdmin) {
      // Mock mode
      await sendQueryAcknowledgement({ email, name }, { query_type, message });
      return res.json({ success: true, mock: true });
    }

    const { data, error } = await supabaseAdmin.from('queries').insert({
      user_id: user_id || null,
      booking_id: booking_id || null,
      name, phone, email, query_type, message,
      status: 'open',
    }).select().single();

    if (error) return res.status(400).json({ error: error.message });

    // Send acknowledgement email
    await sendQueryAcknowledgement({ email, name }, data);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all queries (admin)
router.get('/all', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.json({ data: [] });
    const { data } = await supabaseAdmin.from('queries').select('*').order('created_at', { ascending: false });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update query status (admin)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!supabaseAdmin) return res.json({ success: true, mock: true });

    const { data, error } = await supabaseAdmin.from('queries')
      .update({ status }).eq('id', req.params.id).select().single();

    if (error) return res.status(400).json({ error: error.message });

    // If resolved, send email to user
    if (status === 'resolved' && data) {
      const user = data.user_id
        ? (await supabaseAdmin.from('users').select('*').eq('id', data.user_id).single()).data
        : { email: data.email, name: data.name };

      if (user) {
        await sendQueryResolved(user, data);
      }
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
