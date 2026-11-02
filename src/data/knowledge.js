/**
 * Knowledge Model & Storage Engine
 * Distinguishes source types:
 * - verified_tourism: Reviewed tourism & historical facts
 * - guide_operator: Operator notes, special timings, route guidance
 * - driver_practical: Restrooms, parking, surau, accessibility, traffic, food stops
 * - passenger_contribution: Passenger submissions (strictly enter 'pending_review')
 * - ai_generated: Must never automatically be approved into verified knowledge
 *
 * Moderation statuses: 'draft' | 'pending_review' | 'approved' | 'rejected'
 * Visibilities: 'private' | 'operator' | 'passenger'
 */

export const SOURCE_TYPES = {
  VERIFIED_TOURISM: 'verified_tourism',
  GUIDE_OPERATOR: 'guide_operator',
  DRIVER_PRACTICAL: 'driver_practical',
  PASSENGER_CONTRIBUTION: 'passenger_contribution',
  AI_GENERATED: 'ai_generated'
};

export const MODERATION_STATUS = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const VISIBILITY = {
  PRIVATE: 'private',
  OPERATOR: 'operator',
  PASSENGER: 'passenger'
};

const INITIAL_KNOWLEDGE_STORE = [
  // Batu Caves Practical Info (Driver Practical Knowledge - Approved)
  {
    knowledgeId: 'kn-bc-01',
    placeId: 'batu-caves',
    sourceType: SOURCE_TYPES.DRIVER_PRACTICAL,
    contentType: 'restroom_and_water',
    title: 'Restroom and Coconut Water Advice',
    content: {
      en: 'Restrooms at the base car park cost RM 0.50 cash. Buy fresh coconut (RM 6-8) at the stalls near the temple gate rather than inside to save cost.',
      zh: '底楼停车场的公厕收费0.50令吉现金。建议在山下入口处买新鲜椰子（约RM 6-8），比洞内便宜得多。',
      ms: 'Tandas di tempat letak kereta berbayar RM 0.50. Kelapa muda segar berharga sekitar RM 6-8 di gerai luar pintu masuk.'
    },
    verificationStatus: MODERATION_STATUS.APPROVED,
    visibility: VISIBILITY.PASSENGER,
    commercialRelationship: 'none',
    reviewer: 'Chief Tour Driver Azman',
    verifiedAt: '2025-06-01'
  },
  {
    knowledgeId: 'kn-bc-02',
    placeId: 'batu-caves',
    sourceType: SOURCE_TYPES.DRIVER_PRACTICAL,
    contentType: 'monkey_caution',
    title: 'Macaque Monkey Warning',
    content: {
      en: 'Do not hold plastic bags or open drink cups while climbing the stairs; monkeys will snatch them directly.',
      zh: '上下彩色天梯时请勿手提塑料袋或开盖饮料，猴群会直接抢夺。',
      ms: 'Jangan bawa beg plastik atau minuman terbuka semasa menaiki tangga; monyet liar kerap menyambar.'
    },
    verificationStatus: MODERATION_STATUS.APPROVED,
    visibility: VISIBILITY.PASSENGER,
    commercialRelationship: 'none',
    reviewer: 'Chief Tour Driver Azman',
    verifiedAt: '2025-06-01'
  },

  // Putrajaya Putra Mosque Knowledge
  {
    knowledgeId: 'kn-pm-01',
    placeId: 'putra-mosque',
    sourceType: SOURCE_TYPES.DRIVER_PRACTICAL,
    contentType: 'dress_and_timing',
    title: 'Visiting Hours and Free Robe Counter',
    content: {
      en: 'Non-Muslim visitor entry is closed during Friday prayer (12:00 PM to 3:00 PM). Free red robe rentals are provided at the tourist counter next to Dataran Putra.',
      zh: '周五主麻聚礼时间（中午12:00至下午3:00）非穆斯林访客暂停进入。布城广场入口处设有免费红袍租借柜台。',
      ms: 'Kemasukan bukan Muslim ditutup semasa solat Jumaat (12:00 tgh - 3:00 ptg). Jubah merah disediakan percuma di kaunter pelawat.'
    },
    verificationStatus: MODERATION_STATUS.APPROVED,
    visibility: VISIBILITY.PASSENGER,
    commercialRelationship: 'none',
    reviewer: 'Ops Lead Faridah',
    verifiedAt: '2025-07-01'
  },

  // Melaka Dutch Square / Jonker Street Practical Driver Tips
  {
    knowledgeId: 'kn-ds-01',
    placeId: 'dutch-square',
    sourceType: SOURCE_TYPES.DRIVER_PRACTICAL,
    contentType: 'pickup_and_traffic',
    title: 'Drop-off & Trishaw Experience',
    content: {
      en: 'Traffic around the Clocktower is strictly single-lane. Trishaw rides around the heritage area typically cost RM 25-50 for a 20-30 minute tour.',
      zh: '红屋钟楼周边道路为单行道且车流量大。装饰三轮车游览古城区费用通常为25至50令吉（20-30分钟）。',
      ms: 'Laluan sekitar Menara Jam adalah satu hala. Tambang beca berhias sekitar RM 25-50 untuk pusingan 20-30 minit.'
    },
    verificationStatus: MODERATION_STATUS.APPROVED,
    visibility: VISIBILITY.PASSENGER,
    commercialRelationship: 'none',
    reviewer: 'Driver Kumar',
    verifiedAt: '2025-06-15'
  },
  {
    knowledgeId: 'kn-js-01',
    placeId: 'jonker-street',
    sourceType: SOURCE_TYPES.DRIVER_PRACTICAL,
    contentType: 'halal_and_food_recommendations',
    title: 'Food Options and Night Market',
    content: {
      en: 'On weekdays, shops close by 6:00 PM. On Friday to Sunday, the night market operates from 6:00 PM to 11:00 PM. Look for certified halal chicken rice ball shops near the bridge.',
      zh: '平日大部分店铺下午6点前关门；周五至周日夜市开放至晚11点。桥头有多家获得清真认证的海南鸡饭粒老字号。',
      ms: 'Hari biasa kedai tutup sekitar 6:00 petang. Jumaat hingga Ahad ada pasar malam sehingga 11:00 malam. Nasi ayam bebola halal ada berhampiran jambatan.'
    },
    verificationStatus: MODERATION_STATUS.APPROVED,
    visibility: VISIBILITY.PASSENGER,
    commercialRelationship: 'none',
    reviewer: 'Driver Kumar',
    verifiedAt: '2025-06-15'
  },

  // Seed passenger contribution in 'pending_review'
  {
    knowledgeId: 'kn-contrib-01',
    placeId: 'jonker-street',
    sourceType: SOURCE_TYPES.PASSENGER_CONTRIBUTION,
    contentType: 'passenger_tip',
    title: 'Great Cendol Spot near Dutch Bridge',
    content: {
      en: 'The durian cendol right by the riverside dock was incredible and had clean AC seating inside!',
      zh: '河畔码头旁边的榴莲煎蕊超级浓郁，而且店内有很舒服的冷气！',
      ms: 'Cendol durian berhampiran jeti sungai sangat sedap dan kedainya berhawa dingin!'
    },
    verificationStatus: MODERATION_STATUS.PENDING_REVIEW,
    visibility: VISIBILITY.OPERATOR,
    commercialRelationship: 'none',
    submittedBy: 'Tourist Sarah L.',
    submittedAt: '2026-11-01T09:30:00Z'
  }
];

