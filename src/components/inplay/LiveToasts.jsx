/**
 * LiveToasts.jsx — goal alerts and bet results, dropping in under the top bar.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useLive } from '../../live/LiveContext.jsx';

export default function LiveToasts({ onOpenMatch }) {
  const { toasts, dismissToast } = useLive();

  return (
    <div className="fixed top-16 left-0 right-0 z-[95] flex flex-col items-center gap-2 px-3 pointer-events-none" aria-live="polite">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.button
            key={t.id}
            type="button"
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            onClick={() => {
              dismissToast(t.id);
              if (t.fixtureId) onOpenMatch?.(t.fixtureId);
            }}
            className="pointer-events-auto w-full max-w-sm text-left rounded-2xl px-4 py-3"
            style={{
              background: t.kind === 'won' ? 'rgb(20,30,8)' : 'rgb(14,19,34)',
              border: `1px solid ${t.kind === 'won' || t.kind === 'goal' ? 'rgba(198,255,61,0.45)' : 'rgba(255,255,255,0.12)'}`,
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}
          >
            <p className="text-sm font-black" style={{ color: t.kind === 'goal' || t.kind === 'won' ? 'var(--action)' : '#F0F6FF' }}>{t.title}</p>
            <p className="text-xs" style={{ color: '#C9D3E8' }}>{t.body}</p>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
