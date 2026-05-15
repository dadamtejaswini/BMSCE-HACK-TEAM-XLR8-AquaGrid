import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { WARDS_DATA } from '../data/wards';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const REPORT_TYPES = [
  { value: 'no_supply', label: 'No Water Supply', icon: '🚫', desc: 'No water at all today' },
  { value: 'irregular', label: 'Irregular Supply', icon: '⏰', desc: 'Water comes at random times' },
  { value: 'low_pressure', label: 'Low Pressure', icon: '💧', desc: 'Very low water pressure' },
  { value: 'tanker_needed', label: 'Tanker Needed', icon: '🚛', desc: 'Need emergency tanker' },
];

export default function RequestWater() {
  const { profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');

  const ward = WARDS_DATA.find(w => w.ward_name === profile?.ward_name);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportType) return toast.error('Please select a report type');
    setLoading(true);

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('user_reports').insert({
        user_id: profile?.id,
        ward_id: ward?.id,
        report_type: reportType,
        description,
      });
      if (error) { toast.error('Report failed'); setLoading(false); return; }
    }

    setLoading(false);
    toast.success('Report submitted! Thank you for helping your community.');
    navigate('/');
  };

  return (
    <div className="page-wrapper section-container py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Report Water Issue</h1>
        <p className="text-slate-400 text-sm mb-8">Your report helps us predict scarcity better for your ward</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="input-label">Issue Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {REPORT_TYPES.map(r => (
                <button key={r.value} type="button" onClick={() => setReportType(r.value)}
                  className={`p-4 rounded-xl text-left transition-all border ${reportType === r.value ? 'bg-blue-500/20 border-blue-500/50' : 'bg-slate-800 border-slate-700 hover:border-blue-600/30'}`}>
                  <div className="text-2xl mb-2">{r.icon}</div>
                  <div className="text-sm font-medium text-white">{r.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Description (optional)</label>
            <textarea className="input-field min-h-[100px]" value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell us more about the issue..." />
          </div>

          {ward && (
            <div className="glass-card p-4 border-blue-500/20">
              <p className="text-sm text-slate-400">Ward: <span className="text-white font-medium">{ward.ward_name}</span></p>
              <p className="text-xs text-slate-500">Ward {ward.ward_number} • {ward.zone} zone</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Submitting...' : '📢 Submit Report'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
