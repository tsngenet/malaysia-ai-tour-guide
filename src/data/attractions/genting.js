/**
 * Attractions: Genting Highlands
 */

export const GENTING_ATTRACTIONS = {
  'chin-swee-caves-temple': {
    placeId: 'chin-swee-caves-temple',
    name: {
      en: 'Chin Swee Caves Temple',
      zh: '云顶清水岩庙 (Chin Swee Caves)',
      ms: 'Tokong Gua Chin Swee',
      ja: 'チン・スウィー洞窟寺院',
      ko: '친스위 동굴 사원 (청수암)'
    },
    destination: 'Genting Highlands',
    category: 'culture',
    coordinates: { lat: 3.4136, lng: 101.7877 },
    triggerRadiusMeters: 500,
    suggestedDurationMinutes: 60,
    durationRange: { minMinutes: 45, maxMinutes: 90 },
    shortIntro: {
      en: 'A scenic Taoist temple perched 4,600 feet up misty forested slopes, featuring an iconic 9-storey pagoda and 10 Chambers of Hell.',
      zh: '高居海拔4,600英尺苍茫云雾山峦间的道教古刹，矗立着标志性九层万佛塔与警世十殿阎罗雕塑长廊。',
      ms: 'Tokong Taoisme indah di lereng bukit berkabus setinggi 4,600 kaki dengan pagoda 9 tingkat dan ukiran 10 Kamar Neraka.',
      ja: '霧深い標高1,400mの山肌に建つ壮大な道教寺院。9層の仏塔や中国の伝統的な死生観を描いた地獄めぐりの回廊が有名です。',
      ko: '해발 1,400m 안개 낀 산비탈에 자리 잡은 도교 사원으로, 9층 파고다와 동양적 사후세계를 표현한 10대 지옥 조각상이 인상적입니다.'
    },
    narration: {
      en: "Perched 4,600 feet above sea level amidst mist-shrouded greenery, Chin Swee Caves Temple was built by Genting Group founder Tan Sri Lim Goh Tong in tribute to Master Chin Swee. The nine-storey Pagoda of 10,000 Blessings features thousands of luminous Buddha statues, while the dramatic walk through the 'Journey to Enlightenment' depicts the legendary Ten Chambers of Hell. Accessible directly via the Awana SkyWay cable car.",
      zh: "高居海拔4,600英尺云雾缭绕青翠山腰间的清水岩庙，由云顶集团创办人丹斯里林梧桐为感念家乡安溪守护神清水祖师庇佑而建。高耸入云的九层万佛万福塔内供奉着成千上万尊金身佛像。蜿蜒山壁上的“十殿阎罗”雕塑群栩栩如生地再现了劝人向善的传统教义。游客可搭乘阿娃娜缆车直达寺院。",
      ms: "Tokong Chin Swee dibina oleh Tan Sri Lim Goh Tong bagi menghormati Master Chin Swee. Ia mempunyai Pagoda 10,000 Rahmat dan pemandangan pergunungan.",
      ja: "ゲンティン創始者リム・ゴー・トン氏によって建立された寺院。雲海を見下ろす展望広場や9層の仏塔からの眺望は息をのむ美しさです。",
      ko: "겐팅 창업주 림고통 회장이 세운 사찰로, 9층 탑과 산 아래를 굽어보는 전망대, 케이블카 중간 정차역으로 많은 관광객이 찾습니다."
    },
    interestingFacts: [
      {
        en: 'Due to the steep mountain terrain, the temple took 18 years to complete because modern machinery could not be used; workers dug foundations manually.',
        zh: '由于山势陡峭险峻无法使用大型现代机械，整座庙宇的地基开凿完全依靠工匠纯人力挖掘，前后历时18载方得落成。',
        ms: 'Kuil ini mengambil masa 18 tahun untuk disiapkan kerana jentera moden tidak dapat digunakan di cerun curam.'
      }
    ],
    facilities: {
      restroom: 'Clean restrooms available at the cable car station and lower pagoda square.',
      prayerRoom: 'Active Taoist/Buddhist prayer sanctuaries.',
      parking: 'Multi-level covered parking garage next to the temple.',
      pickupSuitability: 'Direct cable car intermediate stop or private coach driveway entrance.'
    },
    sourceReferences: ['Chin Swee Temple Management', 'Resorts World Genting'],
    sourceUrls: ['https://www.rwgenting.com'],
    verificationStatus: 'approved',
    lastVerified: '2025-06-15',
    heroVisual: {
      type: 'photo',
      imageUrl: '',
      fallbackUrl: '',
      alt: 'Nine storey pagoda of Chin Swee Caves Temple rising above mountain clouds',
      attribution: 'Resorts World Genting',
      focalPoint: 'center'
    }
  },

  'awana-skyway': {
    placeId: 'awana-skyway',
    name: {
      en: 'Awana SkyWay Cable Car',
      zh: '云顶阿娃娜缆车 (Awana SkyWay)',
      ms: 'Kereta Kabel Awana SkyWay',
      ja: 'アワナ・スカイウェイ (ロープウェイ)',
      ko: '아와나 스카이웨이 케이블카'
    },
    destination: 'Genting Highlands',
    category: 'viewpoint',
    coordinates: { lat: 3.4002, lng: 101.7779 },
    triggerRadiusMeters: 400,
    suggestedDurationMinutes: 45,
    durationRange: { minMinutes: 30, maxMinutes: 60 },
    shortIntro: {
      en: 'A scenic 10-minute aerial gondola flight gliding over 130-million-year-old rainforest canopy from Awana Station to the resort summit.',
      zh: '长达10分钟的惬意高空缆车飞行，越过拥有1.3亿年历史的热带原始雨林树冠，自阿娃娜直达云顶娱乐城之巅。',
      ms: 'Penerbangan kereta kabel 10 minit merentasi kanopi hutan hujan dara purba dari Stesen Awana ke puncak Resorts World Genting.',
      ja: 'アワナ駅から山頂まで約10分。1億3000万年前から続く熱帯雨林の森の上空を滑るように進む空中散歩です。ガラス床のキャビンも人気。',
      ko: '아와나 역에서 리조트 정상까지 약 10분간 1억 3천만 년 역사의 열대 원시림 위를 날아오르는 최신식 곤돌라 케이블카입니다.'
    },
    narration: {
      en: "Connecting the foothills at Awana Bus Terminal to SkyAvenue at the summit in just ten minutes, the Awana SkyWay carries passengers smoothly across 2.8 kilometres. Gliding quietly above 130-million-year-old virgin rainforest canopy, riders enjoy panoramic views of the Titiwangsa Mountains. The line includes a complimentary midway disembarkation at Chin Swee Station.",
      zh: "仅需10分钟即可将旅客从山脚的阿娃娜巴士总站平稳送达山顶SkyAvenue商场，全长2.8公里。缆车轻柔滑行于拥有1.3亿年树龄的古老热带雨林树冠之上，将蒂蒂旺沙山脉的连绵青翠尽收眼底。途中还可在清水岩站免费下车游览参拜。",
      ms: "Awana SkyWay membawa penumpang sejauh 2.8 km dengan pemandangan pergunungan Banjaran Titiwangsa dan hentian percuma di Tokong Chin Swee.",
      ja: "最新鋭のゴンドラで全長2.8kmを結びます。足元が透明なガラスボトムキャビンからはジャングルを見下ろすスリル満点の体験ができます。",
      ko: "2.8km 구간을 운행하며 티티왕사 산맥의 푸른 전망을 제공합니다. 중간 기착지인 친스위 역에서 무료로 하차하여 사원을 둘러볼 수 있습니다."
    },
    interestingFacts: [
      {
        en: 'The system features special glass-floor gondolas allowing daring riders to gaze directly straight down into the towering treetops below.',
        zh: '缆车特设透明玻璃底座车厢，让勇于挑战的游客能够俯瞰脚下百米深处苍翠挺拔的原始热带林木。',
        ms: 'Terdapat gondola khas berlantaikan kaca lutsinar yang membolehkan penumpang melihat terus ke dasar hutan rimba.'
      }
    ],
    facilities: {
      restroom: 'Modern restrooms at Awana Station, Chin Swee Station, and SkyAvenue Station.',
      prayerRoom: 'Available inside Awana and SkyAvenue stations.',
      parking: 'Extensive multi-tier parking at Genting Highlands Premium Outlets / Awana.',
      pickupSuitability: 'Awana Bus Terminal dedicated tourist coach bay.'
    },
    sourceReferences: ['Resorts World Genting', 'Leitner Ropeways'],
    sourceUrls: ['https://www.rwgenting.com'],
    verificationStatus: 'approved',
    lastVerified: '2025-06-15',
    heroVisual: {
      type: 'photo',
      imageUrl: '',
      fallbackUrl: '',
      alt: 'Awana SkyWay cable car gondolas ascending over tropical rainforest canopy',
      attribution: 'Resorts World Genting',
      focalPoint: 'center'
    }
  },

  'genting-skyworlds': {
    placeId: 'genting-skyworlds',
    name: {
      en: 'Genting SkyWorlds Theme Park',
      zh: '云顶天城世界主题乐园 (SkyWorlds)',
      ms: 'Taman Tema Genting SkyWorlds',
      ja: 'ゲンティン・スカイワールズ・テーマパーク',
      ko: '겐팅 스카이월드 테마파크'
    },
    destination: 'Genting Highlands',
    category: 'activity',
    coordinates: { lat: 3.4240, lng: 101.7947 },
    triggerRadiusMeters: 500,
    suggestedDurationMinutes: 180,
    durationRange: { minMinutes: 120, maxMinutes: 300 },
    shortIntro: {
      en: 'A premier 26-acre outdoor theme park featuring 9 uniquely themed worlds inspired by cinematic blockbusters and original adventures.',
      zh: '占地26英亩的高原户外旗舰主题乐园，拥有9个各具特色的沉浸式电影主题世界与刺激乘骑项目。',
      ms: 'Taman tema luar berkeluasan 26 ekar dengan 9 dunia bertema unik yang berinspirasikan filem animasi antarabangsa.',
      ja: '涼しい高原気候の中で楽しむ26エーカーの大型屋外テーマパーク。人気映画の世界を再現した9つのテーマゾーンが広がります。',
      ko: '해발 1,800m의 시원한 고원에 펼쳐진 26에이커 규모의 야외 테마파크로, 9개의 영화 테마존과 스릴 넘치는 어트랙션이 가득합니다.'
    },
    narration: {
      en: "Spanning 26 acres at 6,000 feet above sea level, Genting SkyWorlds is Southeast Asia's most anticipated outdoor highland theme park. Featuring nine uniquely themed worlds—such as Eagle Mountain, Central Park, Andromeda Base, and Ice Age—the park boasts world-first roller coasters, water rides, immersive 3D simulators, and live theatrical parades, all in the cool mountain air.",
      zh: "高居海拔6,000英尺之巅的云顶天城世界，占地26英亩，是东南亚极负盛名的高原户外主题公园。乐园打造了雄鹰峰、中央公园、仙女座基地以及冰川时代等9大沉浸式主题区域，汇集世界一流的过山车、水上乘骑与全感官3D模拟器，在清凉宜人的山顶气候中畅享欢笑与惊险。",
      ms: "Genting SkyWorlds menawarkan pelbagai permainan mendebarkan dalam suasana nyaman tanah tinggi.",
      ja: "雲の上で楽しむテーマパーク。世界初のアトラクションや水上ライド、臨場感あふれるショーが一年中涼しい気候の中で楽しめます。",
      ko: "시원한 고원에서 즐기는 9개의 독창적인 테마 구역으로 구성되어 있으며, 최첨단 롤러코스터와 다채로운 퍼레이드가 펼쳐집니다."
    },
    interestingFacts: [
      {
        en: 'The park operates a smart virtual queue (VQ) mobile system allowing guests to reserve ride time-slots and skip physical queues.',
        zh: '乐园全面启用智能虚拟排队（VQ）移动预约系统，游客可通过手机直接预约游乐设施排队时段，免去冗长等待。',
        ms: 'Taman tema ini menggunakan aplikasi pintar Giliran Maya (VQ) bagi menjimatkan masa menunggu pelawat.'
      }
    ],
    facilities: {
      restroom: 'Extensive themed restrooms throughout all 9 worlds.',
      prayerRoom: 'Available in Central Park and Studio Plaza.',
      parking: 'SkyAvenue and Genting Grand multi-storey parking complexes.',
      pickupSuitability: 'Direct SkyAvenue drop-off concourse.'
    },
    sourceReferences: ['Resorts World Genting Theme Parks'],
    sourceUrls: ['https://www.gentingskyworlds.com'],
    verificationStatus: 'approved',
    lastVerified: '2025-06-25',
    heroVisual: {
      type: 'photo',
      imageUrl: '',
      fallbackUrl: '',
      alt: 'Genting SkyWorlds Theme Park rides and roller coasters against mountain ridge',
      attribution: 'Resorts World Genting',
      focalPoint: 'center'
    }
  },

  'genting-highlands-premium-outlets': {
    placeId: 'genting-highlands-premium-outlets',
    name: {
      en: 'Genting Highlands Premium Outlets (GHPO)',
      zh: '云顶名牌城 (GHPO)',
      ms: 'Genting Highlands Premium Outlets',
      ja: 'ゲンティン・ハイランド・プレミアム・アウトレット',
      ko: '겐팅 하이랜드 프리미엄 아울렛 (GHPO)'
    },
    destination: 'Genting Highlands',
    category: 'shopping',
    coordinates: { lat: 3.3994, lng: 101.7769 },
    triggerRadiusMeters: 450,
    suggestedDurationMinutes: 90,
    durationRange: { minMinutes: 60, maxMinutes: 150 },
    shortIntro: {
      en: 'Southeast Asia’s first hilltop outdoor open-air outlet shopping center featuring over 150 international designer brands.',
      zh: '东南亚首座依山而建的高原露天名牌折扣购物中心，云集150余家国际知名奢侈品牌与潮流设计师旗舰店。',
      ms: 'Pusat beli-belah outlet premium luar pertama di Asia Tenggara di atas bukit dengan lebih 150 jenama pereka antarabangsa.',
      ja: '東南アジア初となる高原の野外型プレミアム・アウトレット。150以上の世界的デザイナーズブランドを優待価格で楽しめます。',
      ko: '동남아 최초의 야외 산상형 프리미엄 아울렛으로, 150여 개 글로벌 유명 브랜드와 다양한 다이닝을 시원한 고원에서 만날 수 있습니다.'
    },
    narration: {
      en: "Nestled at the mid-hill plateau directly connected to the Awana SkyWay terminal, Genting Highlands Premium Outlets is Southeast Asia's premier open-air shopping destination. Spanning two terraced levels, shoppers enjoy daily savings of 25% to 65% across more than 150 luxury fashion, sports, and lifestyle designer outlets in a refreshing outdoor mountain breeze.",
      zh: "坐落于半山高原、与阿娃娜缆车站无缝接驳的云顶名牌城，是东南亚首屈一指的露天山景名品折扣天堂。两层台阶式的开放建筑设计，让宾客在凉爽怡人的山间微风中，悠然徜徉于逾150家国际奢侈大牌、户外运动与生活方式精品店之间，常年享受超值优惠。",
      ms: "GHPO menawarkan diskaun hebat bagi barangan berjenama terkenal dalam suasana membeli-belah tanah tinggi yang menyegarkan.",
      ja: "アワナ駅直結のアウトレットモール。涼しい高原の風を感じながら、一流ブランドのショッピングやカフェ巡りを満喫できます。",
      ko: "아와나 케이블카 터미널과 연결된 쇼핑 천국으로, 시원한 산바람을 맞으며 유명 패션 및 스포츠 브랜드의 할인 쇼핑을 즐길 수 있습니다."
    },
    interestingFacts: [
      {
        en: 'The outdoor streets are built on a south-facing hillside angled to capture natural mountain valley air currents throughout the afternoon.',
        zh: '整个露天购物街区依南向山势梯次修建，经过精心气流测算，能够全天候吸纳山谷中徐徐吹来的清爽凉风。',
        ms: 'Reka bentuk terbuka GHPO memanfaatkan tiupan angin sejuk dari lurah pergunungan sekitarnya.'
      }
    ],
    facilities: {
      restroom: 'Full luxury restroom suites across both Middle and High Street levels.',
      prayerRoom: 'Spacious male and female surau facilities with ablution areas.',
      parking: 'Multi-level parking building with thousands of sheltered bays.',
      pickupSuitability: 'Direct passenger drop-off plaza at the main fountain entrance.'
    },
    sourceReferences: ['Simon Property Group & Genting Plantations'],
    sourceUrls: ['https://www.premiumoutlets.com.my'],
    verificationStatus: 'approved',
    lastVerified: '2025-06-18',
    heroVisual: {
      type: 'photo',
      imageUrl: '',
      fallbackUrl: '',
      alt: 'Terraced open-air promenade of Genting Highlands Premium Outlets overlooking green valleys',
      attribution: 'Genting Simon Group',
      focalPoint: 'center'
    }
  },

  'skytropolis-indoor-theme-park': {
    placeId: 'skytropolis-indoor-theme-park',
    name: {
      en: 'Skytropolis Indoor Theme Park',
      zh: '云顶天城室内游乐园 (Skytropolis)',
      ms: 'Taman Tema Dalaman Skytropolis',
      ja: 'スカイトロポリス・インドアテーマパーク',
      ko: '스카이트로폴리스 실내 테마파크'
    },
    destination: 'Genting Highlands',
    category: 'activity',
    coordinates: { lat: 3.4232, lng: 101.7935 },
    triggerRadiusMeters: 400,
    suggestedDurationMinutes: 90,
    durationRange: { minMinutes: 60, maxMinutes: 150 },
    shortIntro: {
      en: 'A futuristic four-storey neon-lit indoor amusement park spanning 400,000 square feet with over 20 exhilarating rides.',
      zh: '占地40万平方英尺的四层未来科幻风格室内霓虹游乐王国，拥有20余项老少皆宜的刺激乘骑与家庭游戏。',
      ms: 'Taman tema tertutup futuristik seluas 400,000 kaki persegi yang diterangi lampu neon dengan lebih 20 permainan menarik.',
      ja: '全天候型の巨大屋内テーマパーク。広さ40万平方フィートの空間に、サイバーパンクなネオンと20種類以上のアトラクションが輝きます。',
      ko: '날씨에 구애받지 않고 즐길 수 있는 40만 평방피트 규모의 대형 실내 테마파크로, 화려한 네온 조명과 20여 종의 어트랙션이 마련되어 있습니다.'
    },
    narration: {
      en: "Spanning more than 400,000 square feet across four dynamic storeys inside First World Plaza, Skytropolis Indoor Theme Park guarantees weather-proof excitement for families and thrill-seekers alike. Bathed in vibrant LED lighting and retro-futuristic decor, the park features over 20 rides classified into Child, Family, and Thrill categories—from whimsical spinning carousels to the dizzying Spin Crazy pendulum ride.",
      zh: "坐落于第一大酒店广场内部、横跨四层楼逾40万平方英尺的天城室内游乐园，为家庭与冒险者提供全天候无惧风雨的狂欢天地。在流光溢彩的霓虹灯影与赛博朋克科幻造型包围下，乐园提供20余种涵盖儿童、亲子与极致挑战的乘骑项目，包括经典的旋转木马与令人屏息的360度超级摆锤。",
      ms: "Skytropolis sesuai untuk semua peringkat umur tanpa terjejas oleh hujan atau cuaca luar.",
      ja: "天候を気にせず遊べる屋内パーク。レトロフューチャーな近未来都市をテーマに、子供向けライドから絶叫系マシンまで揃っています。",
      ko: "비나 안개 등 날씨 걱정 없이 즐길 수 있는 가족형 실내 테마파크로, 아기자기한 회전목마부터 아찔한 스릴 라이드까지 다양합니다."
    },
    interestingFacts: [
      {
        en: 'The ceiling is covered by massive dynamic LED panels that change colours and display cosmic starfields throughout the day.',
        zh: '游乐园天花板安装了全域动态LED巨幕系统，随着时间推移实时变换出浩瀚银河与梦幻星空色彩。',
        ms: 'Siling dewan dilengkapi panel LED gergasi yang memaparkan visual bintang dan galaksi dinamik.'
      }
    ],
    facilities: {
      restroom: 'Restrooms available inside First World Plaza surrounding the ride concourse.',
      prayerRoom: 'Available in First World Plaza.',
      parking: 'First World Hotel parking garage.',
      pickupSuitability: 'First World Hotel bus and van lobby drop-off.'
    },
    sourceReferences: ['Resorts World Genting'],
    sourceUrls: ['https://www.rwgenting.com'],
    verificationStatus: 'approved',
    lastVerified: '2025-06-25',
    heroVisual: {
      type: 'photo',
      imageUrl: '',
      fallbackUrl: '',
      alt: 'Neon illuminated indoor rides and carousel in Skytropolis Theme Park',
      attribution: 'Resorts World Genting',
      focalPoint: 'center'
    }
  },

  'genting-strawberry-leisure-farms': {
    placeId: 'genting-strawberry-leisure-farms',
    name: {
      en: 'Genting Strawberry Leisure Farms',
      zh: '云顶草莓休闲农场 (Genting Strawberry Farm)',
      ms: 'Taman Santai Strawberi Genting',
      ja: 'ゲンティン・ストロベリー・レジャーファーム',
      ko: '겐팅 딸기 레저 농장'
    },
    destination: 'Genting Highlands',
    category: 'nature',
    coordinates: { lat: 3.3998, lng: 101.7712 },
    triggerRadiusMeters: 400,
    suggestedDurationMinutes: 60,
    durationRange: { minMinutes: 45, maxMinutes: 75 },
    shortIntro: {
      en: 'A delightful family agro-farm featuring hand-picked sweet hydroponic strawberries, lavender gardens, and fresh strawberry teas.',
      zh: '适宜全家同乐的高原生态农庄，体验亲手采摘水培甜草莓、漫步薰衣草花圃并品尝草莓甜点。',
      ms: 'Ladang agro pelancongan mesra keluarga dengan aktiviti memetik strawberi segar hidroponik dan taman bunga lavender.',
      ja: '標高の涼しさを活かしたストロベリー農園。甘いイチゴ狩り体験のほか、ラベンダー畑や自家製イチゴスイーツを楽しめます。',
      ko: '가족 단위 방문객에게 인기 있는 농촌 체험 농장으로, 신선한 수경재배 딸기를 직접 수확하고 라벤더 정원을 산책할 수 있습니다.'
    },
    narration: {
      en: "Located near Gohtong Jaya in the cool foothills, Genting Strawberry Leisure Farm is one of the largest strawberry farms in Malaysia. Visitors can harvest their own juicy red strawberries from elevated hydroponic benches, walk through vibrant lavender garden displays, and sample artisanal strawberry juices, milkshakes, and pastries at the farm cafe.",
      zh: "坐落在梧桐再也近郊清凉山麓地带的云顶草莓休闲农场，是马来西亚首屈一指的大型温带草莓种植基地。游客可以在高架无土水培种植架上亲手挑选采摘水嫩欲滴的红草莓，漫步于紫色的薰衣草景观花园，并在农庄咖啡馆品尝新鲜现调的草莓冰沙、华夫饼与纯手工草莓果酱。",
      ms: "Pengunjung berpeluang memetik sendiri strawberi segar dan menikmati jus strawberi asli di kafe ladang.",
      ja: "涼しい気候を利用した観光農園。高設栽培のイチゴを自分で摘み取ったり、併設カフェで濃厚なストロベリーシェイクを味わったりできます。",
      ko: "신선한 딸기 따기 체험을 할 수 있는 고원 농장으로, 딸기 밀크셰이크와 디저트를 파는 카페와 아름다운 꽃밭이 함께 조성되어 있습니다."
    },
    interestingFacts: [
      {
        en: 'The farm utilizes specialised greenhouse bumblebees imported to sustainably pollinate the strawberry blossoms throughout the year.',
        zh: '农场特别引进了温室熊蜂进行天然授粉，确保草莓花全年都能通过安全自然的生态链结出甜美硕果。',
        ms: 'Ladang ini menggunakan lebah khusus yang diimport bagi proses pendebungaan semula jadi di dalam rumah kaca.'
      }
    ],
    facilities: {
      restroom: 'Restrooms available inside the farm cafe complex.',
      prayerRoom: 'Available near the ticket entrance gate.',
      parking: 'Dedicated open car and tour van parking lot.',
      pickupSuitability: 'Direct drop-off bay at the farm entrance archway.'
    },
    sourceReferences: ['Genting Strawberry Farm Management', 'Pahang Tourism'],
    sourceUrls: ['https://www.pahangtourism.org.my'],
    verificationStatus: 'approved',
    lastVerified: '2025-06-18',
    heroVisual: {
      type: 'photo',
      imageUrl: '',
      fallbackUrl: '',
      alt: 'Hydroponic strawberry greenhouses and lavender flower gardens on hillside',
      attribution: 'Tourism Pahang',
      focalPoint: 'center'
    }
  }
};
