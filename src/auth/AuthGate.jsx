/**
 * AuthGate.jsx
 *
 * Sits between the provider tree and the app content.
 * Renders the appropriate content based on auth state:
 *   loading           → full-screen loading spinner
 *   not authenticated → LandingScreen
 *   authenticated     → app children
 *
 * Auth overlays (SignupFlow, LoginFlow, PlayerProfiling) are rendered
 * unconditionally so AnimatePresence can handle their mount/unmount
 * transitions even when the auth state changes.
 *
 * Note: UserProvider is NOT instantiated here. Per the architecture spec,
 * it's placed in App.jsx around AppContent with initialUser from AuthContext.
 * AuthGate only decides what to render — it does not manage user data.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import LandingScreen from './LandingScreen.jsx';
import SignupFlow from './SignupFlow.jsx';
import LoginFlow from './LoginFlow.jsx';
import PlayerProfiling from './PlayerProfiling.jsx';

// ── App loading screen ─────────────────────────────────────────────────────────
// Full-screen #05080F with a centred spinner.
// Shown only during the initial localStorage hydration (~0ms in practice,
// but guards against flash of unauthenticated content on returning users).

function AppLoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: '#05080F', zIndex: 200 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinning gradient ring */}
        <div
          className="w-12 h-12 rounded-full animate-spin"
          style={{
            background: 'conic-gradient(from 0deg, #6C63FF, #B06FFF, transparent)',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)',
          }}
        />
        <span className="text-sm font-black tracking-widest" style={{ color: '#6B7894' }}>
          PUNT
        </span>
      </div>
    </motion.div>
  );
}

export default function AuthGate({ children }) {
  const { isAuthenticated, loading, authModal, profilingOpen } = useAuth();

  return (
    <>
      {/* Loading screen fades out once the session has hydrated */}
      <AnimatePresence>
        {loading && <AppLoadingScreen key="loading" />}
      </AnimatePresence>

      {/* Main content — either the landing screen or the authenticated app.
          The app wrapper animates opacity only: a transform would break the
          app's position:fixed chrome (top bar, bottom nav, swipe feed). */}
      {!loading && (
        <AnimatePresence initial={false}>
          {isAuthenticated ? (
            <motion.div
              key="app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              {children}
            </motion.div>
          ) : (
            <LandingScreen key="landing" />
          )}
        </AnimatePresence>
      )}

      {/* Auth overlays — always mounted so AnimatePresence manages transitions */}
      <SignupFlow isOpen={authModal === 'signup'} />
      <LoginFlow  isOpen={authModal === 'login'}  />

      {/* Profiling — isOpen prop lets AnimatePresence handle the exit transition */}
      {isAuthenticated && <PlayerProfiling isOpen={profilingOpen} />}
    </>
  );
}
