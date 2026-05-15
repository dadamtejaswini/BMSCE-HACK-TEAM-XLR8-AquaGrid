const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');
const { sendBookingConfirmation, sendStatusEmail, sendDeliveryConfirmationEmail } = require('../services/email');

router.post('/', async (req, res) => {
  try {
    const { user_id, ward_name, address, quantity, delivery_date, delivery_slot, special_notes } = req.body;
    const year = new Date().getFullYear();
    const num = String(Math.floor(10000 + Math.random() * 90000));
    const booking_id = `AQ-${year}-${num}`;

    if (!supabaseAdmin) return res.json({ success: true, booking_id, mock: true });

    const { data, error } = await supabaseAdmin.from('water_bookings').insert({
      user_id, ward_name, address, quantity, delivery_date, delivery_slot,
      special_notes, booking_id, status: 'pending',
    }).select().single();

    if (error) {
      if (error.message.includes('Could not find the table')) {
        return res.json({ success: true, booking_id, mock: true, note: 'Table missing, returned mock success' });
      }
      return res.status(400).json({ error: error.message });
    }

    // Send booking confirmation email
    if (user_id) {
      const { data: userData } = await supabaseAdmin.from('users').select('*').eq('id', user_id).single();
      if (userData) {
        await sendBookingConfirmation(userData, data);
      }
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    if (!supabaseAdmin) return res.json({ data: [] });
    const { data, error } = await supabaseAdmin.from('water_bookings').select('*')
      .eq('user_id', req.params.userId).order('created_at', { ascending: false });
      
    if (error && error.message.includes('Could not find the table')) {
      return res.json({ data: [] });
    }
    
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!supabaseAdmin) return res.json({ success: true, mock: true });
    const { data, error } = await supabaseAdmin.from('water_bookings')
      .update({ status }).eq('id', req.params.id).select().single();
      
    if (error) {
      if (error.message.includes('Could not find the table')) {
        return res.json({ success: true, mock: true, note: 'Table missing, returned mock success' });
      }
      return res.status(400).json({ error: error.message });
    }

    // Send emails on status change
    if (data && data.user_id) {
      // Fetch user email from Supabase users table using booking's user_id
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .eq('id', data.user_id)
        .single();

      if (userData?.email) {
        // If delivered: send ONLY the dedicated delivery confirmation email
        if (status === 'delivered') {
          await sendDeliveryConfirmationEmail(userData.email, {
            bookingId: data.booking_id,
            ward: data.ward_name,
            litres: data.quantity,
            deliveredAt: new Date().toISOString(),
          });
        } else {
          // Generic status email (confirmed, out_for_delivery, cancelled, etc.)
          await sendStatusEmail(userData, data, status);
        }
      }
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
