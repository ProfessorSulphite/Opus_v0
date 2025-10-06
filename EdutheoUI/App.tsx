import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { MCQPracticePage } from './components/MCQPracticePage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { StyleGuide } from './components/StyleGuide';
import { Toaster } from './components/ui/sonner';

type Page = 'login' | 'dashboard' | 'practice' | 'analytics' | 'style-guide';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('login');
  };

  const handleNavigate = (page: string) => {
    if (page === 'login') {
      handleLogout();
      return;
    }
    
    if (!isLoggedIn && page !== 'login') {
      setCurrentPage('login');
      return;
    }

    setCurrentPage(page as Page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} onLogout={handleLogout} />;
      case 'practice':
        return <MCQPracticePage onNavigate={handleNavigate} />;
      case 'analytics':
        return <AnalyticsPage onNavigate={handleNavigate} />;
      case 'style-guide':
        return <StyleGuide />;
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {renderPage()}
      <Toaster 
        theme="dark"
        position="bottom-right"
        richColors
        toastOptions={{
          style: {
            background: '#1A3328',
            border: '1px solid rgba(0, 255, 133, 0.2)',
            color: '#E0E0E0',
          },
        }}
      />
    </div>
  );
}