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
import { DownloadAppModal } from './components/DownloadAppModal';

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

  // Scroll to top on navigation
  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenVoiceModal = (query?: string) => {
    if (query) {
      setVoiceModalQuery(query);
    }
    setIsVoiceModalOpen(true);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setAuthState({
      isAuthenticated: true,
      user,
      token: 'matsya_auth_token_isro_' + Date.now()
    });
    setIsAuthModalOpen(false);
    // Redirect directly to operations center upon login
    handleNavigate('operations-center');
  };

  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null
    });
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
          <OperationsCenterView
            user={authState.user || {
              id: 'guest-researcher',
              name: 'Dr. A. Saravanan',
              email: 'saravanan.a@isro.gov.in',
              role: 'isro_scientist',
              organization: 'ISRO Space Applications Centre',
              department: 'Ocean Sciences & Remote Sensing Division',
              clearanceLevel: 'LEVEL-3 (RESTRICTED)',
              savedAnalysesCount: 4,
              badge: 'ISRO / SAC'
            }}
            onNavigate={handleNavigate}
            onOpenVoiceModal={handleOpenVoiceModal}
          />
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
