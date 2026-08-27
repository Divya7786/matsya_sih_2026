import React from 'react';
import { CinematicOceanHero } from '../components/CinematicOceanHero';

interface HomeViewProps {
  onNavigate: (view: string) => void;
  onOpenVoiceModal: (initialQuery?: string) => void;
  onOpenAuthModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenVoiceModal,
  onOpenAuthModal,
}) => {
  return (
    <CinematicOceanHero
      onNavigate={onNavigate}
      onOpenVoiceModal={onOpenVoiceModal}
      onOpenAuthModal={onOpenAuthModal}
    />
  );
};
