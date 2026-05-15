import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MOCK_ALL_BOOKINGS } from '../../data/mockData';
import { STATUS_CONFIG, WARDS_DATA } from '../../data/wards';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function Orders() {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterWard, setFilterWard] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase.from('water_bookings').select('*').order('created_at', { ascending: false });
          setBookings(data && data.length > 0 ? data : MOCK_ALL_BOOKINGS);
        } catch {
          setBookings(MOCK_ALL_BOOKINGS);
        }
      } else {
        setBookings(MOCK_ALL_BOOKINGS);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = bookings.filter(b =>
    (filterWard === 'all' || b.ward_name === filterWard) &&
    (filterStatus === 'all' || b.status === filterStatus)
  );

  const updateStatus = async (booking, newStatus) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('water_bookings').update({ status: newStatus }).eq('id', booking.id);
      if (error) return toast.error('Update failed');
    }
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: newStatus } : b));
    toast.success(`${booking.booking_id} → ${STATUS_CONFIG[newStatus]?.label}`);
  };

  const exportCSV = () => {
    const headers = ['Booking ID', 'Customer', 'Ward', 'Quantity', 'Date', 'Slot', 'Payment', 'Status'];
    const rows = filtered.map(b => [b.booking_id, b.user_name || '-', b.ward_name, b.quantity, b.delivery_date, b.delivery_slot, b.payment_method, b.status]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'aquagrid_orders.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const uniqueWards = [...new Set(bookings.map(b => b.ward_name))];

  return (
    <div className="page-wrapper section-container py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Order Management</h1>
            <p className="text-slate-400 text-sm">{filtered.length} orders</p>
          </div>
          <button onClick={exportCSV} className="btn-secondary text-sm">📥 Export CSV</button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select value={filterWard} onChange={e => setFilterWard(e.target.value)} className="input-field max-w-[200px] text-sm">
            <option value="all">All Wards</option>
            {uniqueWards.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field max-w-[200px] text-sm">
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-800/30">
                {['Booking ID', 'Customer', 'Ward', 'Qty', 'Date', 'Slot', 'Payment', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={b.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-cyan-400 text-xs">{b.booking_id}</td>
                    <td className="px-4 py-3 text-white">{b.user_name || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{b.ward_name}</td>
                    <td className="px-4 py-3 text-slate-300">{b.quantity}</td>
                    <td className="px-4 py-3 text-slate-400">{b.delivery_date}</td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{b.delivery_slot}</td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{b.payment_method}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${b.status === 'delivered' ? 'badge-green' : b.status === 'out_for_delivery' ? 'badge-cyan' : b.status === 'cancelled' ? 'badge-rose' : b.status === 'confirmed' ? 'badge-blue' : 'badge-amber'}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select value={b.status}
                        onChange={e => updateStatus(b, e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 focus:border-blue-500 focus:outline-none">
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
