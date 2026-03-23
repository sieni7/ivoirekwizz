import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QuizConfig from './pages/QuizConfig';
import QuizPlayer from './pages/QuizPlayer';
import Results from './pages/Results';
import CompleteProfile from './pages/CompleteProfile';
import About from './pages/About';
import Navbar from './components/Navbar';

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ci-surface)]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[var(--ci-orange)] rounded-full animate-spin"></div>
      </div>
    );
  }

  // La Navbar s'affiche uniquement sur /dashboard, /quiz/*, /about, /profile
  const showNavbar = user && (
    location.pathname === '/dashboard' ||
    location.pathname.startsWith('/quiz') ||
    location.pathname === '/about' ||
    location.pathname === '/profile'
  );

  return (
    <div className="min-h-screen">
      {showNavbar && <Navbar />}
      
      <Routes>
        {/* Racine */}
        <Route 
          path="/" 
          element={!user ? <Navigate to="/login" replace /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* Auth & Profil */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/complete-profile" 
          element={user ? <CompleteProfile /> : <Navigate to="/login" replace />} 
        />
        
        {/* App Principale */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        
        <Route 
          path="/quiz/:theme_slug" 
          element={user ? <QuizConfig /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/quiz/:theme_slug/jouer" 
          element={user ? <QuizPlayer /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/quiz/:theme_slug/resultats" 
          element={user ? <Results /> : <Navigate to="/login" replace />} 
        />
        
        {/* Public / Infos */}
        <Route path="/about" element={<About />} />
        
        {/* Fallback Catch-all */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[var(--ci-surface)]">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
