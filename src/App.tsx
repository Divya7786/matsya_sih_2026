import React, { useState, useEffect } from 'react';
import { HeaderNavbar } from './components/HeaderNavbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { UserProfile, AuthState } from './types/auth';

// Views
import { HomeView } from './views/HomeView';
import { OceanView } from './views/OceanView';
import { ServicesView } from './views/ServicesView';
import { TechnologyView } from './views/TechnologyView';
import { ResearchView } from './views/ResearchView';
import { NewsView } from './views/NewsView';
import { ResourcesView } from './views/ResourcesView';
import { AboutView } from './views/AboutView';
import { AskOrcaView } from './views/AskOrcaView';
import { OperationsCenterView } from './views/OperationsCenterView';
import { FishermanView } from './views/FishermanView';
import { MissionConsoleView } from './views/MissionConsoleView';
import { LandingDashboard } from './views/LandingDashboard';
import { PublicDashboardView } from './views/PublicDashboardView';
import { LoginView } from './views/LoginView';
import { SignupView } from './views/SignupView';
import { DownloadAppModal } from './components/DownloadAppModal';
import { apiMe, clearToken, storeToken, getStoredToken } from './services/authApi';
import type { AuthUser } from './services/authApi';

function authUserToProfile(u: AuthUser): UserProfile {
  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    role: u.role as any,
    organization: u.organization,
    department: u.designation,
    badge: u.organization ? u.organization.split(' ')[0] : 'Verified',
    clearanceLevel: 'CONFIDENTIAL',
    savedAnalysesCount: 0,
  };
}

export function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ta'); // Default Tamil
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [voiceModalQuery, setVoiceModalQuery] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  // Authentication state
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });

  // Restore session from stored JWT on mount
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    apiMe().then(user => {
      if (user) {
        setAuthState({
          isAuthenticated: true,
          user: authUserToProfile(user),
          token,
        });
      }
    }).catch(() => {});
  }, []);

  // Scroll to top on navigation
  const handleNavigate = (view: string) => {
    // 'auth-demo' opens the existing AuthModal (preset profiles)
    if (view === 'auth-demo') {
      setIsAuthModalOpen(true);
      return;
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenVoiceModal = (query?: string) => {
    if (query) {
      setVoiceModalQuery(query);
    }
    setIsVoiceModalOpen(true);
  };

  // Called by real server login (LoginView / SignupView)
  const handleRealLoginSuccess = (user: AuthUser, token: string) => {
    storeToken(token);
    setAuthState({ isAuthenticated: true, user: authUserToProfile(user), token });
    handleNavigate('operations-center');
  };

  // Called by demo preset login (AuthModal)
  const handleLoginSuccess = (user: UserProfile) => {
    setAuthState({
      isAuthenticated: true,
      user,
      token: 'matsya_auth_token_demo_' + Date.now()
    });
    setIsAuthModalOpen(false);
    handleNavigate('operations-center');
  };

  const handleLogout = () => {
    clearToken();
    setAuthState({ isAuthenticated: false, user: null, token: null });
    handleNavigate('home');
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans selection:bg-teal-100 selection:text-teal-900 flex flex-col relative antialiased">
      
      {/* Sticky Header with Navigation Dropdowns */}
      <HeaderNavbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenVoiceModal={handleOpenVoiceModal}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
        user={authState.user}
        onLogout={handleLogout}
      />

      {/* Main View Router Content */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            onNavigate={handleNavigate}
            onOpenVoiceModal={handleOpenVoiceModal}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentView === 'landing' && (
          <LandingDashboard
            onNavigate={handleNavigate}
            onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
          />
        )}

        {currentView === 'public-dashboard' && (
          <PublicDashboardView
            onNavigate={handleNavigate}
            onOpenVoiceModal={() => handleOpenVoiceModal()}
          />
        )}

        {currentView === 'login' && (
          <LoginView
            onLoginSuccess={handleRealLoginSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'signup' && (
          <SignupView
            onSignupSuccess={handleRealLoginSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'ocean' && (
          <OceanView
            onNavigate={handleNavigate}
            onOpenVoiceModal={handleOpenVoiceModal}
          />
        )}

        {currentView === 'services' && (
          <ServicesView
            onNavigate={handleNavigate}
            onOpenVoiceModal={handleOpenVoiceModal}
          />
        )}

        {currentView === 'technology' && (
          <TechnologyView
            onNavigate={handleNavigate}
            onOpenVoiceModal={handleOpenVoiceModal}
          />
        )}

        {currentView === 'research' && (
          <ResearchView
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'news' && (
          <NewsView
            onNavigate={handleNavigate}
            onOpenVoiceModal={handleOpenVoiceModal}
          />
        )}

        {currentView === 'resources' && (
          <ResourcesView
            onNavigate={handleNavigate}
            onOpenVoiceModal={handleOpenVoiceModal}
          />
        )}

        {currentView === 'about' && (
          <AboutView
            onNavigate={handleNavigate}
            onOpenVoiceModal={() => handleOpenVoiceModal()}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {(currentView === 'ask-orca' || currentView === 'ask-matsya') && (
          <AskOrcaView
            initialQuery={voiceModalQuery}
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'operations-center' && (
          authState.isAuthenticated ? (
            <OperationsCenterView
              user={authState.user!}
              onNavigate={handleNavigate}
              onOpenVoiceModal={handleOpenVoiceModal}
            />
          ) : (
            <LoginView
              onLoginSuccess={handleRealLoginSuccess}
              onNavigate={handleNavigate}
            />
          )
        )}

        {currentView === 'fisherman' && (
          <div className="py-6 bg-[#F7F7F5] min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-[#111111]">Fisherman Field Operations Mode</h1>
                  <p className="text-xs text-[#666666]">High-contrast, simplified marine assistance with native dialect voice support.</p>
                </div>
                <button
                  onClick={() => handleNavigate('services')}
                  className="px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-xs font-semibold text-[#111111] hover:bg-[#F0F0F0]"
                >
                  ← Back to Services
                </button>
              </div>
              <FishermanView onOpenGlobalExplorer={() => handleNavigate('ocean')} />
            </div>
          </div>
        )}

        {currentView === 'mission' && (
          <div className="py-6 bg-[#F7F7F5] min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-[#111111]">ISRO Ocean Science Mission Console</h1>
                  <p className="text-xs text-[#666666]">Deep telemetry inspection, multi-sensor layers, and risk synthesis.</p>
                </div>
                <button
                  onClick={() => handleNavigate('services')}
                  className="px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-xs font-semibold text-[#111111] hover:bg-[#F0F0F0]"
                >
                  ← Back to Services
                </button>
              </div>
              <MissionConsoleView />
            </div>
          </div>
        )}
      </main>

      {/* Institutional Global Footer */}
      <Footer
        onNavigate={handleNavigate}
      />

      {/* Global AI Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        initialQuery={voiceModalQuery}
        defaultLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
      />

      {/* Professional Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Download Fisherman App Modal */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

    </div>
  );
}

export default App;
