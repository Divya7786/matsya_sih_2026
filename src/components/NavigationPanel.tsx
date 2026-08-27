import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  MapPin,
  Flag,
  Square,
  Play,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  Radio,
  LocateFixed,
} from 'lucide-react';
import { globalNavigationEngine, NavigationEvent, NavigationSession } from '../services/navigation';
import { globalTripHistory, TripRecord } from '../services/tripHistory';
import { MarineVoiceService } from '../services/voice';
import { PFZZone, RoutePlan } from '../types/marine';

interface NavigationPanelProps {
  isActive: boolean;
  destination: { lat: number; lng: number; name: string } | null;
  origin: { lat: number; lng: number; name: string };
  route: RoutePlan | null;
  selectedPFZ: PFZZone | null;
  language: string;
  onEndTrip: (trip: TripRecord) => void;
  onContinue: () => void;
  onClose: () => void;
}

export const NavigationPanel: React.FC<NavigationPanelProps> = ({
  isActive,
  destination,
  origin,
  route,
  selectedPFZ,
  language,
  onEndTrip,
  onContinue,
  onClose,
}) => {
  const [navState, setNavState] = useState<'IDLE' | 'NAVIGATING' | 'ARRIVED'>('IDLE');
  const [distanceRemaining, setDistanceRemaining] = useState<number>(0);
  const [distanceTravelled, setDistanceTravelled] = useState<number>(0);
  const [currentPos, setCurrentPos] = useState(origin);
  const [lastAnnouncement, setLastAnnouncement] = useState<string>('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoSpeed, setDemoSpeed] = useState(1);
  const [geofenceWarning, setGeofenceWarning] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const eventUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isActive || !destination) return;

    const session = globalNavigationEngine.startNavigation({
      origin,
      destination,
      route,
      currentPosition: origin,
    });

    setNavState('NAVIGATING');
    setDistanceRemaining(session.distanceRemainingKm);
    setStartTime(Date.now());

    // Announce initial distance
    const initMsg = language === 'ta'
      ? `சரி, ${session.distanceRemainingKm.toFixed(1)} கிலோமீட்டர் தொலைவில் உள்ள மீன்பிடி மண்டலத்திற்கு உங்களை வழிநடத்துகிறேன்.`
      : language === 'hi'
      ? `ठीक है, मैं आपको ${session.distanceRemainingKm.toFixed(1)} किलोमीटर दूर मत्स्य क्षेत्र तक ले जा रहा हूँ।`
      : `Okay. I'll guide you to the fishing zone, about ${session.distanceRemainingKm.toFixed(0)} kilometres away.`;

    setLastAnnouncement(initMsg);
    MarineVoiceService.speak(initMsg, language);

    const unsub = globalNavigationEngine.onEvent((event: NavigationEvent) => {
      switch (event.type) {
        case 'POSITION_UPDATE':
          setCurrentPos({ lat: event.lat, lng: event.lng, name: '' });
          setDistanceRemaining(event.distanceRemainingKm);
          const sess = globalNavigationEngine.getSession();
          if (sess) setDistanceTravelled(sess.distanceTravelledKm);
          break;
        case 'DISTANCE_ANNOUNCEMENT':
          setLastAnnouncement(event.message);
          MarineVoiceService.speak(event.message, language);
          break;
        case 'ARRIVAL':
          setNavState('ARRIVED');
          setLastAnnouncement(event.message);
          MarineVoiceService.speak(event.message, language, undefined, () => {
            const followUp = language === 'ta'
              ? 'பயணத்தை முடிக்க விரும்புகிறீர்களா அல்லது தொடர விரும்புகிறீர்களா?'
              : language === 'hi'
              ? 'क्या आप यात्रा समाप्त करना चाहते हैं या जारी रखना चाहते हैं?'
              : 'Would you like to end the trip or continue exploring?';
            setTimeout(() => MarineVoiceService.speak(followUp, language), 1000);
          });
          break;
        case 'GEOFENCE_WARNING':
          setGeofenceWarning(event.message);
          MarineVoiceService.speak(event.message, language);
          setTimeout(() => setGeofenceWarning(null), 10000);
          break;
      }
    });

    eventUnsubRef.current = unsub;

    return () => {
      if (eventUnsubRef.current) eventUnsubRef.current();
    };
  }, [isActive, destination?.lat, destination?.lng]);

  const handleStartDemo = () => {
    setIsDemoMode(true);
    globalNavigationEngine.startDemoMovement(demoSpeed);
  };

  const handleStopDemo = () => {
    setIsDemoMode(false);
    globalNavigationEngine.stopDemoMovement();
  };

  const handleEndTrip = () => {
    const result = globalNavigationEngine.endTrip();
    if (result && destination && selectedPFZ) {
      const trip = globalTripHistory.saveTrip({
        startLocation: origin,
        destination,
        distanceKm: result.distanceTravelledKm,
        durationMinutes: result.durationMinutes,
        pfzName: selectedPFZ.name,
        recommendation: `Navigate to ${selectedPFZ.name}`,
        confidenceScore: selectedPFZ.confidenceScore || selectedPFZ.suitabilityScore,
        safetyStatus: selectedPFZ.marineRisk === 'LOW' ? 'SAFE' : selectedPFZ.marineRisk === 'MODERATE' ? 'CAUTION' : 'HIGH_RISK',
        dataTimestamp: new Date().toISOString(),
      });
      setNavState('IDLE');
      onEndTrip(trip);
    } else {
      setNavState('IDLE');
      onClose();
    }
  };

  const handleContinue = () => {
    setNavState('IDLE');
    globalNavigationEngine.stopNavigation();
    const msg = language === 'ta'
      ? 'சரி. வேறு ஒரு மீன்பிடி மண்டலத்தை கண்டறிய விரும்புகிறீர்களா?'
      : language === 'hi'
      ? 'ठीक है। क्या आप एक और मत्स्य क्षेत्र ढूंढना चाहते हैं?'
      : 'Sure. Would you like me to find another fishing zone?';
    MarineVoiceService.speak(msg, language);
    onContinue();
  };

  if (!isActive && navState === 'IDLE') return null;

  const elapsed = startTime ? Math.round((Date.now() - startTime) / 60000) : 0;

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-md overflow-hidden">
      {/* Navigation Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        navState === 'ARRIVED' ? 'bg-emerald-600 text-white' : 'bg-[#111111] text-white'
      }`}>
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          <span className="font-bold text-sm">
            {navState === 'ARRIVED' ? 'DESTINATION REACHED' : 'NAVIGATING'}
          </span>
          {isDemoMode && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-black font-bold">
              DEMO GPS
            </span>
          )}
        </div>
        {navState === 'NAVIGATING' && (
          <button onClick={onClose} className="text-xs text-white/70 hover:text-white">
            Cancel
          </button>
        )}
      </div>

      {/* Navigation Body */}
      <div className="p-4 space-y-4">
        {/* Distance / Progress */}
        {navState === 'NAVIGATING' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#666666] uppercase font-bold">Distance Remaining</div>
                <div className="text-3xl font-bold text-[#111111]">
                  {distanceRemaining.toFixed(1)} <span className="text-base font-normal text-[#666666]">km</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#666666] uppercase font-bold">Travelled</div>
                <div className="text-lg font-bold text-teal-700">{distanceTravelled.toFixed(1)} km</div>
                <div className="text-[10px] text-[#666666]">{elapsed} min</div>
              </div>
            </div>

            {/* Destination */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F7F7F5] border border-[#E5E5E5]">
              <Flag className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-medium text-[#333333] truncate">
                {destination?.name || 'Unknown'}
              </span>
            </div>

            {/* Geofence Warning */}
            {geofenceWarning && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <span className="text-xs text-rose-800 font-medium">{geofenceWarning}</span>
              </div>
            )}

            {/* Last Announcement */}
            {lastAnnouncement && (
              <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="text-xs text-teal-800">{lastAnnouncement}</span>
              </div>
            )}

            {/* Demo Controls */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#E5E5E5]">
              {!isDemoMode ? (
                <button
                  onClick={handleStartDemo}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-800 hover:bg-amber-100 transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  Start Demo Movement
                </button>
              ) : (
                <button
                  onClick={handleStopDemo}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-800 hover:bg-rose-100 transition"
                >
                  <Square className="w-3.5 h-3.5" />
                  Stop Demo
                </button>
              )}
              {isDemoMode && (
                <select
                  value={demoSpeed}
                  onChange={(e) => {
                    const speed = Number(e.target.value);
                    setDemoSpeed(speed);
                    globalNavigationEngine.stopDemoMovement();
                    globalNavigationEngine.startDemoMovement(speed);
                  }}
                  className="px-2 py-1 border border-[#E5E5E5] rounded text-xs"
                >
                  <option value={1}>1x Speed</option>
                  <option value={2}>2x Speed</option>
                  <option value={5}>5x Speed</option>
                  <option value={10}>10x Speed</option>
                </select>
              )}
              <div className="ml-auto flex items-center gap-1 text-[10px] text-[#666666]">
                <LocateFixed className="w-3 h-3" />
                <span>{currentPos.lat.toFixed(4)}°N, {(currentPos as any).lng?.toFixed(4) || origin.lng.toFixed(4)}°E</span>
              </div>
            </div>
          </>
        )}

        {/* Arrival State */}
        {navState === 'ARRIVED' && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-[#111111]">You've arrived!</h3>
              <p className="text-xs text-[#555555] mt-1">
                {destination?.name}
              </p>
            </div>

            {/* Trip Summary */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E5]">
              <div>
                <span className="text-[10px] text-[#666666] block">Distance</span>
                <span className="text-sm font-bold text-[#111111]">{distanceTravelled.toFixed(1)} km</span>
              </div>
              <div>
                <span className="text-[10px] text-[#666666] block">Duration</span>
                <span className="text-sm font-bold text-[#111111]">{elapsed} min</span>
              </div>
              <div>
                <span className="text-[10px] text-[#666666] block">Safety</span>
                <span className="text-sm font-bold text-emerald-700">SAFE</span>
              </div>
              <div>
                <span className="text-[10px] text-[#666666] block">PFZ</span>
                <span className="text-sm font-medium text-teal-700 truncate">{selectedPFZ?.name?.split(' ').slice(0, 3).join(' ') || 'Zone'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleEndTrip}
                className="flex-1 py-3 px-4 bg-[#111111] text-white rounded-xl font-bold text-sm hover:bg-black transition flex items-center justify-center gap-2"
              >
                <Flag className="w-4 h-4" />
                END TRIP
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 py-3 px-4 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 transition flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                CONTINUE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
