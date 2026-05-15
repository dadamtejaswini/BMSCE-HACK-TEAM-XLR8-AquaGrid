const { Resend } = require('resend');

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;
const FROM_EMAIL = 'AquaGrid <onboarding@resend.dev>';
const APP_URL = process.env.APP_URL || 'https://aquagrid.in';

// HTML email wrapper template with AquaGrid dark theme
function emailTemplate(content) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#132A3A;font-family:Inter,Arial,sans-serif;color:#9FB7C8">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px">
    <div style="text-align:center;margin-bottom:24px">
      <span style="font-size:32px">💧</span>
      <span style="font-size:24px;font-weight:bold;color:#9FB7C8;margin-left:8px">AquaGrid</span>
    </div>
    <div style="background:#132A3A;border:1px solid #3E5F78;border-radius:16px;padding:32px;margin-bottom:24px">
      ${content}
    </div>
    <div style="text-align:center;color:#3E5F78;font-size:12px;margin-top:24px">
      <p>AquaGrid is a private water logistics platform. Not affiliated with BBMP or BWSSB.</p>
      <a href="#" style="color:#9FB7C8;text-decoration:none">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`;
}

function ctaButton(text, url) {
  return `<div style="text-align:center;margin:24px 0">
    <a href="${url}" style="display:inline-block;background:#3E5F78;color:#ffffff;font-weight:600;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:14px">${text}</a>
  </div>`;
}

// EMAIL 1 — Welcome email on account creation
async function sendWelcomeEmail(user, ward) {
  if (!resend) { console.log('📧 [Mock] Welcome email to', user.email); return; }

  const riskColors = {
    green: '#10B981', blue: '#3B82F6', orange: '#F97316', critical: '#EF4444',
  };

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Welcome to AquaGrid — Your water alerts are active',
      html: emailTemplate(`
        <h2 style="color:#9FB7C8;margin:0 0 16px">Hi ${user.name || 'there'},</h2>
        <p style="color:#9FB7C8">Welcome to AquaGrid! Your account has been created.</p>
        <p style="color:#9FB7C8">📍 Your ward: <strong style="color:#ffffff">${ward?.ward_name || 'Not set'}</strong></p>
        <p style="color:#9FB7C8">📊 Current risk level: <strong style="color:${riskColors[ward?.risk_level] || '#3B82F6'}">${ward?.risk_level?.toUpperCase() || 'N/A'}</strong></p>
        <p style="color:#9FB7C8;margin-top:16px">You will receive alerts when water scarcity is detected in your area.</p>
        ${ctaButton('🗺️ View Your Ward\'s Water Map →', `${APP_URL}/map`)}
        ${ctaButton('🚰 Book Water in Advance →', `${APP_URL}/book-water`)}
        <p style="color:#3E5F78;font-size:13px;text-align:center">— AquaGrid Team</p>
      `),
    });
    console.log('📧 Welcome email sent to', user.email);
  } catch (err) {
    console.error('📧 Welcome email failed:', err.message);
  }
}

// EMAIL 2 — Booking confirmation
async function sendBookingConfirmation(user, booking) {
  if (!resend) { console.log('📧 [Mock] Booking confirmation to', user.email); return; }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `Booking Confirmed — AquaGrid ${booking.booking_id}`,
      html: emailTemplate(`
        <h2 style="color:#9FB7C8;margin:0 0 16px">Booking Confirmed!</h2>
        <p style="color:#9FB7C8">Your water delivery has been booked successfully.</p>
        <div style="background:#0d2230;border:1px solid #3E5F78;border-radius:12px;padding:20px;margin:16px 0">
          <p style="color:#9FB7C8;margin:4px 0">Booking ID: <strong style="color:#ffffff">${booking.booking_id}</strong></p>
          <p style="color:#9FB7C8;margin:4px 0">Quantity: <strong style="color:#ffffff">${booking.quantity}</strong></p>
          <p style="color:#9FB7C8;margin:4px 0">Delivery Date: <strong style="color:#ffffff">${booking.delivery_date}</strong></p>
          <p style="color:#9FB7C8;margin:4px 0">Time Slot: <strong style="color:#ffffff">${booking.delivery_slot}</strong></p>
          <p style="color:#9FB7C8;margin:4px 0">Address: <strong style="color:#ffffff">${booking.address || 'N/A'}</strong></p>
        </div>
        <p style="color:#9FB7C8">Our team will contact you within 2-4 hours to confirm delivery details.</p>
        ${ctaButton('Track My Order →', `${APP_URL}/my-orders`)}
      `),
    });
    console.log('📧 Booking confirmation sent to', user.email);
  } catch (err) {
    console.error('📧 Booking confirmation failed:', err.message);
  }
}

// EMAIL 3 — Status update (different subject per status)
async function sendStatusEmail(user, booking, newStatus) {
  if (!resend) { console.log('📧 [Mock] Status email to', user.email, ':', newStatus); return; }

  const templates = {
    confirmed: {
      subject: 'Your booking is confirmed ✅',
      body: `Your water booking <strong>${booking.booking_id}</strong> is confirmed. Delivery on ${booking.delivery_date} between ${booking.delivery_slot}.`,
      cta: ctaButton('View Order', `${APP_URL}/my-orders`),
    },
    out_for_delivery: {
      subject: 'Your water is on the way! 🚚',
      body: `Your water tanker for booking <strong>${booking.booking_id}</strong> is on its way! Please ensure someone is available at the delivery address.`,
      cta: ctaButton('Track Order', `${APP_URL}/my-orders`),
    },
    delivered: {
      subject: 'Delivered! Share your feedback 💧',
      body: `Your water delivery for booking <strong>${booking.booking_id}</strong> is complete!<br><br>How was your experience?`,
      cta: ctaButton('⭐ Leave Feedback →', `${APP_URL}/feedback/${booking.id}`) +
           `<p style="color:#9FB7C8;text-align:center;font-size:13px">Having a problem? <a href="${APP_URL}/my-orders" style="color:#9FB7C8;text-decoration:underline">Raise a Query →</a></p>`,
    },
    cancelled: {
      subject: 'Booking cancelled — AquaGrid',
      body: `Your booking <strong>${booking.booking_id}</strong> has been cancelled. If you did not request this cancellation, please contact our helpline at 1916.`,
      cta: ctaButton('Book Again', `${APP_URL}/book-water`),
    },
  };

  const tpl = templates[newStatus];
  if (!tpl) return;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `${tpl.subject} — AquaGrid`,
      html: emailTemplate(`
        <h2 style="color:#9FB7C8;margin:0 0 16px">${tpl.subject}</h2>
        <p style="color:#9FB7C8">${tpl.body}</p>
        ${tpl.cta}
      `),
    });
    console.log('📧 Status email sent to', user.email, ':', newStatus);
  } catch (err) {
    console.error('📧 Status email failed:', err.message);
  }
}

// EMAIL 4 — Risk alert when ward crosses threshold
async function sendRiskAlert(user, ward) {
  if (!resend) { console.log('📧 [Mock] Risk alert to', user.email); return; }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `⚠️ Water scarcity warning for ${ward.ward_name} — AquaGrid`,
      html: emailTemplate(`
        <h2 style="color:#EF4444;margin:0 0 16px">⚠️ Water Scarcity Alert</h2>
        <p style="color:#9FB7C8">Risk level in <strong style="color:#ffffff">${ward.ward_name}</strong> has increased to <strong style="color:#EF4444">${ward.risk_level?.toUpperCase()}</strong>.</p>
        <p style="color:#9FB7C8">Current risk score: <strong style="color:#EF4444">${ward.risk_score}/100</strong></p>
        <p style="color:#9FB7C8;margin-top:12px">We recommend booking water in advance to ensure availability.</p>
        ${ctaButton('🚰 Book Water Now →', `${APP_URL}/book-water`)}
      `),
    });
    console.log('📧 Risk alert sent to', user.email);
  } catch (err) {
    console.error('📧 Risk alert failed:', err.message);
  }
}

// EMAIL 5 — Query acknowledgement
async function sendQueryAcknowledgement(user, query) {
  if (!resend) { console.log('📧 [Mock] Query ack to', user.email || user.phone); return; }

  const toEmail = user.email || query.email;
  if (!toEmail) return;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Query received — AquaGrid Support',
      html: emailTemplate(`
        <h2 style="color:#9FB7C8;margin:0 0 16px">Query Received</h2>
        <p style="color:#9FB7C8">Hi ${user.name || query.name || 'there'},</p>
        <p style="color:#9FB7C8">We've received your query and our team is looking into it.</p>
        <div style="background:#0d2230;border:1px solid #3E5F78;border-radius:12px;padding:20px;margin:16px 0">
          <p style="color:#9FB7C8;margin:4px 0">Query Type: <strong style="color:#ffffff">${query.query_type || 'General'}</strong></p>
          <p style="color:#9FB7C8;margin:4px 0">Message: <em style="color:#9FB7C8">${query.message || ''}</em></p>
        </div>
        <p style="color:#9FB7C8">We'll get back to you within <strong style="color:#ffffff">24 hours</strong>.</p>
        <p style="color:#3E5F78;font-size:13px;margin-top:16px">If urgent, call our helpline at <strong>1916</strong></p>
      `),
    });
    console.log('📧 Query ack sent to', toEmail);
  } catch (err) {
    console.error('📧 Query ack failed:', err.message);
  }
}

// EMAIL — Query resolved notification
async function sendQueryResolved(user, query) {
  if (!resend) { console.log('📧 [Mock] Query resolved to', user.email); return; }

  const toEmail = user.email || query.email;
  if (!toEmail) return;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Query Resolved — AquaGrid Support',
      html: emailTemplate(`
        <h2 style="color:#10B981;margin:0 0 16px">✅ Query Resolved</h2>
        <p style="color:#9FB7C8">Hi ${user.name || query.name || 'there'},</p>
        <p style="color:#9FB7C8">Your query has been resolved by our support team.</p>
        <p style="color:#9FB7C8;margin-top:12px">If you need further assistance, feel free to raise another query or call our helpline at <strong>1916</strong>.</p>
        ${ctaButton('View My Orders', `${APP_URL}/my-orders`)}
      `),
    });
    console.log('📧 Query resolved email sent to', toEmail);
  } catch (err) {
    console.error('📧 Query resolved email failed:', err.message);
  }
}

module.exports = {
  sendWelcomeEmail,
  sendBookingConfirmation,
  sendStatusEmail,
  sendRiskAlert,
  sendQueryAcknowledgement,
  sendQueryResolved,
};
