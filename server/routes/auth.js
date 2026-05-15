const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');
const { sendWelcomeEmail } = require('../services/email');

// Save user profile after registration
router.post('/profile', async (req, res) => {
  try {
    const { auth_id, name, phone, email, ward_name, ward_number, address, aadhaar_last4 } = req.body;
    if (!supabaseAdmin) return res.json({ success: true, mock: true });

    const { data, error } = await supabaseAdmin.from('users').upsert({
      auth_id, name, phone, email, ward_name, ward_number, address, aadhaar_last4,
    }, { onConflict: 'auth_id' }).select().single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user profile
router.get('/profile/:authId', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.json({ data: null });
    const { data } = await supabaseAdmin.from('users').select('*').eq('auth_id', req.params.authId).single();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send welcome email after registration
router.post('/welcome-email', async (req, res) => {
  try {
    const { email, name, ward_name } = req.body;

    // Find ward data for risk level
    let ward = null;
    if (supabaseAdmin && ward_name) {
      const { data } = await supabaseAdmin.from('wards').select('*').eq('ward_name', ward_name).single();
      ward = data;
    }

    // Fallback ward data if Supabase not available
    if (!ward && ward_name) {
      ward = { ward_name, risk_level: 'blue', risk_score: 50 };
    }

    await sendWelcomeEmail({ email, name }, ward);
    res.json({ success: true });
  } catch (err) {
    console.error('Welcome email error:', err);
    res.json({ success: false, error: err.message });
  }
});

module.exports = router;
