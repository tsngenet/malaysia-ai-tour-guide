/**
 * Attraction Library
 * Independent from Tours: One attraction can belong to many tours.
 * Includes coordinates, trigger radii (meters), multilingual narration, 
 * historical context, practical visitor info, facilities, and source references.
 */

export const ATTRACTIONS = {
  'batu-caves': {
    placeId: 'batu-caves',
    name: {
      en: 'Batu Caves',
      zh: '黑风洞 (Batu Caves)',
      ms: 'Batu Caves',
      ja: 'バトゥ洞窟',
      ko: '바투 동굴'
    },
    coordinates: { lat: 3.2379, lng: 101.6840 },
    triggerRadiusMeters: 600,
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

  'putra-mosque': {
    placeId: 'putra-mosque',
    name: {
      en: 'Putra Mosque (Pink Mosque)',
      zh: '布特拉清真寺 (粉红清真寺)',
      ms: 'Masjid Putra',
      ja: 'プトラ・モスク (ピンクモスク)',
      ko: '푸트라 모스크 (핑크 모스크)'
    },
    coordinates: { lat: 2.9361, lng: 101.6891 },
    triggerRadiusMeters: 500,
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
    coordinates: { lat: 2.9388, lng: 101.6928 },
    triggerRadiusMeters: 450,
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

  'dutch-square': {
    placeId: 'dutch-square',
    name: {
      en: 'Dutch Square & Christ Church (Melaka)',
      zh: '马六甲荷兰红屋与基督堂',
      ms: 'Dataran Belanda & Gereja Christ Melaka',
      ja: 'オランダ広場 & クライストチャーチ (マラッカ)',
      ko: '네덜란드 광장 & 크라이스트 처치 (멜라카)'
    },
    coordinates: { lat: 2.1944, lng: 102.2492 },
    triggerRadiusMeters: 400,
    shortIntro: {
      en: 'The famous terracotta-red square in UNESCO Heritage Melaka, preserving centuries of Dutch, British, and Peranakan colonial heritage.',
      zh: '联合国教科文组织世界遗产马六甲红屋广场，完好保留了荷兰、英国与娘惹文化的数百年历史印记。',
      ms: 'Dataran merah bata ikonik di Melaka yang diiktiraf UNESCO, menyimpan warisan kolonial Belanda dan British.',
      ja: 'ユネスコ世界遺産マラッカの中心地。鮮やかなサーモンピンク・赤レンガ色の建物が立ち並ぶオランダ広場です。',
      ko: '유네스코 세계문화유산 멜라카의 상징적인 붉은 광장으로, 네덜란드와 영국의 식민지 역사 및 페라나칸 문화가 깃들어 있습니다.'
    },
    narration: {
      en: "We have reached Dutch Square in Melaka, celebrated for its terracotta-red buildings. Built by the Dutch administration in 1650, The Stadthuys is believed to be the oldest surviving Dutch building in Asia. Right beside it stands Christ Church, built in 1753 from Dutch bricks brought as ship ballast. Listen for the upbeat music of Melaka's brightly decorated trishaws cruising through the square!",
      zh: "我们已经抵达马六甲著名的荷兰红屋广场。建于1650年的总督府（Stadthuys）被认为是亚洲现存最古老的荷兰行政建筑。紧挨着它的是建于1753年的基督堂，建筑采用当年荷兰商船用作压舱物的红砖砌成。广场上随时回荡着花枝招展的三轮车带来的欢快音乐！",
      ms: "Kita telah tiba di Dataran Belanda Melaka yang terkenal dengan bangunan merah terakota. Dibina oleh Belanda pada tahun 1650, Stadthuys adalah bangunan pentadbiran Belanda tertua di Asia. Di sebelahnya ialah Gereja Christ yang dibina menggunakan batu bata yang dibawa dari Zeeland, Belanda.",
      ja: "世界遺産マラッカの「オランダ広場」に到着しました。1650年にオランダ東インド会社によって建設されたスタダイス（旧総督公邸）は、アジア最古のオランダ建築とされています。隣のキリスト教会は1753年築。ド派手な装飾と音楽で駆け抜ける名物トライショー（人力車）の音にも耳を澄ませてみてください！",
      ko: "멜라카의 대표 명소인 네덜란드 광장에 도착했습니다. 1650년 네덜란드령 시절 총독 관저로 지어진 '스타더이스(The Stadthuys)'는 아시아에서 가장 오래된 네덜란드 건축물입니다. 옆의 크라이스트 처치는 1753년에 건축되었습니다. 광장을 누비는 화려한 트라이쇼(인력거)의 신나는 음악도 즐겨보세요!"
    },
    interestingFacts: [
      {
        en: 'The buildings were originally white, but painted terracotta red in 1911 by British administrators to hide stains and reduce maintenance.',
        zh: '红屋建筑原本为白色，英国殖民者在1911年将其涂刷为红砖色，以掩盖泥渍并降低维护费用。',
        ms: 'Bangunan ini asalnya berwarna putih, tetapi dicat merah pada tahun 1911 oleh British bagi menjimatkan kos penyelenggaraan.'
      }
    ],
    facilities: {
      restroom: 'Public restrooms located near the Melaka River waterfront behind Stadthuys (RM 0.50).',
      prayerRoom: 'Nearby at Kampung Kling historic mosque (5 minutes walk across the river).',
      parking: 'Limited street parking; designated tour buses park at Taman Merdeka terminal.',
      pickupSuitability: 'Drop-off bay opposite the Tan Beng Swee clocktower.'
    },
    sourceReferences: ['Melaka World Heritage Office', 'Perbadanan Muzium Melaka (PERZIM)'],
    lastVerified: '2025-06-01',
    heroVisual: {
      type: 'photo',
      imageUrl: '',
      fallbackUrl: '',
      alt: 'Historic terracotta-red Dutch Square and Stadthuys in Melaka UNESCO heritage zone',
      attribution: 'Melaka World Heritage Office',
      focalPoint: 'center'
    }
  },

  'a-famosa': {
    placeId: 'a-famosa',
    name: {
      en: 'A Famosa (Porta de Santiago)',
      zh: '法摩沙堡圣地亚哥古城门 (A Famosa)',
      ms: 'Kota A Famosa (Porta de Santiago)',
      ja: 'ファモサ要塞 (サンチャゴ砦)',
      ko: '에이 파모사 (산티아고 요새)'
    },
    coordinates: { lat: 2.1919, lng: 102.2505 },
    triggerRadiusMeters: 350,
    shortIntro: {
      en: 'The remnant stone fortress gate built by the Portuguese in 1511, among the oldest European architectural remains in Southeast Asia.',
      zh: '葡萄牙殖民者于1511年筑造的石砌要塞遗址，是东南亚现存最古老的欧洲建筑遗迹之一。',
      ms: 'Pintu gerbang kubu batu Portugis yang dibina pada tahun 1511, peninggalan Eropah tertua di Asia Tenggara.',
      ja: '1511年にポルトガル軍が築いた東南アジア最古のヨーロッパ要塞跡。現在はこのサンチャゴ門のみが残されています。',
      ko: '1511년 포르투갈 침략군이 건설한 동남아시아에서 가장 오래된 유럽식 요새의 남은 성문(산티아고 문)입니다.'
    },
    narration: {
      en: "Standing at the foot of St. Paul's Hill is Porta de Santiago, the sole surviving gate of the massive Portuguese fortress 'A Famosa'. Commissioned by Afonso de Albuquerque in 1511 after conquering Melaka, the fortress changed hands to the Dutch and later the British. In 1807, the British ordered the fortress demolished, but Sir Stamford Raffles intervened just in time to save this single historic gate.",
      zh: "矗立在圣保罗山脚下的是圣地亚哥门，这是葡萄牙庞大军事要塞“法摩沙堡”仅存的城门遗址。由葡萄牙将领阿方索·德·阿尔布克尔克于1511年征服马六甲后修建。1807年英国人下令彻底炸毁要塞，幸得新加坡开埠者莱佛士爵士紧急干预，才挽救下这座唯一的古老石门。",
      ms: "Terletak di kaki Bukit St. Paul, Porta de Santiago merupakan satu-satunya pintu gerbang yang tinggal daripada kubu besar Portugis 'A Famosa' yang dibina pada 1511. Kubu ini hampir dimusnahkan oleh British pada 1807 sebelum diselamatkan oleh Sir Stamford Raffles.",
      ja: "セントポールの丘のふもとに残る「サンチャゴ門」は、ポルトガルが1511年に建設した巨大要塞ファモサの唯一の現存部分です。1807年にイギリス軍により要塞全体が爆破されかけましたが、ラッフルズ卿の嘆願によりこの門だけが奇跡的に保存されました。",
      ko: "세인트 폴 언덕 아래 서 있는 산티아고 문은 1511년 포르투갈이 지은 대형 요새 '에이 파모사'의 유일한 현존 관문입니다. 1807년 영국군이 요새를 전면 폭파하려 했으나, 래플스 경의 적극적인 만류로 이 문만 보존될 수 있었습니다."
    },
    interestingFacts: [
      {
        en: 'The fortress walls were originally constructed with laterite stone taken from destroyed Malay sultanate graves and palaces.',
        zh: '要塞初建时使用的红土石，部分取自被摧毁的马六甲苏丹王陵与王宫建筑。',
        ms: 'Batu laterit yang digunakan membina kubu asalnya diambil daripada binaan Kesultanan Melayu yang musnah.'
      }
    ],
    facilities: {
      restroom: 'Restrooms available inside the adjacent Melaka Sultanate Palace Museum grounds.',
      prayerRoom: 'Available in Dataran Pahlawan shopping mall across the road.',
      parking: 'Underground parking at Dataran Pahlawan / Mahkota Parade.',
      pickupSuitability: 'Drop-off bay at Jalan Kota museum row.'
    },
    sourceReferences: ['National Heritage Department', 'UNESCO World Heritage Centre'],
    lastVerified: '2025-05-18',
    heroVisual: {
      type: 'photo',
      imageUrl: '',
      fallbackUrl: '',
      alt: 'Porta de Santiago historical stone fortress gate at the base of St. Paul Hill',
      attribution: 'Jabatan Warisan Negara',
      focalPoint: 'center'
    }
  },

  'jonker-street': {
    placeId: 'jonker-street',
    name: {
      en: 'Jonker Street (Jalan Hang Jebat)',
      zh: '马六甲鸡场街 (Jonker Street)',
      ms: 'Jalan Jonker (Jalan Hang Jebat)',
      ja: 'ジョンカーストリート (チャイナタウン)',
      ko: '존커 스트리트 (야시장 및 차이나타운)'
    },
    coordinates: { lat: 2.1953, lng: 102.2478 },
    triggerRadiusMeters: 300,
    shortIntro: {
      en: 'The vibrant heart of Melaka Chinatown, renowned for antique galleries, authentic Nyonya delicacies, and bustling weekend night markets.',
      zh: '马六甲唐人街的心脏地带，以古董店、正宗娘惹佳肴以及热闹非凡的周末夜市闻名遐迩。',
      ms: 'Nadi Chinatown Melaka yang meriah dengan kedai antik, masakan Nyonya asli, dan pasar malam hujung minggu.',
      ja: 'マラッカの中華街（チャイナタウン）の中心街。アンティークショップ、本格的なニョニャ料理、活気あふれるナイトマーケットが人気です。',
      ko: '멜라카 차이나타운의 중심지로 골동품 상점, 전통 뇨냐 요리, 주말 야시장으로 유명합니다.'
    },
    narration: {
      en: "Crossing the bridge over the Melaka River brings us into Jonker Street. Formerly a quiet residential haven for rich Dutch and Baba-Nyonya merchants, today it bursts with local flavours—from chicken rice balls and laksa to sweet gula Melaka cendol. On Friday, Saturday, and Sunday evenings, the street is closed to vehicles and transforms into an energetic open-air night market.",
      zh: "穿过马六甲河上的桥梁，我们就进入了著名的鸡场街。这里早年曾是富裕荷兰官员与娘惹侨领的深宅大院聚集地，如今汇聚了地道美味——从香滑的海南鸡饭粒、娘惹叻沙到浓郁的椰糖煎蕊（Cendol）。每逢周五至周日傍晚，街道封路变身为热气腾腾的周末夜市。",
      ms: "Menyeberangi jambatan Sungai Melaka membawa kita ke Jonker Street. Pernah menjadi kediaman saudagar Belanda dan Baba-Nyonya terkemuka, kini ia terkenal dengan hidangan nasi ayam bebola, laksa Nyonya, dan cendol gula Melaka.",
      ja: "マラッカ川を渡るとジョンカーストリートです。かつて富裕なババ・ニョニャ商人の豪邸が並んでいたこの通りは、現在チキンライスボールやニョニャ・ラクサ、グラマラッカ（椰子糖）のチェンドルなど、絶品ご当地グルメの宝庫です。週末の夜は歩行者天国となり大賑わいのナイトマーケットに変わります。",
      ko: "멜라카 강을 건너면 존커 스트리트가 펼쳐집니다. 과거 네덜란드 귀족과 부유한 바바뇨냐 가문의 거주지였던 이곳은 오늘날 치킨라이스볼, 뇨냐 락사, 첸돌 등 말레이시아 대표 미식의 중심지입니다. 주말 저녁에는 차량이 통제되며 활기찬 야시장이 열립니다."
    },
    interestingFacts: [
      {
        en: 'The street name "Jonker" originates from the Dutch word "Jonkheer", which referred to noble young gentlemen.',
        zh: '“Jonker”一词源自荷兰语“Jonkheer”，意指有贵族头衔的年轻绅士。',
        ms: 'Nama "Jonker" berasal dari perkataan Belanda "Jonkheer" yang merujuk kepada golongan bangsawan muda.'
      }
    ],
    facilities: {
      restroom: 'Restrooms located along several heritage cafe premises and inside Jonker Walk Stage complex.',
      prayerRoom: 'Kampung Kling Mosque at nearby Harmony Street.',
      parking: 'Dedicated parking near Casa Del Rio or Jonker Walk open carparks.',
      pickupSuitability: 'Drop-off at the river bridge junction near San Shu Gong confectionery building.'
    },
    sourceReferences: ['Melaka Historic City Council (MBMB)', 'Melaka Tourism'],
    lastVerified: '2025-07-01',
    heroVisual: {
      type: 'photo',
      imageUrl: '',
      fallbackUrl: '',
      alt: 'Jonker Street heritage streetscape, Baba-Nyonya shophouses and weekend night market',
      attribution: 'Melaka Tourism',
      focalPoint: 'center'
    }
  }
};

export function getAttractionById(placeId) {
  if (!placeId) return null;
  return ATTRACTIONS[placeId] || null;
}

export function getAllAttractions() {
  return Object.values(ATTRACTIONS);
}
