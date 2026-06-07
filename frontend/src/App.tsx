import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { Header } from './components/layout/Header.js';
import { useAuthStore } from './store/authStore.js';
import './styles/index.css';

function App() {
  const { token } = useAuthStore();

  return (
    <Router>
      {token && <Header />}
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <HomePage />} />
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/dashboard/*" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
