import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { TOURS, DEFAULT_TOUR_ID, getTourById, getToursStore } from './data/tours.js';
import { evaluateJourneyProgress, JOURNEY_STATUS } from './lib/journeyEngine.js';
import { getTranslation } from './lib/i18n.js';
import { LandingPage } from './components/LandingPage.jsx';
import { WelcomeScreen } from './components/WelcomeScreen.jsx';
import { LocationPromptModal } from './components/LocationPromptModal.jsx';
import { LiveTourView } from './components/LiveTourView.jsx';
import { PlaceDetailView } from './components/PlaceDetailView.jsx';
import { AskGuideModal } from './components/AskGuideModal.jsx';
import { PassengerShareModal } from './components/PassengerShareModal.jsx';
import { TourDrawer } from './components/TourDrawer.jsx';
import { JourneyCompleteView } from './components/JourneyCompleteView.jsx';
import { OperatorTourBuilder } from './components/OperatorTourBuilder.jsx';
import { OperatorReviewView } from './components/OperatorReviewView.jsx';
import './styles/app.css';

export const SCREENS = {
  LANDING: 'LANDING',
  WELCOME: 'WELCOME',
  LOCATION_PROMPT: 'LOCATION_PROMPT',
  LIVE_TOUR: 'LIVE_TOUR',
  PLACE: 'PLACE',
  COMPLETED: 'COMPLETED',
  OPERATOR_BUILDER: 'OPERATOR_BUILDER',
  OPERATOR_REVIEW: 'OPERATOR_REVIEW'
};

function parseRouteFromUrl() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const pathname = window.location.pathname.replace(/^\//, '');
  const searchParams = new URLSearchParams(window.location.search);
  const tourParam = searchParams.get('tour') || searchParams.get('code');

  const rawRoute = hash || pathname;

  if (rawRoute === 'operator' || rawRoute.startsWith('operator/')) {
    return { screen: SCREENS.OPERATOR_BUILDER };
  }
  if (rawRoute === 'review' || rawRoute.startsWith('review/')) {
    return { screen: SCREENS.OPERATOR_REVIEW };
  }
  if (rawRoute.startsWith('place/')) {
    const placeId = rawRoute.split('/')[1];
    return { screen: SCREENS.PLACE, placeId };
  }
  if (rawRoute.startsWith('live/')) {
    const tourId = rawRoute.split('/')[1] || DEFAULT_TOUR_ID;
    return { screen: SCREENS.LIVE_TOUR, tourId };
  }
  if (rawRoute.startsWith('tour/') || rawRoute.startsWith('t/')) {
    const tourId = rawRoute.split('/')[1] || DEFAULT_TOUR_ID;
    return { screen: SCREENS.WELCOME, tourId };
  }
  if (tourParam) {
    return { screen: SCREENS.WELCOME, tourId: tourParam };
  }

  return { screen: SCREENS.LANDING };
}

