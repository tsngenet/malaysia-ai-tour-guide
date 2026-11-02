/**
 * Tour Library
 * Tours contain ordered stops referencing attractions from ATTRACTIONS
 * or custom ad-hoc stops (e.g. hotel pickups, highway rest areas).
 */

export const DEFAULT_TOUR_ID = 'kl-putrajaya-melaka-day-tour';

export const INITIAL_TOURS = {
  'kl-putrajaya-melaka-day-tour': {
    tourId: 'kl-putrajaya-melaka-day-tour',
    code: 'MYTG-8812',
    title: {
      en: 'Kuala Lumpur, Putrajaya & Melaka Heritage Day Tour',
      zh: '吉隆坡 · 布城 · 马六甲 世界遗产全景一日游',
      ms: 'Lawatan Harian Warisan KL, Putrajaya & Melaka',
      ja: 'クアラルンプール・プトラジャヤ・マラッカ日帰りツアー',
      ko: '쿠알라룸푸르 · 푸트라자야 · 멜라카 세계유산 일일 투어'
    },
    publicationStatus: 'published',
    owner: {
      operatorName: 'Malaysia Live Tours Sdn Bhd',
      contact: '+60 12-345 6789'
    },
    availableLanguages: ['en', 'zh', 'ms', 'ja', 'ko'],
    passengerLink: 'https://msiatguide.web.app/?tour=kl-putrajaya-melaka-day-tour',
    stops: [
      {
        stopId: 'stop-1-pickup',
        isCustom: true,
        title: {
          en: 'Kuala Lumpur City Center (Hotel Pickup)',
          zh: '吉隆坡市中心 (酒店接送点)',
          ms: 'Pusat Bandar Kuala Lumpur (Pengambilan Hotel)',
          ja: 'クアラルンプール市内（ホテル出発）',
          ko: '쿠알라룸푸르 도심 (호텔 픽업)'
        },
        coordinates: { lat: 3.1578, lng: 101.7119 },
        triggerRadiusMeters: 500,
        heroVisual: {
          type: 'photo',
          imageUrl: '',
          alt: 'Kuala Lumpur City Center',
          attribution: 'Tourism Malaysia',
          focalPoint: 'center'
        },
        customNarration: {
          en: 'Good morning and welcome aboard! Today we explore the federal administrative heart of Putrajaya and the centuries-old UNESCO heritage city of Melaka.',
          zh: '早上好，欢迎踏上今日的旅程！今天我们将一同探访马来西亚联邦行政中心布城，以及列入联合国教科文组织世界遗产的古城马六甲。',
          ms: 'Selamat pagi dan selamat memulakan perjalanan! Hari ini kita akan meneroka pusat pentadbiran Putrajaya dan bandar bersejarah Melaka.',
          ja: 'おはようございます！本日はマレーシアの連邦行政都市プトラジャヤと、世界遺産の古都マラッカをご案内いたします。',
          ko: '좋은 아침입니다! 오늘 투어는 말레이시아의 현대적 행정 중심지 푸트라자야와 유네스코 세계문화유산 멜라카를 둘러보는 여정입니다.'
        }
      },
      {
        stopId: 'stop-2-batu-caves',
        attractionId: 'batu-caves',
        triggerRadiusMeters: 600
      },
      {
        stopId: 'stop-3-putra-mosque',
        attractionId: 'putra-mosque',
        triggerRadiusMeters: 500
      },
      {
        stopId: 'stop-4-perdana-putra',
        attractionId: 'perdana-putra',
        triggerRadiusMeters: 450
      },
      {
        stopId: 'stop-5-rest-area',
        isCustom: true,
        title: {
          en: 'Ayer Keroh Highway R&R (Rest & Refresh)',
          zh: '爱极乐高速休息站 (Ayer Keroh R&R)',
          ms: 'Kawasan Rehat & Rawat (R&R) Ayer Keroh',
          ja: 'アイル・ケロー 高速道路サービスエリア',
          ko: '아이얼 크로 고속도로 휴게소 (R&R)'
        },
        coordinates: { lat: 2.3789, lng: 102.3021 },
        triggerRadiusMeters: 800,
        heroVisual: {
          type: 'photo',
          imageUrl: '',
          alt: 'Ayer Keroh Highway R&R Rest Area',
          attribution: 'PLUS Expressways',
          focalPoint: 'center'
        },
        customNarration: {
          en: 'We are passing the Ayer Keroh Rest and Service Area along the North-South Expressway. An ideal stop for quick refreshments, clean restrooms, or local Malaysian snacks like curry puffs and fresh fruit.',
          zh: '我们正在途经南北大道上的爱极乐休息站（Ayer Keroh R&R）。这里是停车休整、享用洗手间、品尝新鲜热带水果和咖喱角（Curry Puff）的绝佳停歇点。',
          ms: 'Kita kini melalui Kawasan Rehat & Rawat (R&R) Ayer Keroh di Lebuhraya PLUS. Sesuai untuk berehat sebentar dan menikmati makanan ringan tempatan.',
          ja: '南北高速道路のアイル・ケロー・サービスエリアに近づいています。トイレ休憩や地元のカリーパフ、新鮮なフルーツなどの軽食に最適です。',
          ko: '남북 고속도로의 아이얼 크로 휴게소 부근입니다. 화장실 이용과 함께 커리펖, 신선한 열대 과일 등 로컬 간식을 즐기기에 좋습니다.'
        }
      },
      {
        stopId: 'stop-6-dutch-square',
        attractionId: 'dutch-square',
        triggerRadiusMeters: 400
      },
      {
        stopId: 'stop-7-a-famosa',
        attractionId: 'a-famosa',
        triggerRadiusMeters: 350
      },
      {
        stopId: 'stop-8-jonker-street',
        attractionId: 'jonker-street',
        triggerRadiusMeters: 300
      },
      {
        stopId: 'stop-9-hotel-return',
        isCustom: true,
        title: {
          en: 'Kuala Lumpur Hotel Return / Disembarkation',
          zh: '返回吉隆坡酒店 / 行程结束',
          ms: 'Kembali ke Hotel Kuala Lumpur / Selesai Lawatan',
          ja: 'クアラルンプール市内ホテル帰着',
          ko: '쿠알라룸푸르 호텔 귀환 및 투어 종료'
        },
        coordinates: { lat: 3.1578, lng: 101.7119 },
        triggerRadiusMeters: 600,
        heroVisual: {
          type: 'photo',
          imageUrl: '',
          alt: 'Kuala Lumpur Hotel Return',
          attribution: 'Tourism Malaysia',
          focalPoint: 'center'
        },
        customNarration: {
          en: 'We have returned to Kuala Lumpur! We hope you loved discovering the rich heritage of Putrajaya and Melaka today. Thank you for travelling with us!',
          zh: '我们已顺利返回吉隆坡！希望您度过了难忘而充实的一天。感谢您选择我们的实时AI随行导游，祝您在马旅行愉快！',
          ms: 'Kita telah selamat kembali ke Kuala Lumpur! Terima kasih kerana menjelajah bersama kami hari ini.',
          ja: 'クアラルンプールへ戻ってまいりました。プトラジャヤとマラッカの歴史を巡る旅はいかがでしたでしょうか？ご乗車誠にありがとうございました！',
          ko: '쿠알라룸푸르로 안전하게 돌아왔습니다! 오늘 푸트라자야와 멜라카의 유산 탐방이 즐거우셨기를 바랍니다. 감사합니다!'
        }
      }
    ]
  }
};

