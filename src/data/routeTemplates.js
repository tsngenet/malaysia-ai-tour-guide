/**
 * Route Templates Catalog
 *
 * Pre-configured itinerary templates across all primary destinations.
 * Drivers and tour operators can load these as starting templates and customize them.
 */

export const ROUTE_TEMPLATES = [
  {
    templateId: 'tpl-kl-1day',
    title: {
      en: 'Kuala Lumpur 1-Day Iconic Highlights',
      zh: '吉隆坡一日经典地标精华游',
      ms: 'Lawatan 1 Hari Mercu Tanda Ikonik KL'
    },
    destination: 'Kuala Lumpur',
    estimatedDurationHours: 8,
    totalDays: 1,
    defaultStartTime: '09:00',
    description: 'Experience the architectural evolution and cultural diversity of Kuala Lumpur, from prehistoric limestone caverns to soaring skyscrapers.',
    stops: [
      {
        stopId: 'tpl-kl-1',
        isCustom: true,
        title: { en: 'Hotel Pickup (Kuala Lumpur City Centre)', zh: '吉隆坡市中心酒店接送' },
        durationMinutes: 15
      },
      {
        stopId: 'tpl-kl-2',
        attractionId: 'batu-caves',
        durationMinutes: 75
      },
      {
        stopId: 'tpl-kl-3',
        attractionId: 'merdeka-square',
        durationMinutes: 45
      },
      {
        stopId: 'tpl-kl-4',
        type: 'meal_break',
        isCustom: true,
        title: { en: 'Lunch Break — Jalan Alor / Lot 10 Hutong', zh: '午餐时间 — 阿罗街 / 十号胡同美食广场' },
        durationMinutes: 60
      },
      {
        stopId: 'tpl-kl-5',
        attractionId: 'petronas-twin-towers',
        durationMinutes: 75
      }
    ]
  },

  {
    templateId: 'tpl-melaka-1day',
    title: {
      en: 'Melaka UNESCO Historic Heritage 1-Day Tour',
      zh: '马六甲世界文化遗产一日游 (约10小时)',
      ms: 'Lawatan 1 Hari Warisan Bersejarah UNESCO Melaka'
    },
    destination: 'Melaka',
    estimatedDurationHours: 10,
    totalDays: 1,
    defaultStartTime: '08:30',
    description: 'A comprehensive journey into centuries of Portuguese, Dutch, British, and Peranakan colonial heritage, river cruising, and Nyonya flavours.',
    stops: [
      {
        stopId: 'tpl-mel-1',
        isCustom: true,
        title: { en: 'Depart Kuala Lumpur / Pickup', zh: '出发 / 酒店接送' },
        durationMinutes: 15
      },
      {
        stopId: 'tpl-mel-2',
        attractionId: 'dutch-square',
        durationMinutes: 50
      },
      {
        stopId: 'tpl-mel-3',
        attractionId: 'st-pauls-hill',
        durationMinutes: 45
      },
      {
        stopId: 'tpl-mel-4',
        attractionId: 'a-famosa',
        durationMinutes: 40
      },
      {
        stopId: 'tpl-mel-5',
        type: 'meal_break',
        isCustom: true,
        title: { en: 'Authentic Nyonya Lunch — Jonker Street', zh: '正宗娘惹风味午餐 — 鸡场街' },
        durationMinutes: 60
      },
      {
        stopId: 'tpl-mel-6',
        attractionId: 'baba-nyonya-heritage-museum',
        durationMinutes: 60
      },
      {
        stopId: 'tpl-mel-7',
        attractionId: 'melaka-river-cruise',
        durationMinutes: 45
      },
      {
        stopId: 'tpl-mel-8',
        attractionId: 'jonker-street',
        durationMinutes: 75
      }
    ]
  },

  {
    templateId: 'tpl-ipoh-1day',
    title: {
      en: 'Ipoh Heritage, Caves & Gastronomy 1-Day Tour',
      zh: '怡保溶洞古刹、百年古堡与旧街场美食一日游',
      ms: 'Lawatan 1 Hari Gua, Warisan & Gastronomi Ipoh'
    },
    destination: 'Ipoh',
    estimatedDurationHours: 10,
    totalDays: 1,
    defaultStartTime: '08:30',
    description: 'Explore mystical limestone cave sanctuaries, the romantic ruins of Kellie’s Castle, and the culinary treasures of Ipoh Old Town.',
    stops: [
      {
        stopId: 'tpl-ipoh-1',
        isCustom: true,
        title: { en: 'Pickup & Morning White Coffee', zh: '接送点与旧街场早茶白咖啡' },
        durationMinutes: 30
      },
      {
        stopId: 'tpl-ipoh-2',
        attractionId: 'kellies-castle',
        durationMinutes: 60
      },
      {
        stopId: 'tpl-ipoh-3',
        attractionId: 'kek-lok-tong',
        durationMinutes: 60
      },
      {
        stopId: 'tpl-ipoh-4',
        type: 'meal_break',
        isCustom: true,
        title: { en: 'Lunch — Famous Ipoh Bean Sprout Chicken', zh: '午餐 — 怡保芽菜鸡与河粉' },
        durationMinutes: 60
      },
      {
        stopId: 'tpl-ipoh-5',
        attractionId: 'concubine-lane',
        durationMinutes: 50
      },
      {
        stopId: 'tpl-ipoh-6',
        attractionId: 'birch-memorial',
        durationMinutes: 30
      },
      {
        stopId: 'tpl-ipoh-7',
        attractionId: 'perak-tong',
        durationMinutes: 60
      }
    ]
  },

  {
    templateId: 'tpl-kuala-selangor-1day',
    title: {
      en: 'Kuala Selangor Sky Mirror & Firefly Eco Tour',
      zh: '瓜拉雪兰莪天空之镜、海鲜与萤火虫生态之旅',
      ms: 'Lawatan Cermin Langit, Makanan Laut & Kelip-Kelip Kuala Selangor'
    },
    destination: 'Kuala Selangor',
    estimatedDurationHours: 9,
    totalDays: 1,
    defaultStartTime: '11:00',
    description: 'Witness the magical low-tide marine reflections of Sky Mirror, feed silver leaf monkeys at historic Bukit Melawati, and cruise under twinkling fireflies.',
    stops: [
      {
        stopId: 'tpl-ks-1',
        isCustom: true,
        title: { en: 'Kuala Lumpur Departure', zh: '从吉隆坡出发接送' },
        durationMinutes: 15
      },
      {
        stopId: 'tpl-ks-2',
        attractionId: 'sky-mirror-sasaran',
        durationMinutes: 120
      },
      {
        stopId: 'tpl-ks-3',
        attractionId: 'bukit-melawati',
        durationMinutes: 60
      },
      {
        stopId: 'tpl-ks-4',
        attractionId: 'pasir-penambang',
        durationMinutes: 75
      },
      {
        stopId: 'tpl-ks-5',
        attractionId: 'kampung-kuantan-fireflies',
        durationMinutes: 60
      }
    ]
  },

  {
    templateId: 'tpl-genting-1day',
    title: {
      en: 'Genting Highlands Mountain Resort 1-Day Escape',
      zh: '云顶高原避暑缆车与主题乐园一日游',
      ms: 'Percutian 1 Hari Tanah Tinggi Resorts World Genting'
    },
    destination: 'Genting Highlands',
    estimatedDurationHours: 8,
    totalDays: 1,
    defaultStartTime: '09:00',
    description: 'Fly above rainforest canopies on the Awana SkyWay, explore Chin Swee Caves Temple in the clouds, and shop designer brands at GHPO.',
    stops: [
      {
        stopId: 'tpl-gen-1',
        attractionId: 'genting-highlands-premium-outlets',
        durationMinutes: 90
      },
      {
        stopId: 'tpl-gen-2',
        attractionId: 'awana-skyway',
        durationMinutes: 30
      },
      {
        stopId: 'tpl-gen-3',
        attractionId: 'chin-swee-caves-temple',
        durationMinutes: 60
      },
      {
        stopId: 'tpl-gen-4',
        attractionId: 'genting-skyworlds',
        durationMinutes: 180
      }
    ]
  },

  {
    templateId: 'tpl-cameron-1day',
    title: {
      en: 'Cameron Highlands 1-Day Tea & Agro Escape',
      zh: '金马仑高原万亩茶园与清凉生态一日游',
      ms: 'Lawatan 1 Hari Teh & Agro Pelancongan Cameron Highlands'
    },
    destination: 'Cameron Highlands',
    estimatedDurationHours: 8,
    totalDays: 1,
    defaultStartTime: '09:00',
    description: 'A refreshing mountain getaway featuring velvet-green BOH tea plantations, fresh strawberry picking, and vibrant agro markets.',
    stops: [
      {
        stopId: 'tpl-cam-1',
        attractionId: 'boh-tea-sungei-palas',
        durationMinutes: 75
      },
      {
        stopId: 'tpl-cam-2',
        attractionId: 'kea-farm-market',
        durationMinutes: 60
      },
      {
        stopId: 'tpl-cam-3',
        attractionId: 'cameron-lavender-garden',
        durationMinutes: 60
      },
      {
        stopId: 'tpl-cam-4',
        attractionId: 'time-tunnel-museum',
        durationMinutes: 45
      }
    ]
  },

  {
    templateId: 'tpl-cameron-2day',
    title: {
      en: 'Cameron Highlands 2-Day Complete Nature & Cloud Forest Experience',
      zh: '金马仑高原两日深度自然与苔藓云雾林之旅',
      ms: 'Pengalaman 2 Hari Alam Semula Jadi & Hutan Berlumut Cameron'
    },
    destination: 'Cameron Highlands',
    estimatedDurationHours: 16,
    totalDays: 2,
    defaultStartTime: '09:00',
    dayRestartTimes: { 2: '09:00' },
    description: 'The ultimate highland journey incorporating the prehistoric Mossy Forest, historic MARDI agricultural research gardens, and tea harvesting.',
    stops: [
      // Day 1
      {
        stopId: 'tpl-cam2-d1-1',
        day: 1,
        attractionId: 'boh-tea-sungei-palas',
        durationMinutes: 75
      },
      {
        stopId: 'tpl-cam2-d1-2',
        day: 1,
        attractionId: 'kea-farm-market',
        durationMinutes: 60
      },
      {
        stopId: 'tpl-cam2-d1-3',
        day: 1,
        attractionId: 'cameron-lavender-garden',
        durationMinutes: 60
      },
      {
        stopId: 'tpl-cam2-d1-4',
        day: 1,
        isCustom: true,
        title: { en: 'Highland Steamboat Dinner & Overnight Rest', zh: '高山温热炭火火锅晚餐与夜宿' },
        durationMinutes: 90
      },
      // Day 2
      {
        stopId: 'tpl-cam2-d2-1',
        day: 2,
        attractionId: 'mossy-forest',
        durationMinutes: 75
      },
      {
        stopId: 'tpl-cam2-d2-2',
        day: 2,
        attractionId: 'mardi-agro-technology-park',
        durationMinutes: 60
      },
      {
        stopId: 'tpl-cam2-d2-3',
        day: 2,
        attractionId: 'time-tunnel-museum',
        durationMinutes: 50
      }
    ]
  },

  {
    templateId: 'tpl-penang-2day1night',
    title: {
      en: 'Penang 2-Day 1-Night Living Culture & Heritage Tour',
      zh: '槟城两天一夜世界遗产与文化古迹深度游',
      ms: 'Lawatan 2 Hari 1 Malam Budaya & Warisan Pulau Pinang'
    },
    destination: 'Penang',
    estimatedDurationHours: 16,
    totalDays: 2,
    defaultStartTime: '09:00',
    dayRestartTimes: { 2: '09:00' },
    description: 'Immerse yourself in UNESCO street art, coastal stilt clan jetties, majestic Kek Lok Si Temple, and breezy Penang Hill funicular rides.',
    stops: [
      // Day 1
      {
        stopId: 'tpl-pen-d1-1',
        day: 1,
        attractionId: 'fort-cornwallis',
        durationMinutes: 45
      },
      {
        stopId: 'tpl-pen-d1-2',
        day: 1,
        attractionId: 'pinang-peranakan-mansion',
        durationMinutes: 60
      },
      {
        stopId: 'tpl-pen-d1-3',
        day: 1,
        attractionId: 'george-town-street-art',
        durationMinutes: 60
      },
      {
        stopId: 'tpl-pen-d1-4',
        day: 1,
        attractionId: 'chew-jetty',
        durationMinutes: 45
      },
      {
        stopId: 'tpl-pen-d1-5',
        day: 1,
        type: 'meal_break',
        isCustom: true,
        title: { en: 'Gurney Drive Hawker Food Stalls & Rest', zh: '新关仔角夜市风味小吃与休息' },
        durationMinutes: 90
      },
      // Day 2
      {
        stopId: 'tpl-pen-d2-1',
        day: 2,
        attractionId: 'penang-hill',
        durationMinutes: 120
      },
      {
        stopId: 'tpl-pen-d2-2',
        day: 2,
        attractionId: 'kek-lok-si',
        durationMinutes: 90
      }
    ]
  },

  {
    templateId: 'tpl-kampar-1day',
    title: {
      en: 'Kampar Tin Valley Heritage & Adventure Day Tour',
      zh: '金宝近打谷锡矿遗产与自然探险一日游',
      ms: 'Lawatan 1 Hari Warisan Bijih Timah & Pengembaraan Kampar'
    },
    destination: 'Kampar',
    estimatedDurationHours: 8,
    totalDays: 1,
    defaultStartTime: '09:00',
    description: 'Discover the tin mining history that built Malaya, explore colossal prehistoric show caverns, and savour iconic Claypot Chicken Rice.',
    stops: [
      {
        stopId: 'tpl-kpr-1',
        attractionId: 'kinta-tin-mining-museum',
        durationMinutes: 60
      },
      {
        stopId: 'tpl-kpr-2',
        attractionId: 'tt5-tanjung-tualang-tin-dredge',
        durationMinutes: 75
      },
      {
        stopId: 'tpl-kpr-3',
        type: 'meal_break',
        isCustom: true,
        title: { en: 'Lunch — Famous Kampar Claypot Chicken Rice', zh: '午餐 — 驰名金宝炭火瓦煲鸡饭' },
        durationMinutes: 60
      },
      {
        stopId: 'tpl-kpr-4',
        attractionId: 'gua-tempurung',
        durationMinutes: 120
      },
      {
        stopId: 'tpl-kpr-5',
        attractionId: 'bandar-barat-kampar-lake',
        durationMinutes: 45
      }
    ]
  }
];

export function getRouteTemplateById(templateId) {
  if (!templateId) return null;
  return ROUTE_TEMPLATES.find(t => t.templateId === templateId) || null;
}
