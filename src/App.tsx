import { useState } from 'react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import FarmerDashboard from './components/FarmerDashboard';
import VeterinarianDashboard from './components/VeterinarianDashboard';
import AbattoirDashboard from './components/AbattoirDashboard';
import TransporterDashboard from './components/TransporterDashboard';
import RegulatorDashboard from './components/RegulatorDashboard';
import AdminDashboard from './components/AdminDashboard';
import MarketplacePage from './components/MarketplacePage';
import WalletPage from './components/WalletPage';
import EscrowPage from './components/EscrowPage';
import CertificatePage from './components/CertificatePage';
import EarlyWarningPage from './components/EarlyWarningPage';
import EWSPage from './components/EWSPage';
import OnrampPage from './components/OnrampPage';
import OfframpPage from './components/OfframpPage';
import AuctionsPage from './components/AuctionsPage';
import TransportPage from './components/TransportPage';
import { Toaster } from './components/ui/sonner';

export type UserRole = 'farmer' | 'veterinarian' | 'abattoir' | 'buyer' | 'transporter' | 'regulator' | 'admin' | null;

export type Page = 
  | 'landing' 
  | 'login' 
  | 'signup' 
  | 'farmer-dashboard' 
  | 'vet-dashboard' 
  | 'abattoir-dashboard' 
  | 'transporter-dashboard' 
  | 'regulator-dashboard' 
  | 'admin-dashboard' 
  | 'marketplace'
  | 'wallet'
  | 'escrow'
  | 'certificates'
  | 'ews'
  | 'onramp'
  | 'offramp'
  | 'auctions'
  | 'transport';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [userRole, setUserRole] = useState<UserRole>(null);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    switch (role) {
      case 'farmer':
        setCurrentPage('farmer-dashboard');
        break;
      case 'veterinarian':
        setCurrentPage('vet-dashboard');
        break;
      case 'abattoir':
        setCurrentPage('abattoir-dashboard');
        break;
      case 'transporter':
        setCurrentPage('transporter-dashboard');
        break;
      case 'regulator':
        setCurrentPage('regulator-dashboard');
        break;
      case 'admin':
        setCurrentPage('admin-dashboard');
        break;
      default:
        setCurrentPage('farmer-dashboard');
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentPage('landing');
  };

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={navigateTo} />;
      case 'login':
        return <LoginPage onNavigate={navigateTo} onLogin={handleLogin} />;
      case 'signup':
        return <SignupPage onNavigate={navigateTo} onComplete={handleLogin} />;
      case 'farmer-dashboard':
        return <FarmerDashboard onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'vet-dashboard':
        return <VeterinarianDashboard onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'abattoir-dashboard':
        return <AbattoirDashboard onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'transporter-dashboard':
        return <TransporterDashboard onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'regulator-dashboard':
        return <RegulatorDashboard onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'marketplace':
        return <MarketplacePage onNavigate={navigateTo} userRole={userRole} onLogout={handleLogout} />;
      case 'wallet':
        return <WalletPage onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'escrow':
        return <EscrowPage onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'certificates':
        return <CertificatePage onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'ews':
        return <EWSPage onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'onramp':
        return <OnrampPage onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'offramp':
        return <OfframpPage onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'auctions':
        return <AuctionsPage onNavigate={navigateTo} onLogout={handleLogout} />;
      case 'transport':
        return <TransportPage onNavigate={navigateTo} onLogout={handleLogout} />;
      default:
        return <LandingPage onNavigate={navigateTo} />;
    }
  };

  return (
    <>
      {renderPage()}
      <Toaster />
    </>
  );
}