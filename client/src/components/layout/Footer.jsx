import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: 'rgba(19, 42, 58, 0.8)', borderTop: '1px solid rgba(62, 95, 120, 0.2)' }} className="mt-auto">
      <div className="section-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💧</span>
              <span className="text-xl font-bold text-gradient">AquaGrid</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              Smart water scarcity prediction and private water booking platform for Bengaluru.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2">
              {[
                { to: '/map', label: 'Live Risk Map' },
                { to: '/forecast', label: '7-Day Forecast' },
                { to: '/compare', label: 'Compare Services' },
                { to: '/book-water', label: 'Book Water' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-500 hover:text-blue-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2">
              {[
                { to: '/register', label: 'Register for Alerts' },
                { to: '/request-water', label: 'Report Issues' },
                { href: 'tel:1916', label: '📞 Helpline: 1916' },
              ].map((link, i) => (
                <li key={i}>
                  {link.to ? (
                    <Link to={link.to} className="text-sm text-slate-500 hover:text-blue-400 transition-colors">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="text-sm text-slate-500 hover:text-blue-400 transition-colors">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Emergency</h4>
            <div className="glass-card p-4 space-y-3">
              <a
                href="tel:1916"
                className="flex items-center gap-2 text-amber-400 font-semibold text-sm hover:text-amber-300 transition-colors"
              >
                📞 BWSSB Helpline: 1916
              </a>
              <p className="text-xs text-slate-500">
                For immediate water emergencies, contact BWSSB directly.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid rgba(62, 95, 120, 0.2)' }}>
          <p className="text-xs text-slate-600 text-center sm:text-left">
            © {new Date().getFullYear()} AquaGrid. AquaGrid is a private water logistics platform. 
            Not affiliated with BBMP or BWSSB.
          </p>
          <div className="flex gap-4">
            <span className="text-xs text-slate-600">Privacy Policy</span>
            <span className="text-xs text-slate-600">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
