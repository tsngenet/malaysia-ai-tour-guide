import React, { useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { TOURS, DEFAULT_TOUR_ID } from './data/tours.js';
import { evaluateJourneyProgress, JOURNEY_STATUS } from './lib/journeyEngine.js';
import { getTranslation } from './lib/i18n.js';
import { WelcomeScreen } from './components/WelcomeScreen.jsx';
import { LocationPromptModal } from './components/LocationPromptModal.jsx';
import { LiveTourView } from './components/LiveTourView.jsx';
import { AskGuideModal } from './components/AskGuideModal.jsx';
import { PassengerShareModal } from './components/PassengerShareModal.jsx';
import { TourDrawer } from './components/TourDrawer.jsx';
import { OperatorTourBuilder } from './components/OperatorTourBuilder.jsx';
import { OperatorReviewView } from './components/OperatorReviewView.jsx';
import './styles/app.css';

const SCREENS = {
  WELCOME: 'WELCOME',
  LOCATION_PROMPT: 'LOCATION_PROMPT',
  LIVE_TOUR: 'LIVE_TOUR',
  COMPLETED: 'COMPLETED',
  OPERATOR_BUILDER: 'OPERATOR_BUILDER',
  OPERATOR_REVIEW: 'OPERATOR_REVIEW'
};

function App() {
  const [screen, setScreen] = useState(SCREENS.WELCOME);
  const [language, setLanguage] = useState('en');
  const [activeTour, setActiveTour] = useState(TOURS[DEFAULT_TOUR_ID]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [visitedStopIds, setVisitedStopIds] = useState(() => new Set());
  
  // Geolocation state
  const [pos, setPos] = useState(null);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [watchId, setWatchId] = useState(null);

  // Active Modals
  const [showAsk, setShowAsk] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);

  // Register service worker for offline / PWA support
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Cleanup GPS watcher on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Evaluate Journey State using Haversine & Configurable Trigger Radii
  const journeyState = useMemo(() => {
    return evaluateJourneyProgress({
      currentPos: pos,
      stops: activeTour.stops,
      currentIndex: currentStopIndex,
      visitedIds: visitedStopIds,
      lang: language
    });
  }, [pos, activeTour.stops, currentStopIndex, visitedStopIds, language]);

  // Start Location Watcher
  function startLocationTracking() {
    if (!('geolocation' in navigator)) {
      setScreen(SCREENS.LIVE_TOUR);
      return;
    }

    // First one-shot to lock in coordinates immediately
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setIsGpsActive(true);
      },
      () => {
        setIsGpsActive(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Continuous road watch with minimal battery drain
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setIsGpsActive(true);
      },
      () => {
        setIsGpsActive(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    setWatchId(id);
    setScreen(SCREENS.LIVE_TOUR);
  }

  // Handle stop progression
  function handleNextStop() {
    if (journeyState.currentStop) {
      setVisitedStopIds(prev => new Set([...prev, journeyState.currentStop.stopId]));
    }
    if (currentStopIndex + 1 < activeTour.stops.length) {
      setCurrentStopIndex(prev => prev + 1);
    } else {
      setScreen(SCREENS.COMPLETED);
    }
  }

  function handlePrevStop() {
    if (currentStopIndex > 0) {
      setCurrentStopIndex(prev => prev - 1);
    }
  }

  const t = (k) => getTranslation(language, k);

  return (
    <main className="app-shell">
      {/* 1. Welcome Screen */}
      {screen === SCREENS.WELCOME && (
        <WelcomeScreen
          language={language}
          onSelectLanguage={setLanguage}
          onStartTour={() => setScreen(SCREENS.LOCATION_PROMPT)}
          onOpenOperator={() => setScreen(SCREENS.OPERATOR_BUILDER)}
        />
      )}

      {/* 2. Location Permission Explainer Modal */}
      {screen === SCREENS.LOCATION_PROMPT && (
        <LocationPromptModal
          language={language}
          onAllowLocation={startLocationTracking}
          onContinueManual={() => {
            setIsGpsActive(false);
            setScreen(SCREENS.LIVE_TOUR);
          }}
        />
      )}

      {/* 3. Live Tour Main Experience */}
      {screen === SCREENS.LIVE_TOUR && (
        <LiveTourView
          tour={activeTour}
          currentStop={journeyState.currentStop}
          currentStatus={journeyState.currentStatus}
          distanceMeters={journeyState.distanceMeters}
          nextStop={journeyState.nextStop}
          language={language}
          isGpsActive={isGpsActive}
          onOpenAsk={() => setShowAsk(true)}
          onOpenShare={() => setShowShare(true)}
          onOpenItinerary={() => setShowItinerary(true)}
          onNextStop={handleNextStop}
          onPrevStop={handlePrevStop}
          onCompleteTour={() => setScreen(SCREENS.COMPLETED)}
          onBackToWelcome={() => setScreen(SCREENS.WELCOME)}
        />
      )}

      {/* 4. Journey Completed View */}
      {screen === SCREENS.COMPLETED && (
        <div className="completed-screen">
          <div className="completed-card">
            <span className="celebration-icon">🎉</span>
            <h1>{t('tourCompletedHeading')}</h1>
            <p>{t('tourCompletedBody')}</p>

            <div className="completed-stats">
              <div className="stat-box">
                <b>{activeTour.stops.length}</b>
                <small>Stops Visited</small>
              </div>
              <div className="stat-box">
                <b>100%</b>
                <small>Live Guide Active</small>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary btn-large"
              onClick={() => {
                setCurrentStopIndex(0);
                setVisitedStopIds(new Set());
                setScreen(SCREENS.WELCOME);
              }}
            >
              {t('returnHome')}
            </button>
          </div>
        </div>
      )}

      {/* 5. Operator Tour Builder */}
      {screen === SCREENS.OPERATOR_BUILDER && (
        <OperatorTourBuilder
          onClose={() => setScreen(SCREENS.WELCOME)}
          onSwitchToReview={() => setScreen(SCREENS.OPERATOR_REVIEW)}
        />
      )}

      {/* 6. Operator Review Queue */}
      {screen === SCREENS.OPERATOR_REVIEW && (
        <OperatorReviewView
          onBackToBuilder={() => setScreen(SCREENS.OPERATOR_BUILDER)}
          onClose={() => setScreen(SCREENS.WELCOME)}
        />
      )}

      {/* Modals & Drawers */}
      {showAsk && (
        <AskGuideModal
          currentStop={journeyState.currentStop}
          tour={activeTour}
          language={language}
          onClose={() => setShowAsk(false)}
        />
      )}

      {showShare && (
        <PassengerShareModal
          currentStop={journeyState.currentStop}
          language={language}
          onClose={() => setShowShare(false)}
        />
      )}

      {showItinerary && (
        <TourDrawer
          tour={activeTour}
          allStopsWithState={journeyState.allStopsWithState}
          currentIndex={currentStopIndex}
          language={language}
          onClose={() => setShowItinerary(false)}
          onSelectStop={(idx) => setCurrentStopIndex(idx)}
        />
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