export const TOURS = INITIAL_TOURS;

const TOURS_STORAGE_KEY = 'mytguide_tours_store_v1';

export function getToursStore() {
  if (typeof window === 'undefined') return INITIAL_TOURS;
  try {
    const raw = localStorage.getItem(TOURS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(INITIAL_TOURS));
      return INITIAL_TOURS;
    }
    const parsed = JSON.parse(raw);
    return { ...INITIAL_TOURS, ...parsed };
  } catch {
    return INITIAL_TOURS;
  }
}

export function saveTourToStore(tour) {
  if (typeof window === 'undefined' || !tour?.tourId) return;
  try {
    const current = getToursStore();
    current[tour.tourId] = tour;
    localStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save tour to store', e);
  }
}

export function getTourById(idOrCode) {
  if (!idOrCode) return getToursStore()[DEFAULT_TOUR_ID];
  const all = getToursStore();
  // 1. Direct match by tourId
  if (all[idOrCode]) return all[idOrCode];
  // 2. Match by tour code (case-insensitive)
  const codeMatch = Object.values(all).find(
    t => t.code && t.code.toLowerCase() === idOrCode.toLowerCase()
  );
  if (codeMatch) return codeMatch;
  // 3. Fallback to default tour
  return all[DEFAULT_TOUR_ID];
}