function App() {
  const initialRoute = useMemo(() => parseRouteFromUrl(), []);
  const [screen, setScreen] = useState(initialRoute.screen);
  const [language, setLanguage] = useState('en');
  const [activeTour, setActiveTour] = useState(() => {
    return getTourById(initialRoute.tourId || DEFAULT_TOUR_ID);
  });
  const [activePlaceId, setActivePlaceId] = useState(initialRoute.placeId || 'batu-caves');
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

  // Route Synchronization Helper
  const navigateTo = useCallback((newScreen, params = {}) => {
    setScreen(newScreen);
    if (params.tourId) {
      const tour = getTourById(params.tourId);
      if (tour) setActiveTour(tour);
    }
    if (params.placeId) {
      setActivePlaceId(params.placeId);
    }

    // Update URL hash safely for client-side routing
    if (newScreen === SCREENS.LANDING) {
      window.history.pushState(null, '', '/');
    } else if (newScreen === SCREENS.WELCOME) {
      const tId = params.tourId || activeTour.tourId;
      window.history.pushState(null, '', `/#/tour/${tId}`);
    } else if (newScreen === SCREENS.LIVE_TOUR) {
      window.history.pushState(null, '', `/#/live/${activeTour.tourId}`);
    } else if (newScreen === SCREENS.PLACE) {
      const pId = params.placeId || activePlaceId;
      window.history.pushState(null, '', `/#/place/${pId}`);
    } else if (newScreen === SCREENS.OPERATOR_BUILDER) {
      window.history.pushState(null, '', `/#/operator`);
    } else if (newScreen === SCREENS.OPERATOR_REVIEW) {
      window.history.pushState(null, '', `/#/review`);
    }
  }, [activeTour.tourId, activePlaceId]);

  // Listen for browser forward/backward navigation
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRouteFromUrl();
      setScreen(parsed.screen);
      if (parsed.tourId) {
        const found = getTourById(parsed.tourId);
        if (found) setActiveTour(found);
      }
      if (parsed.placeId) {
        setActivePlaceId(parsed.placeId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

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
      navigateTo(SCREENS.LIVE_TOUR);
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
    navigateTo(SCREENS.LIVE_TOUR);
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
      {/* 1. Public Marketing Landing & Tour Code Entry */}
      {screen === SCREENS.LANDING && (
        <LandingPage
          onStartTourWithCode={(tourId) => navigateTo(SCREENS.WELCOME, { tourId })}
          onExploreDefaultTour={() => navigateTo(SCREENS.WELCOME, { tourId: DEFAULT_TOUR_ID })}
          onOpenOperator={() => navigateTo(SCREENS.OPERATOR_BUILDER)}
        />
      )}

      {/* 2. Direct Passenger Welcome Screen (Language selector & Start Tour) */}
      {screen === SCREENS.WELCOME && (
        <WelcomeScreen
          language={language}
          onSelectLanguage={setLanguage}
          onStartTour={() => setScreen(SCREENS.LOCATION_PROMPT)}
          onOpenOperator={() => navigateTo(SCREENS.OPERATOR_BUILDER)}
        />
      )}

      {/* 3. Location Permission Explainer Modal */}
      {screen === SCREENS.LOCATION_PROMPT && (
        <LocationPromptModal
          language={language}
          onAllowLocation={startLocationTracking}
          onContinueManual={() => {
            setIsGpsActive(false);
            navigateTo(SCREENS.LIVE_TOUR);
          }}
        />
      )}

      {/* 4. Live Tour Main Experience */}
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
          onBackToWelcome={() => navigateTo(SCREENS.LANDING)}
          onViewPlace={(placeId) => navigateTo(SCREENS.PLACE, { placeId })}
        />
      )}

      {/* 5. Passenger-Safe Approved Place Content */}
      {screen === SCREENS.PLACE && (
        <PlaceDetailView
          placeId={activePlaceId}
          language={language}
          onBack={() => navigateTo(SCREENS.LIVE_TOUR)}
        />
      )}

      {/* 6. Journey Completed View (Digital Keepsake) */}
      {screen === SCREENS.COMPLETED && (
        <JourneyCompleteView
          tour={activeTour}
          visitedStopIds={visitedStopIds}
          language={language}
          onReturnHome={() => {
            setCurrentStopIndex(0);
            setVisitedStopIds(new Set());
            navigateTo(SCREENS.LANDING);
          }}
        />
      )}

      {/* 7. Operator Tour Builder */}
      {screen === SCREENS.OPERATOR_BUILDER && (
        <OperatorTourBuilder
          onClose={() => navigateTo(SCREENS.LANDING)}
          onSwitchToReview={() => navigateTo(SCREENS.OPERATOR_REVIEW)}
          onOpenTour={(tourId) => navigateTo(SCREENS.WELCOME, { tourId })}
        />
      )}

      {/* 8. Operator Review Queue */}
      {screen === SCREENS.OPERATOR_REVIEW && (
        <OperatorReviewView
          onBackToBuilder={() => navigateTo(SCREENS.OPERATOR_BUILDER)}
          onClose={() => navigateTo(SCREENS.LANDING)}
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
