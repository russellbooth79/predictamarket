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
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: '#05080F', zIndex: 200 }}
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
        <span className="text-sm font-black tracking-widest" style={{ color: '#3A4560' }}>
          PUNT
        </span>
      </div>
    </div>
  );
}

export default function AuthGate({ children }) {
  const { isAuthenticated, loading, authModal, profilingOpen } = useAuth();

  if (loading) {
    return <AppLoadingScreen />;
  }

  return (
    <>
      {/* Main content — either the landing screen or the authenticated app */}
      {isAuthenticated ? children : <LandingScreen />}

      {/* Auth overlays — always mounted so AnimatePresence manages transitions */}
      <SignupFlow isOpen={authModal === 'signup'} />
      <LoginFlow  isOpen={authModal === 'login'}  />

      {/* Profiling only makes sense when authenticated */}
      {isAuthenticated && profilingOpen && <PlayerProfiling />}
    </>
  );
}
