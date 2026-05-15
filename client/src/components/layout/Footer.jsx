import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

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
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
              {t('footer.platform')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/map" className="text-sm text-slate-500 hover:text-blue-400 transition-colors">
                  {t('footer.liveMap')}
                </Link>
              </li>
              <li>
                <Link to="/forecast" className="text-sm text-slate-500 hover:text-blue-400 transition-colors">
                  {t('footer.forecast')}
                </Link>
              </li>
              <li>
                <Link to="/book-water" className="text-sm text-slate-500 hover:text-blue-400 transition-colors">
                  {t('footer.bookWater')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
              {t('footer.resources')}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/register" className="text-sm text-slate-500 hover:text-blue-400 transition-colors">
                  {t('footer.registerAlerts')}
                </Link>
              </li>
              <li>
                <Link to="/request-water" className="text-sm text-slate-500 hover:text-blue-400 transition-colors">
                  {t('footer.reportIssues')}
                </Link>
              </li>
              <li>
                <a href="tel:1916" className="text-sm text-slate-500 hover:text-blue-400 transition-colors">
                  📞 {t('footer.helpline')}: 1916
                </a>
              </li>
            </ul>
          </div>

          {/* Emergency */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
              {t('footer.emergency')}
            </h4>
            <div className="glass-card p-4 space-y-3">
              <a href="tel:1916" className="flex items-center gap-2 text-amber-400 font-semibold text-sm hover:text-amber-300 transition-colors">
                📞 BWSSB {t('footer.helpline')}: 1916
              </a>
              <p className="text-xs text-slate-500">
                {t('footer.emergencyNote')}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
          style={{ borderTop: '1px solid rgba(62, 95, 120, 0.2)' }}
        >
          <p className="text-xs text-slate-600 text-center sm:text-left">
            © {new Date().getFullYear()} AquaGrid. {t('footer.disclaimer')}
          </p>
          <div className="flex gap-4">
            <span className="text-xs text-slate-600">{t('footer.privacy')}</span>
            <span className="text-xs text-slate-600">{t('footer.terms')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}