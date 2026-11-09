import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { ATTRACTIONS, getAllAttractions } from '../data/attractions.js';
import { DESTINATIONS, ATTRACTION_CATEGORIES } from '../data/attractionSchema.js';
import { ROUTE_TEMPLATES, getRouteTemplateById } from '../data/routeTemplates.js';
import { TOURS, DEFAULT_TOUR_ID, getToursStore, saveTourToStore } from '../data/tours.js';
import { SUPPORTED_LANGUAGES } from '../lib/i18n.js';
import { parseOptionalCoordinates } from '../lib/tourSerialization.js';
import {
  calculateSchedule,
  generateTourCode,
  createPublishedSnapshot,
  getScheduleWarnings
} from '../lib/scheduleEngine.js';
import {
  getDriverSession,
  onDriverAuthStateChanged,
  loginDriver,
  registerDriver,
  requestDriverPasswordReset,
  logoutDriver,
  saveDraftTour,
  publishTourSnapshot
} from '../lib/firebase.js';

export function OperatorTourBuilder({ onClose, onSwitchToReview, onOpenTour }) {
  // Load initial tour draft
  const [activeTour, setActiveTour] = useState(() => {
    const store = getToursStore();
    return store[DEFAULT_TOUR_ID] || TOURS[DEFAULT_TOUR_ID];
  });

  const [stops, setStops] = useState(() => {
    return (activeTour.stops || []).map((s, i) => ({
      ...s,
      stopId: s.stopId || `stop-${Date.now()}-${i}`,
      durationMinutes: s.durationMinutes || (s.attractionId ? ATTRACTIONS[s.attractionId]?.suggestedDurationMinutes : 45) || 45,
      day: s.day || 1
    }));
  });

  const [titleEn, setTitleEn] = useState(activeTour.title?.en || '');
  const [startTime, setStartTime] = useState(activeTour.startTime || '08:30');
  const [selectedLanguages, setSelectedLanguages] = useState(activeTour.availableLanguages || ['en', 'zh', 'ms']);
  
  // Library filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  // Mobile-only workspace switcher; on larger screens both panels remain visible.
  const [mobilePanel, setMobilePanel] = useState('itinerary');
  
  // Custom stop modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [customCoordError, setCustomCoordError] = useState('');
  const [customDuration, setCustomDuration] = useState('45');
  const [customNarration, setCustomNarration] = useState('');
  
  // Drag & drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [touchHoverIndex, setTouchHoverIndex] = useState(null);

  // Snapshot & QR Modal state
  const [publishedSnapshot, setPublishedSnapshot] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Agreed tour package limit (default 10 hours)
  const [agreedLimitHours, setAgreedLimitHours] = useState(10);

  // Driver Authentication State (Phase 1C: Genuine Firebase Auth)
  const [driverSession, setDriverSession] = useState(() => getDriverSession());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [loginError, setLoginError] = useState('');
  const [loginNotice, setLoginNotice] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsub = onDriverAuthStateChanged((session) => {
      setDriverSession(session);
    });
    return () => unsub();
  }, []);

  async function handleDriverLogin(e) {
    if (e) e.preventDefault();
    setLoginError('');
    setLoginNotice('');
    if (authMode === 'register' && loginPassword !== confirmPassword) {
      setLoginError('Passwords do not match.');
      return;
    }
    setIsLoggingIn(true);
    try {
      const session = authMode === 'register'
        ? await registerDriver(loginEmail, loginPassword)
        : await loginDriver(loginEmail.trim(), loginPassword);
      setDriverSession(session);
      setShowLoginModal(false);
      setLoginPassword('');
      setConfirmPassword('');
      setSaveMessage(authMode === 'register' ? '✓ Account created and signed in' : '✓ Signed in successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      const code = err?.code || '';
      const friendlyErrors = {
        'auth/email-already-in-use': 'This email is already registered. Sign in or reset your password.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/weak-password': 'Choose a stronger password.',
        'auth/invalid-credential': 'Email or password is incorrect. You can register a new account.',
        'auth/operation-not-allowed': 'Email/password registration is not enabled for this Firebase project.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.'
      };
      setLoginError(friendlyErrors[code] || 'Authentication failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handlePasswordReset() {
    setLoginError('');
    setLoginNotice('');
    setIsLoggingIn(true);
    try {
      await requestDriverPasswordReset(loginEmail);
      setLoginNotice('If the email is registered, password reset instructions will be sent.');
    } catch (err) {
      setLoginError(err?.code === 'auth/invalid-email' ? 'Enter a valid email address.' : 'Unable to send reset email right now.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleDriverLogout() {
    await logoutDriver();
    setDriverSession(null);
    setSaveMessage('Driver signed out');
    setTimeout(() => setSaveMessage(''), 3000);
  }

  // Compute live schedule
  const schedule = useMemo(() => {
    return calculateSchedule({
      startTime,
      stops,
      defaultStopDuration: 45
    });
  }, [startTime, stops]);

  // Compute duration warnings, overtime metrics, and geographic detours
  const warnings = useMemo(() => {
    return getScheduleWarnings({
      schedule,
      agreedLimitHours
    });
  }, [schedule, agreedLimitHours]);

  // Filtered attractions for library
  const filteredAttractions = useMemo(() => {
    return getAllAttractions().filter(att => {
      if (selectedDestination !== 'All' && att.destination !== selectedDestination) return false;
      if (selectedCategory !== 'All' && att.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameEn = att.name?.en?.toLowerCase() || '';
        const nameZh = att.name?.zh?.toLowerCase() || '';
        const intro = att.shortIntro?.en?.toLowerCase() || '';
        const dest = att.destination?.toLowerCase() || '';
        if (!nameEn.includes(q) && !nameZh.includes(q) && !intro.includes(q) && !dest.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [selectedDestination, selectedCategory, searchQuery]);

  // Reordering helpers
  function moveStop(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stops.length) return;
    const updated = [...stops];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setStops(updated);
  }

  function handleDragStart(index) {
    setDraggedIndex(index);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
  }

  function handleDrop(targetIndex) {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const updated = [...stops];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);
    setDraggedIndex(null);
    setTouchHoverIndex(null);
    setStops(updated);
  }

  // Mobile Touch Drag & Drop
  function handleTouchStart(e, index) {
    setDraggedIndex(index);
    setTouchHoverIndex(index);
  }

  function handleTouchMove(e) {
    if (draggedIndex === null) return;
    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const cardEl = targetEl ? targetEl.closest('.workspace-stop-card') : null;
    if (cardEl && cardEl.dataset.index !== undefined) {
      const hoverIdx = parseInt(cardEl.dataset.index, 10);
      if (!isNaN(hoverIdx) && hoverIdx !== touchHoverIndex) {
        setTouchHoverIndex(hoverIdx);
      }
    }
  }

  function handleTouchEnd() {
    if (draggedIndex !== null && touchHoverIndex !== null && draggedIndex !== touchHoverIndex) {
      const updated = [...stops];
      const [movedItem] = updated.splice(draggedIndex, 1);
      updated.splice(touchHoverIndex, 0, movedItem);
      setStops(updated);
    }
    setDraggedIndex(null);
    setTouchHoverIndex(null);
  }

  function removeStop(index) {
    setStops(stops.filter((_, i) => i !== index));
  }

  function updateStopDuration(index, newMins) {
    const updated = [...stops];
    updated[index] = {
      ...updated[index],
      durationMinutes: Math.max(5, Number(newMins) || 5)
    };
    setStops(updated);
  }

  function updateStopRadius(index, newRadius) {
    const updated = [...stops];
    updated[index] = {
      ...updated[index],
      triggerRadiusMeters: Number(newRadius) || 500
    };
    setStops(updated);
  }

  function updateStopDay(index, dayNum) {
    const updated = [...stops];
    updated[index] = {
      ...updated[index],
      day: Number(dayNum) || 1
    };
    setStops(updated);
  }

  // Add attraction from library
  function handleAddAttraction(attraction) {
    const newStop = {
      stopId: `stop-${Date.now()}-${attraction.placeId}`,
      attractionId: attraction.placeId,
      triggerRadiusMeters: attraction.triggerRadiusMeters || 500,
      durationMinutes: attraction.suggestedDurationMinutes || 60,
      day: stops.length > 0 ? (stops[stops.length - 1].day || 1) : 1
    };
    setStops([...stops, newStop]);
  }

  // Insert breaks
  function handleAddBreak(type) {
    const isMeal = type === 'meal';
    const lastDay = stops.length > 0 ? (stops[stops.length - 1].day || 1) : 1;
    // Inherit coordinates from preceding stop to maintain coherent route progression
    let inheritCoords = null;
    for (let i = stops.length - 1; i >= 0; i--) {
      const s = stops[i];
      const att = s.attractionId ? ATTRACTIONS[s.attractionId] : null;
      const c = s.coordinates || att?.coordinates;
      if (c && typeof c.lat === 'number' && typeof c.lng === 'number' && !(c.lat === 0 && c.lng === 0)) {
        inheritCoords = { lat: c.lat, lng: c.lng };
        break;
      }
    }

    const newStop = {
      stopId: `break-${Date.now()}`,
      isCustom: true,
      type: isMeal ? 'meal_break' : 'rest_stop',
      title: {
        en: isMeal ? 'Meal & Refreshment Break' : 'Restroom & Stretch Break',
        zh: isMeal ? '用餐与休整时间' : '休息站与洗手间停靠',
        ms: isMeal ? 'Hentian Makan & Rehat' : 'Hentian Rehat & Tandas'
      },
      coordinates: inheritCoords,
      durationMinutes: isMeal ? 60 : 20,
      triggerRadiusMeters: 500,
      day: lastDay,
      customNarration: {
        en: isMeal ? 'Enjoy local flavours and take time to recharge.' : 'A comfortable pause for restrooms and light refreshments.',
        zh: isMeal ? '品尝地道风味美食，尽享惬意用餐时光。' : '中途短暂停靠，方便使用洗手间与活动筋骨。',
        ms: isMeal ? 'Nikmati hidangan tempatan dan berehat sebentar.' : 'Hentian singkat untuk tandas dan regangan.'
      }
    };
    setStops([...stops, newStop]);
  }

  // A new stop is location-unverified until its own coordinates are supplied.
  // Never inherit a previous stop's location or suggest a fake KL pin.
  function openCustomStopModal() {
    setCustomTitle('');
    setCustomLat('');
    setCustomLng('');
    setCustomCoordError('');
    setCustomDuration('45');
    setCustomNarration('');
    setShowCustomModal(true);
  }

  // Add Custom Stop Submit
  function handleSaveCustomStop() {
    if (!customTitle.trim()) return;
    const lastDay = stops.length > 0 ? (stops[stops.length - 1].day || 1) : 1;
    const location = parseOptionalCoordinates(customLat, customLng);
    if (!location.valid) {
      setCustomCoordError('Enter both valid coordinates, or leave both blank to save this stop without a GPS pin.');
      return;
    }
    setCustomCoordError('');

    const newStop = {
      stopId: `custom-${Date.now()}`,
      isCustom: true,
      title: {
        en: customTitle.trim(),
        zh: customTitle.trim(),
        ms: customTitle.trim()
      },
      coordinates: location.coordinates,
      triggerRadiusMeters: 500,
      durationMinutes: Number(customDuration) || 45,
      day: lastDay,
      // Never invent narration or label English text as a verified translation.
      ...(customNarration.trim() ? { customNarration: { en: customNarration.trim() } } : {})
    };

    setStops([...stops, newStop]);
    setShowCustomModal(false);
    setCustomTitle('');
    setCustomNarration('');
  }

  // Load Template
  function handleLoadTemplate(templateId) {
    const tpl = getRouteTemplateById(templateId);
    if (!tpl) return;
    const newTourId = `${tpl.templateId}-${Date.now().toString(36)}`;
    const newCode = generateTourCode();
    const updatedDraft = {
      tourId: newTourId,
      code: newCode,
      title: tpl.title,
      startTime: tpl.defaultStartTime || '08:30',
      destination: tpl.destination,
      availableLanguages: ['en', 'zh', 'ms'],
      publicationStatus: 'draft'
    };
    setActiveTour(updatedDraft);
    setTitleEn(tpl.title.en);
    setStartTime(tpl.defaultStartTime || '08:30');
    setStops(tpl.stops.map((s, idx) => ({
      ...s,
      stopId: s.stopId || `tpl-stop-${idx}`,
      durationMinutes: s.durationMinutes || (s.attractionId ? ATTRACTIONS[s.attractionId]?.suggestedDurationMinutes : 45) || 45,
      day: s.day || 1
    })));
    setSaveMessage(`✓ Loaded template: ${tpl.title.en}`);
    setTimeout(() => setSaveMessage(''), 3000);
  }

  // Save as Draft (Enforces Driver Auth & Cloud Sync)
  async function handleSaveDraft() {
    if (!driverSession) {
      setLoginError('Driver login required to save draft itineraries.');
      setShowLoginModal(true);
      return;
    }

    // Each driver's saved draft must have its own ID. Never reuse the shared sample tour
    // or overwrite the immutable published record when editing a completed itinerary.
    const needsNewDraft = !activeTour.tourId || activeTour.tourId === DEFAULT_TOUR_ID || activeTour.publicationStatus === 'published';
    const freshCode = needsNewDraft ? generateTourCode() : (activeTour.code || generateTourCode());
    const draft = {
      ...activeTour,
      ...(needsNewDraft ? { tourId: `custom-tour-${freshCode.toLowerCase()}`, code: freshCode, publishedVersion: 0 } : {}),
      title: {
        ...activeTour.title,
        en: titleEn || activeTour.title?.en || 'Custom Tour'
      },
      startTime,
      stops,
      availableLanguages: selectedLanguages,
      publicationStatus: 'draft',
      driverUid: driverSession.uid,
      lastUpdated: new Date().toISOString()
    };
    setActiveTour(draft);
    saveTourToStore(draft);

    try {
      await saveDraftTour(draft);
      setSaveMessage('✓ Draft itinerary saved to secure cloud repository!');
    } catch (err) {
      console.warn('Draft sync warning:', err);
      setSaveMessage('✓ Draft saved locally (offline)');
    }
    setTimeout(() => setSaveMessage(''), 3500);
  }

  // Publish Tour (generates immutable snapshot, tour code & cloud record)
  async function handlePublishTour() {
    if (!driverSession) {
      setLoginError('Driver authentication required to publish itineraries.');
      setShowLoginModal(true);
      return;
    }

    // Firestore snapshots are immutable: publishing edits to an already published tour
    // must generate a new tour ID and passenger code rather than silently fail to update.
    const requiresNewIdentity = !activeTour.tourId || activeTour.tourId === DEFAULT_TOUR_ID || activeTour.publicationStatus === 'published';
    const newCode = requiresNewIdentity || !activeTour.code || activeTour.code === 'MYTG-8812'
      ? generateTourCode() : activeTour.code;
    const newTourId = requiresNewIdentity ? `custom-tour-${newCode.toLowerCase()}` : activeTour.tourId;

    const draft = {
      ...activeTour,
      tourId: newTourId,
      code: newCode,
      ...(requiresNewIdentity ? { publishedVersion: 0 } : {}),
      title: {
        ...activeTour.title,
        en: titleEn || activeTour.title?.en || 'Malaysia Tour'
      },
      startTime,
      stops,
      availableLanguages: selectedLanguages,
      driverUid: driverSession.uid
    };

    const snapshot = createPublishedSnapshot(draft, {
      passengerOrigin: typeof window !== 'undefined' ? window.location.origin : undefined
    });

    try {
      // Never show a passenger QR unless Firestore confirms this published snapshot exists.
      await publishTourSnapshot(snapshot);
      setActiveTour(snapshot);
      saveTourToStore(snapshot);
      setPublishedSnapshot(snapshot);
      setSaveMessage(`✓ Tour Published Successfully! Code: ${snapshot.code}`);
      setShowQrModal(true);
    } catch (err) {
      console.error('Cloud publication failed:', err);
      // Keep editable draft locally, but do not misrepresent it as publicly available.
      saveTourToStore({ ...draft, publicationStatus: 'draft' });
      setSaveMessage('⚠️ Publication failed. Your itinerary remains a draft; no passenger link is available. Please retry.');
      setShowQrModal(false);
    }
  }

  function handleCopyLink(linkToCopy) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(linkToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  const activeTourCode = publishedSnapshot?.code || activeTour.code || 'MYTG-8812';
  const activePassengerUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?tour=${activeTourCode}`
    : (publishedSnapshot?.passengerLink || activeTour.passengerLink || `https://msiatguide.web.app/?tour=${activeTour.tourId}`);

  // Generate real, scannable QR Code whenever active passenger URL changes
  useEffect(() => {
    if (activePassengerUrl) {
      QRCode.toDataURL(activePassengerUrl, {
        width: 240,
        margin: 2,
        color: { dark: '#C8102E', light: '#FFFFFF' }
      }).then(url => {
        setQrDataUrl(url);
      }).catch(err => {
        console.error('Failed to generate QR code', err);
      });
    }
  }, [activePassengerUrl]);

  return (
    <div className="operator-container">
      {/* Header */}
      <div className="operator-header">
        <div>
          <span className="operator-badge">OPERATOR SUITE · DRIVER ROUTE BUILDER</span>
          <h1>Itinerary & Route Builder</h1>
          <p>Drag & drop vetted attractions, insert breaks, calculate live schedules, and publish passenger tour codes.</p>
        </div>
        <div className="operator-header-actions">
          <button type="button" className="btn-secondary" onClick={onSwitchToReview}>
            🛡️ Review Queue
          </button>
          <button type="button" className="btn-subtle" onClick={onClose}>
            ✕ Exit Operator
          </button>
        </div>
      </div>

      {/* Driver Auth Banner */}
      <div className="driver-auth-bar" data-testid="driver-auth-bar">
        {driverSession ? (
          <div className="driver-auth-logged-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="driver-status-dot online" />
              <span className="driver-session-info">
                <strong>Verified Driver:</strong> {driverSession.displayName || driverSession.email}
                <span className="driver-uid-tag">({driverSession.uid})</span>
              </span>
            </div>
            <button
              type="button"
              className="btn-auth-logout"
              onClick={handleDriverLogout}
              data-testid="driver-logout-btn"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="driver-auth-unauthenticated">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="driver-status-dot unauth" />
              <span className="driver-session-prompt">
                Driver sign-in is required to save drafts and publish itineraries.
              </span>
            </div>
            <button
              type="button"
              className="btn-auth-login"
              onClick={() => {
                setLoginError('');
                setShowLoginModal(true);
              }}
              data-testid="driver-login-btn"
            >
              Driver Sign In →
            </button>
          </div>
        )}
      </div>

      {saveMessage && (
        <div className="alert-success-banner">
          {saveMessage}
        </div>
      )}

      {/* Template Quick Loader & Metadata */}
      <div className="operator-section-card">
        <div className="builder-top-grid">
          <div className="form-group flex-2">
            <label className="form-label">Tour Title (English)</label>
            <input
              type="text"
              className="form-input"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Melaka Historic Heritage Day Tour"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Start Time</label>
            <input
              type="time"
              className="form-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div className="form-group flex-2">
            <label className="form-label">Load Itinerary Template</label>
            <select
              className="form-input select-template"
              onChange={(e) => e.target.value && handleLoadTemplate(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>-- Select Route Template --</option>
              {ROUTE_TEMPLATES.map(tpl => (
                <option key={tpl.templateId} value={tpl.templateId}>
                  [{tpl.destination}] {tpl.title.en} ({tpl.estimatedDurationHours}h)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Enabled Languages */}
        <div className="form-group">
          <label className="form-label">Passenger Audio Narration Languages</label>
          <div className="language-pills-row">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const active = selectedLanguages.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  className={`lang-pill ${active ? 'active' : ''}`}
                  onClick={() => {
                    if (active) {
                      setSelectedLanguages(selectedLanguages.filter(c => c !== lang.code));
                    } else {
                      setSelectedLanguages([...selectedLanguages, lang.code]);
                    }
                  }}
                >
                  {lang.flag} {lang.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick access on phones: avoid forcing drivers to scroll through all itinerary cards. */}
      <nav className="operator-mobile-switcher" aria-label="Driver workspace sections">
        <button type="button" className={mobilePanel === 'itinerary' ? 'active' : ''}
          aria-pressed={mobilePanel === 'itinerary'} onClick={() => setMobilePanel('itinerary')}
          data-testid="mobile-itinerary-tab">🗓 My Itinerary ({stops.length})</button>
        <button type="button" className={mobilePanel === 'catalog' ? 'active' : ''}
          aria-pressed={mobilePanel === 'catalog'} onClick={() => setMobilePanel('catalog')}
          data-testid="mobile-catalog-tab">📍 Attractions ({filteredAttractions.length})</button>
      </nav>
      {/* Main Two-Column Layout: Itinerary Workspace & Attraction Library */}
      <div className="builder-main-grid" data-mobile-panel={mobilePanel}>
        {/* Left Column: Itinerary Workspace */}
        <div className="workspace-column">
          <div className="operator-section-card">
            <div className="workspace-header">
              <div>
                <h3>Planned Itinerary ({stops.length} stops)</h3>
                <span className="workspace-summary">
                  ⏱ Total: {Math.floor(schedule.totalDurationMinutes / 60)}h {schedule.totalDurationMinutes % 60}m 
                  · {schedule.totalDays > 1 ? `${schedule.totalDays} Days · ` : ''}Finish by {schedule.endTime}
                </span>
              </div>
              <div className="workspace-actions">
                <button type="button" className="btn-chip" onClick={() => handleAddBreak('meal')}>
                  🍽 + Meal Break
                </button>
                <button type="button" className="btn-chip" onClick={() => handleAddBreak('rest')}>
                  ☕ + Rest Stop
                </button>
                <button type="button" className="btn-chip" onClick={openCustomStopModal}>
                  📍 + Custom Stop
                </button>
              </div>
            </div>

            {/* Duration Status & Warning Suite */}
            <div className="schedule-duration-banner">
              <div className="schedule-banner-top">
                <div className={`duration-status-badge status-${warnings.severity}`}>
                  {warnings.severity === 'ok' && '🟢'}
                  {warnings.severity === 'approaching' && '🟡'}
                  {warnings.severity === 'exceeded' && '🔴'}
                  {warnings.severity === 'overnight' && '🟣'}
                  <span>{warnings.headline}</span>
                </div>

                <div className="tour-limit-picker">
                  <label htmlFor="agreed-limit-select">Agreed Limit:</label>
                  <select
                    id="agreed-limit-select"
                    value={agreedLimitHours}
                    onChange={(e) => setAgreedLimitHours(Number(e.target.value))}
                  >
                    <option value={8}>8 Hours (Half/Standard)</option>
                    <option value={10}>10 Hours (Full-Day)</option>
                    <option value={12}>12 Hours (Extended)</option>
                    <option value={14}>14 Hours (Max Day)</option>
                  </select>
                </div>
              </div>

              <div className="duration-metrics-grid">
                <div className="duration-metric-box">
                  <span className="metric-label">Visit Dwell Time</span>
                  <span className="metric-val">
                    {Math.floor(warnings.visitDurationMinutes / 60)}h {warnings.visitDurationMinutes % 60}m
                  </span>
                  <span className="metric-sub">On-site exploration</span>
                </div>

                <div className="duration-metric-box">
                  <span className="metric-label">Est. Road Time</span>
                  <span className="metric-val">
                    {Math.floor(warnings.estimatedRoadMinutes / 60)}h {warnings.estimatedRoadMinutes % 60}m
                  </span>
                  <span className="metric-sub">*Unverified straight-line</span>
                </div>

                <div className="duration-metric-box">
                  <span className="metric-label">Total Duration</span>
                  <span className="metric-val">
                    {Math.floor(warnings.totalPlannedMinutes / 60)}h {warnings.totalPlannedMinutes % 60}m
                  </span>
                  <span className="metric-sub">{warnings.overtimeMinutes > 0 ? `+${Math.floor(warnings.overtimeMinutes / 60)}h ${warnings.overtimeMinutes % 60}m over` : 'Within window'}</span>
                </div>

                <div className="duration-metric-box">
                  <span className="metric-label">Scheduled Finish</span>
                  <span className="metric-val">
                    {schedule.endTime}
                  </span>
                  <span className="metric-sub">{warnings.isCrossingMidnight ? 'Next Day ⚠️' : 'Same Day'}</span>
                </div>
              </div>

              {/* Active Warnings & Alerts */}
              {warnings.warnings.length > 0 && (
                <div className="schedule-alerts-list">
                  {warnings.warnings.map((w, idx) => (
                    <div key={idx} className={`schedule-alert-item alert-${w.level}`}>
                      <span>{w.level === 'danger' ? '⛔' : w.level === 'warning' ? '⚠️' : 'ℹ️'}</span>
                      <span>{w.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="estimation-disclaimer-note">
                ℹ️ {warnings.estimationDisclaimer}
              </p>
            </div>

            {stops.length === 0 ? (
              <div className="empty-workspace-prompt">
                <p>No stops added yet. Click <b>+ Add Stop</b> on any attraction from the library on the right, or load a route template above.</p>
              </div>
            ) : (
              <div className="workspace-stops-list">
                {schedule.scheduledStops.map((stop, idx) => {
                  const attraction = !stop.isCustom ? ATTRACTIONS[stop.attractionId] : null;
                  const stopName = stop.isCustom 
                    ? (stop.title?.en || (stop.type === 'meal_break' ? 'Meal Break' : 'Custom Stop')) 
                    : (attraction?.name?.en || stop.attractionId);
                  const isMeal = stop.type === 'meal_break';
                  const isRest = stop.type === 'rest_stop';

                  return (
                    <div
                      key={stop.stopId || idx}
                      data-index={idx}
                      className={`workspace-stop-card ${draggedIndex === idx ? 'dragging' : ''} ${touchHoverIndex === idx ? 'touch-hover' : ''} ${isMeal ? 'meal-card' : ''} ${isRest ? 'rest-card' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                    >
                      {/* Drag Handle & Order */}
                      <div className="stop-reorder-col">
                        <span
                          className="drag-handle"
                          title="Drag or touch-drag to reorder"
                          onTouchStart={(e) => handleTouchStart(e, idx)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                        >
                          ⠿
                        </span>
                        <div className="stop-arrows">
                          <button
                            type="button"
                            className="btn-arrow"
                            disabled={idx === 0}
                            onClick={() => moveStop(idx, -1)}
                            title="Move up"
                          >
                            ▲
                          </button>
                          <span className="stop-index">{idx + 1}</span>
                          <button
                            type="button"
                            className="btn-arrow"
                            disabled={idx === stops.length - 1}
                            onClick={() => moveStop(idx, 1)}
                            title="Move down"
                          >
                            ▼
                          </button>
                        </div>
                      </div>

                      {/* Content & Schedule Times */}
                      <div className="stop-details-col">
                        <div className="stop-timing-badge">
                          <span className="arrival-pill">Arr {stop.arrivalTime}</span>
                          <span className="time-divider">➔</span>
                          <span className="depart-pill">Dep {stop.departureTime}</span>
                          {stop.travelMinutesFromPrev > 0 && (
                            <span className="travel-pill">
                              🚗 ~{stop.travelMinutesFromPrev}m drive
                            </span>
                          )}
                        </div>

                        <div className="stop-title-row">
                          <span className="stop-title">{stopName}</span>
                          {isMeal && <span className="tag-meal">Meal Break</span>}
                          {isRest && <span className="tag-rest">Rest Stop</span>}
                          {stop.isCustom && !isMeal && !isRest && <span className="tag-custom">Custom</span>}
                          {!stop.isCustom && <span className="tag-vetted">✓ Vetted</span>}
                        </div>

                        {attraction && (
                          <div className="stop-subtext">
                            <span>📍 {attraction.destination}</span>
                            <span>•</span>
                            <span className="capitalize">{attraction.category}</span>
                            <span>•</span>
                            <span>GPS: {attraction.coordinates.lat.toFixed(4)}, {attraction.coordinates.lng.toFixed(4)}</span>
                          </div>
                        )}

                        {/* Editable Controls */}
                        <div className="stop-controls-row">
                          <div className="control-inline">
                            <label>Duration:</label>
                            <input
                              type="number"
                              className="input-num-sm"
                              value={stop.durationMinutes || 45}
                              onChange={(e) => updateStopDuration(idx, e.target.value)}
                              min={5}
                              max={360}
                              step={5}
                            />
                            <span>min</span>
                          </div>

                          <div className="control-inline">
                            <label>Trigger Radius:</label>
                            <input
                              type="number"
                              className="input-num-sm"
                              value={stop.triggerRadiusMeters || 500}
                              onChange={(e) => updateStopRadius(idx, e.target.value)}
                              min={100}
                              max={3000}
                              step={50}
                            />
                            <span>m</span>
                          </div>

                          <div className="control-inline">
                            <label>Day:</label>
                            <select
                              className="select-day-sm"
                              value={stop.day || 1}
                              onChange={(e) => updateStopDay(idx, e.target.value)}
                            >
                              <option value="1">Day 1</option>
                              <option value="2">Day 2</option>
                              <option value="3">Day 3</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <div className="stop-delete-col">
                        <button
                          type="button"
                          className="btn-trash"
                          onClick={() => removeStop(idx)}
                          title="Remove stop"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Save & Publish Controls */}
            <div className="workspace-footer-bar">
              <button
                type="button"
                className="btn-secondary btn-save-draft"
                onClick={handleSaveDraft}
                data-testid="btn-save-draft"
              >
                💾 Save as Draft
              </button>
              <button
                type="button"
                className="btn-primary btn-publish-tour"
                onClick={handlePublishTour}
                data-testid="btn-publish-tour"
              >
                🚀 Publish Itinerary & Generate QR
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Attraction Library Explorer */}
        <div className="library-column">
          <div className="operator-section-card">
            <div className="library-header">
              <h3>Attraction Catalog ({filteredAttractions.length} of {getAllAttractions().length})</h3>
              <p className="card-subtext">Click <b>+ Add Stop</b> to include in your tour route.</p>
            </div>

            {/* Search Input */}
            <div className="search-bar-wrap">
              <input
                type="text"
                className="form-input search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search attractions by name, destination, keywords..."
              />
            </div>

            {/* Destination Filter Tabs */}
            <div className="destinations-scroll-row">
              {['All', ...DESTINATIONS].map(dest => (
                <button
                  key={dest}
                  type="button"
                  className={`dest-tab ${selectedDestination === dest ? 'active' : ''}`}
                  onClick={() => setSelectedDestination(dest)}
                >
                  {dest}
                </button>
              ))}
            </div>

            {/* Category Filter Pills */}
            <div className="categories-filter-row">
              {['All', ...ATTRACTION_CATEGORIES].map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Attractions Cards Grid */}
            <div className="attraction-cards-grid">
              {filteredAttractions.map(att => (
                <div key={att.placeId} className="attraction-library-card">
                  <div className="card-top-meta">
                    <span className="dest-tag">{att.destination}</span>
                    <span className="cat-tag capitalize">{att.category}</span>
                  </div>

                  <h4 className="card-att-title">{att.name.en}</h4>
                  {att.name.zh && <p className="card-att-sub">{att.name.zh}</p>}
                  
                  <p className="card-att-intro">{att.shortIntro.en}</p>

                  <div className="card-att-footer">
                    <span className="att-time-est">⏱ ~{att.suggestedDurationMinutes} min</span>
                    <button
                      type="button"
                      className="btn-add-stop"
                      onClick={() => handleAddAttraction(att)}
                    >
                      + Add Stop
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Stop Modal */}
      {showCustomModal && (
        <div className="modal-backdrop" onClick={() => setShowCustomModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Add Custom Tour Stop</h3>
            <p className="modal-sub">Create an ad-hoc scenic stop, photo-op, or pickup point.</p>

            <div className="form-group">
              <label className="form-label">Stop Title *</label>
              <input
                type="text"
                className="form-input"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Secret Sunset Viewpoint or Hotel Lobby"
              />
            </div>

            <p className="modal-sub">GPS coordinates are optional. Leave both blank if you do not know the exact place; the stop will be saved without location-triggered narration.</p>
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Latitude (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={customLat}
                  onChange={(e) => { setCustomLat(e.target.value); setCustomCoordError(''); }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={customLng}
                  onChange={(e) => { setCustomLng(e.target.value); setCustomCoordError(''); }}
                />
              </div>
            </div>

            {customCoordError && <p role="alert" className="auth-error-banner">{customCoordError}</p>}
            <div className="form-group">
              <label className="form-label">Visit Duration (Minutes)</label>
              <input
                type="number"
                className="form-input"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                min={5}
                max={240}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Passenger Audio Narration (English)</label>
              <textarea
                className="form-input form-textarea"
                rows={3}
                value={customNarration}
                onChange={(e) => setCustomNarration(e.target.value)}
                placeholder="Short script read out to passengers when approaching this stop..."
              />
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-subtle"
                onClick={() => setShowCustomModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveCustomStop}
                disabled={!customTitle.trim()}
              >
                Add Stop to Itinerary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR & Published Snapshot Modal */}
      {showQrModal && (
        <div className="modal-backdrop" onClick={() => setShowQrModal(false)}>
          <div className="modal-card qr-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-header">🇲🇾</div>
            <h2>Tour Published Successfully!</h2>
            <div className="tour-code-box">
              <span className="tour-code-label">OFFICIAL TOUR CODE</span>
              <span className="tour-code-value">{activeTourCode}</span>
            </div>
            <p>Passengers can enter this Tour Code on the landing page or scan the QR code inside the vehicle.</p>
            
            <div className="qr-box">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${activeTourCode}`}
                  className="qr-image"
                  data-testid="passenger-qr-image"
                />
              ) : (
                <div className="qr-placeholder">Generating Tour QR...</div>
              )}
            </div>

            <div className="qr-link-display">
              <code>{activePassengerUrl}</code>
            </div>

            <div className="modal-actions-stacked">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleCopyLink(activePassengerUrl)}
              >
                {copied ? '✓ Link Copied!' : '📋 Copy Passenger Link'}
              </button>
              {onOpenTour && (
                <button
                  type="button"
                  className="btn-accent"
                  onClick={() => {
                    setShowQrModal(false);
                    onOpenTour(activeTour.tourId || activeTourCode);
                  }}
                >
                  🚀 Test Live Passenger Experience
                </button>
              )}
              <button
                type="button"
                className="btn-subtle"
                onClick={() => setShowQrModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Login Modal */}
      {showLoginModal && (
        <div className="modal-backdrop" onClick={() => setShowLoginModal(false)}>
          <div className="modal-card driver-login-card" onClick={(e) => e.stopPropagation()} data-testid="driver-login-modal">
            <div className="modal-icon-header">🔑</div>
            <h2>{authMode === 'register' ? 'Register New Driver' : 'Driver Authentication'}</h2>
            <p className="modal-sub">{authMode === 'register'
              ? 'Create your own account to save routes and publish itineraries.'
              : 'Sign in to publish itineraries and manage route drafts securely.'}</p>

            {loginError && <div className="auth-error-banner" data-testid="auth-error-banner">{loginError}</div>}
            {loginNotice && <p role="status" className="modal-sub">{loginNotice}</p>}

            <form onSubmit={handleDriverLogin} className="driver-login-form">
              <div className="form-group">
                <label className="form-label">Driver Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="driver@mytguide.my"
                  required
                  data-testid="login-email-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  data-testid="login-password-input"
                />
              </div>

              {authMode === 'register' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="driver-register-confirm">Confirm Password</label>
                  <input
                    id="driver-register-confirm"
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
              )}
              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-subtle"
                  disabled={isLoggingIn}
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setLoginError('');
                    setLoginNotice('');
                    setLoginPassword('');
                    setConfirmPassword('');
                  }}
                  data-testid="register-driver-switch"
                >
                  {authMode === 'login' ? 'Register New Driver' : 'Already registered? Sign In'}
                </button>
                {authMode === 'login' && (
                  <button type="button" className="btn-subtle" disabled={isLoggingIn || !loginEmail.trim()} onClick={handlePasswordReset}>
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-subtle"
                  onClick={() => setShowLoginModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoggingIn}
                  data-testid="login-submit-btn"
                >
                  {isLoggingIn ? (authMode === 'register' ? 'Creating Account...' : 'Signing In...') : (authMode === 'register' ? 'Create Driver Account' : 'Sign In as Driver')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
