/**
 * Attractions: Kuala Lumpur & Putrajaya
 */

export const KL_PUTRAJAYA_ATTRACTIONS = {
  'batu-caves': {
    placeId: 'batu-caves',
    name: {
      en: 'Batu Caves',
      zh: '黑风洞 (Batu Caves)',
      ms: 'Batu Caves',
      ja: 'バトゥ洞窟',
      ko: '바투 동굴'
    },
    destination: 'Kuala Lumpur',
    category: 'culture',
    coordinates: { lat: 3.2379, lng: 101.6840 },
    triggerRadiusMeters: 600,
    suggestedDurationMinutes: 75,
    durationRange: { minMinutes: 45, maxMinutes: 120 },
    shortIntro: {
      en: 'A 400-million-year-old limestone hill featuring monumental temple caves and the colossal golden Lord Murugan statue.',
      zh: '拥有4亿年历史的石灰岩溶洞群，以42.7米高的金色室建陀巨像和272级彩色天梯闻名。',
      ms: 'Bukit batu kapur berusia 400 juta tahun yang mempunyai gua kuil ikonik serta patung Dewa Murugan gergasi.',
      ja: '4億年の歴史を持つ石灰岩の丘。巨大な黄金のムルガン神像と272段の極彩色階段で知られるヒンドゥー教の聖地です。',
      ko: '4억 년 역사의 석회암 동굴로, 42.7m 높이의 황금 무루간 상과 272개의 무지개 계단으로 유명한 힌두교 성지입니다.'
    },
    narration: {
      en: "Rising dramatically above northern Kuala Lumpur, Batu Caves is one of the most sacred Hindu shrines outside of India. The giant golden statue of Lord Murugan at the entrance stands 42.7 metres tall and took three years to construct. To reach Temple Cave, pilgrims and visitors climb 272 brightly painted steps. Keep your snacks tucked away, as the mischievous long-tailed macaque monkeys on the stairs love taking food directly from passengers' hands!",
      zh: "黑风洞高耸于吉隆坡北部，是印度境外最重要的印度教朝圣地之一。洞穴入口矗立着高达42.7米的金色穆鲁干神像，耗时三年建成。要到达主庙洞，访客需要攀爬272级色彩斑斓的台阶。请务必收好手中的食物和水瓶，沿途活泼的长尾猕猴随时可能会伸手拿走！",
      ms: "Menjulang tinggi di utara Kuala Lumpur, Batu Caves merupakan antara kuil Hindu paling suci di luar India. Patung keemasan Dewa Murugan setinggi 42.7 meter di pintu masuk dibina selama 3 tahun. Untuk sampai ke Gua Kuil, pelawat perlu mendaki 272 anak tangga berwarna-warni. Berhati-hati dengan monyet liar di sepanjang tangga yang gemar mengambil makanan!",
      ja: "クアラルンプール北部にそびえるバトゥ洞窟は、インド国外で最も神聖なヒンドゥー教の聖地のひとつです。入口に立つ高さ42.7メートルの黄金のムルガン神像は圧巻です。神殿洞窟へは272段のカラフルな階段を登ります。階段にいるサルはお菓子やペットボトルを狙ってきますので、手荷物にはご注意ください。",
      ko: "쿠알라룸푸르 북부에 위치한 바투 동굴은 인도 외 지역에서 가장 신성시되는 힌두교 성지입니다. 입구의 42.7미터 높이 황금 무루간 신상은 3년에 걸쳐 완성되었습니다. 주 동굴로 가려면 272개의 알록달록한 계단을 올라야 합니다. 계단에 서식하는 야생 원숭이들이 음식이나 소지품을 가져갈 수 있으니 주의하세요!"
    },
    interestingFacts: [
      {
        en: 'The limestone forming the caves is calculated to be around 400 million years old.',
        zh: '形成黑风洞的石灰岩据测算已有约4亿年历史。',
        ms: 'Batu kapur yang membentuk gua ini dianggarkan berusia sekitar 400 juta tahun.'
      },
      {
        en: 'The 272 steps were originally built from wood in 1920 and later replaced with concrete.',
        zh: '这272级台阶于1920年最初由木材建造，后来改建为混凝土阶梯。',
        ms: '272 anak tangga ini asalnya dibina daripada kayu pada tahun 1920 sebelum diganti konkrit.'
      }
    ],
    facilities: {
      restroom: 'Public restrooms available near the base entrance (nominal RM 0.50 coin fee).',
      prayerRoom: 'Hindu temple facilities inside; local surau accessible nearby outside the compound.',
      parking: 'Designated tour bus and car park directly in front of the lower plaza.',
      pickupSuitability: 'Excellent dedicated curb drop-off lane for tour vans and private hires.',
      dressCode: 'Shoulders and knees must be covered to enter temple caverns; sarongs can be rented on-site.'
    },
    sourceReferences: ['Tourism Malaysia', 'National Heritage Department (Jabatan Warisan Negara)'],
    sourceUrls: ['https://www.malaysia.travel/explore/batu-caves'],
    verificationStatus: 'approved',
    lastVerified: '2025-06-15',
    heroVisual: {
      type: 'aerial',
      imageUrl: '',
      fallbackUrl: '',
      alt: 'Aerial view of Batu Caves limestone hill and golden Murugan statue',
      attribution: 'Jabatan Warisan Negara',
      focalPoint: 'center'
    }
  },

  'petronas-twin-towers': {
    placeId: 'petronas-twin-towers',
    name: {
      en: 'Petronas Twin Towers (KLCC)',
      zh: '双子塔 (KLCC)',
      ms: 'Menara Berkembar Petronas',
      ja: 'ペトロナスツインタワー',
      ko: '페트로나스 트윈 타워'
    },
    destination: 'Kuala Lumpur',
    category: 'viewpoint',
    coordinates: { lat: 3.1579, lng: 101.7116 },
    triggerRadiusMeters: 500,
    suggestedDurationMinutes: 60,
    durationRange: { minMinutes: 30, maxMinutes: 90 },
    shortIntro: {
      en: 'World-famous 88-storey twin skyscrapers featuring an Islamic eight-pointed star footprint and the iconic skybridge.',
      zh: '闻名全球的88层双子摩天大楼，拥有伊斯兰八角星几何截面与标志性双层空中天桥。',
      ms: 'Menara berkembar 88 tingkat bertaraf dunia berteraskan geometri bintang lapan Islam dan jambatan udara ikonik.',
      ja: '高さ452mを誇る88階建ての世界一高いツインタワー。イスラム伝統の八角星幾何学とスカイブリッジがシンボルです。',
      ko: '높이 452m의 88층 쌍둥이 타워로, 이슬람 전통 8각 별 문양과 41~42층의 스카이브리지가 대표적입니다.'
    },
    narration: {
      en: "Soaring 452 metres into the skyline, the Petronas Twin Towers were the tallest buildings in the world from 1998 to 2004 and remain the tallest twin towers on Earth. Designed by architect Cesar Pelli, their stainless steel and glass facades reflect Malaysia's forward-looking spirit while honouring Islamic geometric motifs. The double-decker Skybridge connects the two towers at floors 41 and 42.",
      zh: "高达452米的国家石油公司双子塔在1998至2004年间曾是全球最高建筑，至今仍是世界最高的双子大楼。由建筑大师西萨·佩里设计，其不锈钢与反光玻璃外立面完美展现了马来西亚迈向未来的雄心与伊斯兰几何美学。",
      ms: "Menjulang setinggi 452 meter, Menara Berkembar Petronas adalah mercu tanda kebanggaan Malaysia. Direka oleh arkitek Cesar Pelli, bangunan ini melambangkan kemajuan negara berteraskan tradisi Islam.",
      ja: "高さ452mのペトロナスツインタワーは、世界で最も高いツインタワー建築です。建築家シーザー・ペリが設計し、イスラムの八芒星をモチーフにした優美なデザインが特徴です。",
      ko: "452m 높이의 페트로나스 트윈 타워는 세계에서 가장 높은 쌍둥이 빌딩입니다. 세사르 펠리가 설계하였으며, 밤에는 은빛 보석처럼 빛나는 야경이 장관을 이룹니다."
    },
    interestingFacts: [
      {
        en: 'The Skybridge is not rigidly attached to either tower; it slides in and out of slots to prevent cracking during strong winds.',
        zh: '双层天桥并非硬性固定在两座塔楼之间，而是采用活动滑动节点，以防强风晃动时断裂。',
        ms: 'Jambatan udara tidak dipasang mati, ia direka untuk menggelongsor mengikut hayunan angin kencang.'
      }
    ],
    facilities: {
      restroom: 'Available inside Suria KLCC shopping mall on every floor.',
      prayerRoom: 'Multiple surau located within Suria KLCC and concourse level.',
      parking: 'Extensive underground basement parking at Suria KLCC.',
      pickupSuitability: 'Dedicated tour drop-off lane at KLCC Main Entrance.',
      dressCode: 'Smart casual for Skybridge observation deck tours.'
    },
    sourceReferences: ['PETRONAS Twin Towers Management', 'Tourism Malaysia'],
    sourceUrls: ['https://www.petronastwintowers.com.my'],
    verificationStatus: 'approved',
    lastVerified: '2025-06-10',
    heroVisual: {
      type: 'photo',
      imageUrl: '',
      fallbackUrl: '',
      alt: 'Petronas Twin Towers illuminated at dusk',
      attribution: 'Tourism Malaysia',
      focalPoint: 'center'
    }
  },

  'merdeka-square': {
    placeId: 'merdeka-square',
    name: {
      en: 'Merdeka Square (Dataran Merdeka)',
      zh: '独立广场 (Dataran Merdeka)',
      ms: 'Dataran Merdeka',
      ja: 'ムルデカ・スクエア (独立広場)',
      ko: '메르데카 광장 (독립 광장)'
    },
    destination: 'Kuala Lumpur',
    category: 'heritage',
    coordinates: { lat: 3.1486, lng: 101.6938 },
    triggerRadiusMeters: 400,
    suggestedDurationMinutes: 45,
    durationRange: { minMinutes: 30, maxMinutes: 60 },
    shortIntro: {
      en: 'The historic green where the Malayan union flag was lowered and independence was proclaimed at midnight in 1957.',
      zh: '马来西亚历史发祥地，1957年8月31日子夜英国国旗降下、马来亚独立国旗首次升起的广阔绿地。',
      ms: 'Dataran bersejarah di mana bendera Malaya dikibarkan buat kali pertama pada tengah malam 31 Ogos 1957.',
      ja: '1957年8月31日にマレーシアの独立が宣言され、国旗が初めて掲揚された歴史的な広場です。',
      ko: '1957년 8월 31일 영국의 통치가 끝나고 말레이시아의 독립이 선포된 유서 깊은 광장입니다.'
    },
    narration: {
      en: "Here at Merdeka Square, Malaysia's modern nationhood was born on August 31, 1957. Opposite the vast cricket green stands the Sultan Abdul Samad Building, constructed in 1897 with copper domes and Moorish-style arches. At the southern end flies one of the world's tallest flagpoles, standing 95 metres tall.",
      zh: "独立广场是马来西亚国家独立的摇篮。1957年8月31日，英国国旗在此缓缓降下，象征着国家新生的马来西亚国旗首次飘扬。广场对面是建于1897年的苏丹阿都沙末大厦，有着迷人的摩尔式拱门与铜制圆顶。",
      ms: "Di Dataran Merdeka inilah lahirnya negara merdeka Malaysia pada 31 Ogos 1957. Menghadap dataran ialah Bangunan Sultan Abdul Samad yang siap dibina pada tahun 1897 dengan seni bina Moorish.",
      ja: "ムルデカ（独立）広場は、1957年8月31日にマラヤの独立が宣言された記念すべき場所です。向かいには1897年建造の美しいムーア様式のスルタン・アブドゥル・サマド・ビルが建っています。",
      ko: "메르데카 광장은 1957년 8월 31일 말레이시아가 독립을 선포한 역사적 현장입니다. 잔디광장 맞은편에는 무어 양식의 술탄 압둘 사마드 빌딩이 웅장하게 서 있습니다."
    },
    interestingFacts: [
      {
        en: 'The 95-metre flagpole marks the exact spot where the Union Jack was lowered.',
        zh: '95米高的独立旗杆所在地，正是当年英国联合杰克旗降下的确切位置。',
        ms: 'Tiang bendera setinggi 95 meter menandakan tempat sebenar bendera Union Jack diturunkan.'
      }
    ],
    facilities: {
      restroom: 'Underground public toilets below Dataran Merdeka plaza.',
      prayerRoom: 'Available in the underground plaza and nearby Jamek Mosque.',
      parking: 'Dataran Underground parking garage.',
      pickupSuitability: 'Designated curb drop-off zone on Jalan Raja.'
    },
    sourceReferences: ['Kuala Lumpur City Hall (DBKL)', 'National Heritage Department'],
    sourceUrls: ['https://www.dbkl.gov.my'],
    verificationStatus: 'approved',
    lastVerified: '2025-06-12',
    heroVisual: {
      type: 'photo',
      imageUrl: '',
      fallbackUrl: '',
      alt: 'Merdeka Square with Sultan Abdul Samad Building',
      attribution: 'DBKL',
      focalPoint: 'center'
    }
  },

  'putra-mosque': {
    placeId: 'putra-mosque',
    name: {
      en: 'Putra Mosque (Pink Mosque)',
      zh: '布特拉清真寺 (粉红清真寺)',
      ms: 'Masjid Putra',
      ja: 'プトラ・モスク (ピンクモスク)',
      ko: '푸트라 모스크 (핑크 모스크)'
    },
    destination: 'Putrajaya',
    category: 'culture',
    coordinates: { lat: 2.9361, lng: 101.6891 },
    triggerRadiusMeters: 500,
    suggestedDurationMinutes: 50,
    durationRange: { minMinutes: 30, maxMinutes: 75 },
    shortIntro: {
      en: 'The iconic rose-tinted granite mosque facing Putrajaya Lake, blending Persian and traditional Malay architectural craftsmanship.',
      zh: '面朝布城湖的标志性玫瑰色花岗岩清真寺，融合了波斯伊斯兰艺术与传统马来工艺。',
      ms: 'Masjid granit merah jambu ikonik menghadap Tasik Putrajaya yang menggabungkan seni bina Parsi dan Melayu.',
      ja: 'プトラジャヤ湖畔に建つローズピンクの花崗岩でできたモスク。ペルシャと伝統的なマレー建築が融合した美しい景観です。',
      ko: '푸트라자야 호수변에 위치한 상징적인 장미빛 화강암 모스크로, 페르시아와 말레이 전통 건축 양식이 조화를 이룹니다.'
    },
    narration: {
      en: "We are approaching the magnificent Putra Mosque, affectionately known as the Pink Mosque. Completed in 1999, it is built with rose-coloured granite imported from southern Germany. Its soaring 116-metre minaret is among the tallest in the region, inspired by Baghdad's Sheikh Omar Mosque. Up to 15,000 worshippers can gather inside the main prayer hall beneath its nine domes.",
      zh: "我们正在接近宏伟的布特拉清真寺，人们亲切地称它为“粉红清真寺”。清真寺于1999年落成，主体采用从德国南部进口的玫瑰色花岗岩建造。其116米高的宣礼塔是东南亚最高的宣礼塔之一，设计灵感来自巴格达的谢赫·奥马尔清真寺。九座圆顶下的大祈祷厅可容纳多达15,000名信徒。",
      ms: "Kita sedang menghampiri Masjid Putra yang terkenal dengan warna merah jambu lembutnya. Siap dibina pada tahun 1999 dengan batuan granit merah dari Jerman. Menaranya setinggi 116 meter merupakan antara yang tertinggi di rantau ini, manakala dewan solat utamanya mampu menampung 15,000 jemaah.",
      ja: "バラ色の花崗岩で造られた美しい「プトラ・モスク（通称ピンクモスク）」に近づいています。1999年に完成し、高さ116メートルのミナレット（尖塔）は東南アジアでも有数の高さを誇ります。内部の礼拝堂には最大15,000人を収容できます。",
      ko: "부드러운 핑크빛 화강암으로 지어진 푸트라 모스크(핑크 모스크)에 접근하고 있습니다. 1999년에 완공되었으며, 116m 높이의 미나레트는 동남아시아에서 가장 높은 축에 속합니다. 9개의 돔 아래 펼쳐진 대예배실은 최대 15,000명을 수용합니다."
    },
    interestingFacts: [
      {
        en: 'The basements of the mosque are designed to catch cool breeze off Putrajaya Lake, acting as natural climate control.',
        zh: '清真寺底层设计用于引入布城湖面吹来的清凉湖风，形成天然风冷系统。',
        ms: 'Ruang bawah tanah masjid direka untuk menyerap angin sejuk dari Tasik Putrajaya sebagai penyejuk semula jadi.'
      }
    ],
    facilities: {
      restroom: 'Clean underground restrooms with ablution facilities situated beside the tourist entrance.',
      prayerRoom: 'Separate main prayer halls for men and women.',
      parking: 'Underground parking at Dataran Putra and open lots beside Souq Putrajaya.',
      pickupSuitability: 'Drop-off zone directly at Dataran Putra roundabout.',
      dressCode: 'Free robes (robe coverings) are provided for non-Muslim visitors at the entrance counter.'
    },
    sourceReferences: ['Perbadanan Putrajaya', 'Department of Islamic Development Malaysia (JAKIM)'],
    sourceUrls: ['https://www.ppj.gov.my'],
    verificationStatus: 'approved',
    lastVerified: '2025-07-10',
    heroVisual: {
      type: 'satellite',
      imageUrl: '',
      fallbackUrl: '',
      alt: 'Satellite view of rose-tinted Putra Mosque on the waterfront of Putrajaya Lake',
      attribution: 'Perbadanan Putrajaya',
      focalPoint: 'center'
    }
  },

  'perdana-putra': {
    placeId: 'perdana-putra',
    name: {
      en: 'Perdana Putra (Prime Minister’s Office)',
      zh: '首相署大楼 (Perdana Putra)',
      ms: 'Perdana Putra',
      ja: 'ペルダナ・プトラ (マレーシア首相府)',
      ko: '페르다나 푸트라 (총리 관저 및 집무실)'
    },
    destination: 'Putrajaya',
    category: 'heritage',
    coordinates: { lat: 2.9388, lng: 101.6928 },
    triggerRadiusMeters: 450,
    suggestedDurationMinutes: 40,
    durationRange: { minMinutes: 20, maxMinutes: 60 },
    shortIntro: {
      en: 'The administrative heart of Malaysia, featuring distinguished green domes reflecting Mogul and Islamic architectural traditions.',
      zh: '马来西亚行政核心枢纽，独特的绿色圆顶展现出莫卧儿王朝与伊斯兰经典建筑风采。',
      ms: 'Pusat pentadbiran kerajaan Malaysia dengan kubah hijau khas yang menampilkan seni bina Islam Mogul.',
      ja: '緑色のドームが印象的なマレーシアの首相府。ムガール様式とイスラム建築が融合した重厚な外観です。',
      ko: '말레이시아 정부의 중심 집무실로, 녹색 돔이 특징적인 무굴 및 이슬람 양식의 건축물입니다.'
    },
    narration: {
      en: "Overlooking the main ceremonial square stands Perdana Putra, housing the office of the Prime Minister of Malaysia. Constructed in 1997, its striking turquoise-green main dome is framed by clay-coloured palace walls inspired by traditional Malay wood carving and classical Islamic geometry.",
      zh: "俯瞰布城主广场的宏伟建筑就是首相署（Perdana Putra）。建于1997年，醒目的绿松石色主穹顶被陶土色外墙环绕，设计融入了马来传统木雕艺术与古典伊斯兰几何美学。",
      ms: "Menghadap dataran utama Putrajaya, Perdana Putra menempatkan pejabat rasmi Perdana Menteri Malaysia. Dibina pada tahun 1997 dengan kubah hijau firus yang anggun berlatarkan seni ukiran kayu Melayu dan geometri Islam.",
      ja: "広場正面に構えるペルダナ・プトラは、マレーシア連邦政府の首相府です。1997年に建てられ、特徴的なターコイズグリーンのドームと伝統的なマレー彫刻を取り入れた宮殿風の建築が威厳を放っています。",
      ko: "푸트라 광장을 굽어보는 페르다나 푸트라는 말레이시아 총리 집무실입니다. 1997년에 건설되었으며 청록색 돔과 말레이 전통 목조 문양이 결합되어 있습니다."
    },
    interestingFacts: [
      {
        en: 'The natural stone exterior utilizes clay bricks and stone to maintain cooler interior temperatures in tropical heat.',
        zh: '建筑外部采用特殊粘土砖和石材，以帮助热带气候下的室内保持自然凉爽。',
        ms: 'Dinding luaran menggunakan batu bata khas bagi mengekalkan suhu dalaman yang sejuk di iklim tropika.'
      }
    ],
    facilities: {
      restroom: 'Use the tourist restrooms across the street at Dataran Putra / Souq.',
      prayerRoom: 'Available across the esplanade at Putra Mosque.',
      parking: 'Dataran Putra basement parking.',
      pickupSuitability: 'Roundabout driveway for quick photo stops.'
    },
    sourceReferences: ['Prime Minister’s Department of Malaysia (JPM)', 'Perbadanan Putrajaya'],
    sourceUrls: ['https://www.jpm.gov.my'],
    verificationStatus: 'approved',
    lastVerified: '2025-05-20',
    heroVisual: {
      type: 'aerial',
      imageUrl: '',
      fallbackUrl: '',
      alt: 'Aerial view of Perdana Putra administrative complex and Dataran Putra',
      attribution: 'Jabatan Perdana Menteri',
      focalPoint: 'center'
    }
  },

  'putrajaya-lake-cruise': {
    placeId: 'putrajaya-lake-cruise',
    name: {
      en: 'Cruise Tasik Putrajaya & Putra Bridge',
      zh: '布城湖游船与布特拉大桥',
      ms: 'Cruise Tasik Putrajaya & Jambatan Putra',
      ja: 'プトラジャヤ湖クルーズ & プトラ橋',
      ko: '푸트라자야 호수 크루즈 & 푸트라 다리'
    },
    destination: 'Putrajaya',
    category: 'activity',
    coordinates: { lat: 2.9348, lng: 101.6908 },
    triggerRadiusMeters: 400,
    suggestedDurationMinutes: 60,
    durationRange: { minMinutes: 45, maxMinutes: 75 },
    shortIntro: {
      en: 'Scenic lake excursions offering panoramic water perspectives of Putrajaya’s architectural marvels and Iranian-inspired Putra Bridge.',
      zh: '搭乘游船畅游人工湖，从水上角度全景观赏布城宏伟地标与融合伊朗古风的布特拉大桥。',
      ms: 'Pelayaran santai di Tasik Putrajaya melihat mercu tanda seni bina megah dan Jambatan Putra yang berinspirasikan Parsi.',
      ja: 'プトラジャヤ湖を巡る遊覧船。イランのハージュ橋をモデルにした美しいプトラ橋や首相府の絶景を水上から楽しめます。',
      ko: '푸트라자야 인공 호수를 유람하는 크루즈로, 이란 카주 다리에서 영감을 얻은 푸트라 다리와 호숫가 랜드마크를 감상합니다.'
    },
    narration: {
      en: "Tasik Putrajaya is a 650-hectare artificial lake designed to naturally cool the administrative capital. From aboard the cruise, passengers enjoy unobstructed vistas of the Pink Mosque, prime ministerial complex, and modern government bridges. The two-tier Putra Bridge above us spans 435 metres, inspired by the historic Khaju Bridge in Isfahan, Iran.",
      zh: "占地650公顷的布城湖是这座花园智慧城市的心脏。泛舟湖上，可以全方位领略粉红清真寺与现代建筑的壮丽倒影。上方的双层布特拉大桥全长435米，设计灵感来自伊朗伊斯法罕古老的哈柱桥。",
      ms: "Tasik Putrajaya berkeluasan 650 hektar memberikan suasana nyaman dan pemandangan bot yang menakjubkan bagi pelancong.",
      ja: "プトラジャヤ湖は650ヘクタールにおよぶ広大な人工湖です。クルーズ船からはピンクモスクや行政機関の建築美を一望できます。",
      ko: "650헥타르 규모의 인공 호수로, 유람선을 타면 푸트라 모스크와 총리 관저의 물빛 반영을 평화롭게 즐길 수 있습니다."
    },
    interestingFacts: [
      {
        en: 'Traditional handcrafted wooden boats called Dondang Sayang offer intimate, heritage-style lake tours.',
        zh: '除了空调游船外，景区还提供名为“Dondang Sayang”的传统马来木造贡多拉游船。',
        ms: 'Bot kayu tradisional Dondang Sayang memberikan pengalaman pelayaran warisan yang unik.'
      }
    ],
    facilities: {
      restroom: 'Available at the Cruise Tasik Putrajaya jetty terminal ticket hall.',
      prayerRoom: 'Available in the terminal concourse.',
      parking: 'Basement parking at Dataran Putra.',
      pickupSuitability: 'Direct passenger drop-off at waterfront esplanade concourse.'
    },
    sourceReferences: ['Cruise Tasik Putrajaya Sdn Bhd', 'Perbadanan Putrajaya'],
    sourceUrls: ['https://www.cruisetasikputrajaya.com'],
    verificationStatus: 'approved',
    lastVerified: '2025-06-08',
    heroVisual: {
      type: 'photo',
      imageUrl: '',
      fallbackUrl: '',
      alt: 'Cruise boat on Putrajaya Lake passing Putra Bridge',
      attribution: 'Cruise Tasik Putrajaya',
      focalPoint: 'center'
    }
  }
};