const STORAGE_KEY = 'mytguide_knowledge_store_v1';

export function getKnowledgeStore() {
  if (typeof window === 'undefined') return INITIAL_KNOWLEDGE_STORE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_KNOWLEDGE_STORE));
      return INITIAL_KNOWLEDGE_STORE;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_KNOWLEDGE_STORE;
  }
}

export function saveKnowledgeStore(items) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to persist knowledge store', e);
  }
}

/**
 * Get approved passenger-facing knowledge for a given place
 */
export function getApprovedPlaceKnowledge(placeId) {
  const store = getKnowledgeStore();
  return store.filter(k => 
    k.placeId === placeId && 
    k.verificationStatus === MODERATION_STATUS.APPROVED &&
    k.visibility === VISIBILITY.PASSENGER
  );
}

/**
 * Submit passenger contribution.
 * Strictly enters 'pending_review' and visibility 'operator'.
 * Never automatically approved.
 */
export function submitPassengerContribution({ placeId, tipType, comment, submitterName, language = 'en' }) {
  const store = getKnowledgeStore();
  const newEntry = {
    knowledgeId: 'contrib-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    placeId: placeId || 'general',
    sourceType: SOURCE_TYPES.PASSENGER_CONTRIBUTION,
    contentType: tipType || 'passenger_tip',
    title: `Passenger Tip (${tipType || 'General'})`,
    content: {
      [language]: comment,
      en: comment
    },
    verificationStatus: MODERATION_STATUS.PENDING_REVIEW,
    visibility: VISIBILITY.OPERATOR,
    commercialRelationship: 'none',
    submittedBy: submitterName?.trim() || 'Anonymous Passenger',
    submittedAt: new Date().toISOString()
  };

  const updated = [newEntry, ...store];
  saveKnowledgeStore(updated);
  return newEntry;
}

/**
 * Operator Action: Moderate a contribution
 */
export function moderateKnowledge(knowledgeId, newStatus, reviewerName = 'Operator') {
  const store = getKnowledgeStore();
  const updated = store.map(item => {
    if (item.knowledgeId === knowledgeId) {
      return {
        ...item,
        verificationStatus: newStatus,
        visibility: newStatus === MODERATION_STATUS.APPROVED ? VISIBILITY.PASSENGER : VISIBILITY.OPERATOR,
        reviewer: reviewerName,
        moderatedAt: new Date().toISOString()
      };
    }
    return item;
  });
  saveKnowledgeStore(updated);
  return updated;
}


/**
 * Builds a grounded textual summary of approved knowledge for AI context injection
 */
export function getGroundedKnowledgeText(placeId, lang = 'en') {
  if (!placeId) return '';
  const approved = getApprovedPlaceKnowledge(placeId);
  if (!approved.length) return '';
  return approved.map(item => {
    const noteText = item.content?.[lang] || item.content?.en || '';
    return `[${item.title}]: ${noteText}`;
  }).join('\n');
}
