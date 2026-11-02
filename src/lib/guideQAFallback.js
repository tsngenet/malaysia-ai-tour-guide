/**
 * Client & Server Shared Grounded Q&A Provider
 * Answers passenger questions using verified Malaysian destination knowledge
 * when offline or when external AI endpoints are not configured.
 */

export function generateGroundedAnswer({ question = '', placeName = '', stop = null, knowledgeContext = '', language = 'en' }) {
  const q = question.toLowerCase();
  const p = (placeName || stop?.name || '').toLowerCase();

  const isBatuCaves = p.includes('batu') || q.includes('batu') || q.includes('cave');
  const isPutra = p.includes('putra') || p.includes('mosque') || p.includes('pink') || q.includes('mosque') || q.includes('putrajaya');
  const isMelaka = p.includes('melaka') || p.includes('dutch') || p.includes('famosa') || p.includes('jonker') || q.includes('melaka') || q.includes('malacca');

  // 1. Chinese (zh)
  if (language === 'zh') {
    if (q.includes('吃') || q.includes('美食') || q.includes('餐') || q.includes('小吃')) {
      if (isMelaka) return '马六甲最著名的特色美食包括鸡场街的海南鸡饭粒、娘惹叻沙（Nyonya Laksa）、椰糖煎蕊（Cendol）以及娘惹传统糕点。大部分老字号营业至傍晚。';
      if (isBatuCaves) return '黑风洞山下入口处有新鲜现剖椰子水（约RM 6-8）以及地道的南印度飞饼（Roti Canai）与拉茶。建议在寺庙大门外享用。';
      return '马来西亚沿途汇聚了马来、华人与印度多元美食。推荐品尝椰浆饭（Nasi Lemak）、沙爹（Satay）及新鲜热带水果。';
    }
    if (q.includes('衣') || q.includes('服装') || q.includes('着装') || q.includes('礼仪') || q.includes('鞋')) {
      if (isPutra) return '布特拉清真寺要求非穆斯林访客着装遮盖双肩与膝盖，女性需遮盖头发。清真寺游客入口处提供免费连帽红袍租借。';
      if (isBatuCaves) return '进入黑风洞庙宇需穿着过膝裤或长裙，双肩需遮盖。现场也提供围纱租赁服务。阶梯处请注意防猴。';
      return '参观马来西亚宗教及文化场所时，建议穿着得体舒适，双肩与膝盖需遮盖，进入祈祷殿堂前请脱鞋。';
    }
    if (q.includes('照') || q.includes('拍照') || q.includes('取景') || q.includes('拍摄')) {
      if (isPutra) return '最佳取景机位位于布特拉桥（Putra Bridge）人行道上，可拍摄到清真寺粉红穹顶与布城湖倒影的经典全景。';
      if (isBatuCaves) return '站在272级彩虹阶梯底部仰拍，能同时将金色室建陀神像与壮丽天梯完整收入镜头。';
      if (isMelaka) return '红屋广场钟楼正前方，以及马六甲河畔木桥，是拍摄复古荷兰红砖建筑与街头三轮车的最佳视角。';
      return `建议在光线柔和的上午或傍晚取景，${placeName || '此处'}拥有非常独特的建筑与自然轮廓。`;
    }
    if (q.includes('历史') || q.includes('为什么') || q.includes('故事') || q.includes('背景')) {
      if (stop?.narration) return stop.narration;
      return `${placeName || '这个景点'}是马来西亚历史与多元文化的重要代表。融合了丰富的本土风貌与岁月印记，非常值得细细品味。`;
    }
    return `关于【${placeName || '此景点'}】：这是行程中的核心文化地标。您可以边欣赏独特的建筑与历史风貌，边向我们随时询问洗手间、拍照或周边贴士！`;
  }

  // 2. Bahasa Melayu (ms)
  if (language === 'ms') {
    if (q.includes('makan') || q.includes('restoran') || q.includes('snek')) {
      if (isMelaka) return 'Di Melaka dan Jonker Street, anda boleh menikmati nasi ayam bebola, cendol gula Melaka, dan masakan Nyonya asli.';
      if (isBatuCaves) return 'Di kaki tangga Batu Caves, gerai kelapa muda segar (RM 6-8) dan roti canai bersama teh tarik panas sangat disyorkan.';
      return 'Malaysia kaya dengan pelbagai hidangan enak seperti nasi lemak, roti canai, sate dan buah-buahan tropika segar.';
    }
    if (q.includes('pakaian') || q.includes('etika') || q.includes('aurat') || q.includes('kasut')) {
      if (isPutra) return 'Di Masjid Putra, pelawat bukan Islam wajib berpakaian sopan menutup bahu dan lutut. Jubah merah berhud disediakan percuma di kaunter pelawat.';
      if (isBatuCaves) return 'Di Batu Caves, pakaian sopan menutup bahu dan lutut diperlukan untuk menaiki 272 anak tangga ke kuil gua.';
      return 'Bagi lawatan ke tempat ibadat di Malaysia, sila berpakaian sopan dan tanggal kasut sebelum memasuki dewan solat.';
    }
    if (q.includes('gambar') || q.includes('foto') || q.includes('sudut')) {
      if (isPutra) return 'Sudut terbaik adalah dari Jambatan Putra, di mana kubah merah jambu dan pantulan Tasik Putrajaya kelihatan menakjubkan.';
      if (isBatuCaves) return 'Dari dasar tangga berwarna-warni, merakam patung Dewa Murugan setinggi 42.7 meter bersama tangga 272.';
      return 'Ambil gambar menarik dari sudut terbuka berlatarbelakangkan seni bina warisan tempatan.';
    }
    return `Mengenai ${placeName || 'tempat ini'}: Ini adalah mercu tanda menarik di Malaysia. Sila nikmati pemandangan serta warisan sejarah yang unik!`;
  }

  // 3. Japanese (ja)
  if (language === 'ja') {
    if (q.includes('食') || q.includes('グルメ') || q.includes('スナック') || q.includes('レストラン')) {
      if (isMelaka) return 'マラッカでは、名物のチキンライスボール、ニョニャラクサ、グラマラッカ（椰子糖）のチェンドルが必食グルメです。';
      if (isBatuCaves) return 'バトゥ洞窟の入口周辺では、新鮮なココナッツジュース（RM 6〜8）やインド風のロティチャナイが人気です。';
      return 'マレーシアは多彩なグルメの宝庫です。ナシレマッやサテー、新鮮なトロピカルフルーツをぜひお試しください。';
    }
    if (q.includes('服') || q.includes('服装') || q.includes('マナー') || q.includes('靴')) {
      if (isPutra) return 'プトラモスクでは肩と膝を覆う服装が必要です。女性には無料のローブ（ガウン）が入口で貸し出されます。';
      if (isBatuCaves) return '寺院内に入る際は膝と肩が隠れる服装が求められます。ショートパンツの場合は腰巻をレンタルしてください。';
      return '宗教施設を訪れる際は、肩や膝が露出しない服装を心がけ、入場時は靴をお脱ぎください。';
    }
    return `${placeName || 'この観光地'}はマレーシアを代表する文化的名所です。独特の建築様式と歴史的な魅力をぜひお楽しみください。`;
  }

  // 4. Korean (ko)
  if (language === 'ko') {
    if (q.includes('음식') || q.includes('맛집') || q.includes('먹') || q.includes('식사')) {
      if (isMelaka) return '멜라카에서는 닭고기 라이스볼, 뇨냐 락사, 시원한 굴라 멜라카 첸돌을 꼭 맛보세요.';
      if (isBatuCaves) return '바투 동굴 입구에서는 신선한 코코넛 워터(약 RM 6-8)와 로티 차나이를 맛보실 수 있습니다.';
      return '나시 르막, 사테, 카야 토스트 등 말레이시아의 다채로운 로컬 음식을 즐겨보세요.';
    }
    if (q.includes('복장') || q.includes('옷') || q.includes('예절') || q.includes('규정')) {
      if (isPutra) return '푸트라 모스크는 어깨와 무릎을 가리는 복장이 필수입니다. 입구에서 무료 가운을 대여할 수 있습니다.';
      if (isBatuCaves) return '272개 계단을 오르기 전 무릎과 어깨가 가려지는 단정한 복장을 착용해야 합니다.';
      return '사원 및 종교 명소를 방문하실 때는 단정한 복장을 착용하고 신발을 벗고 입장해 주세요.';
    }
    return `${placeName || '이곳'}은 말레이시아의 대표적인 문화 명소입니다. 아름다운 건축물과 흥미로운 이야기를 경험해 보세요.`;
  }

  // 5. Default English (en)
  if (q.includes('food') || q.includes('eat') || q.includes('snack') || q.includes('dish') || q.includes('try')) {
    if (isMelaka) return 'In Melaka, do not miss the famous Hainanese chicken rice balls, traditional spicy Nyonya laksa, and refreshing Gula Melaka cendol near the river!';
    if (isBatuCaves) return 'At the base of Batu Caves, fresh young coconuts (RM 6-8) and hot teh tarik with roti canai are delicious local refreshments.';
    return 'Malaysian cuisine is wonderfully diverse! Be sure to try Nasi Lemak, Roti Canai, Satay, and fresh tropical fruits along today’s journey.';
  }

  if (q.includes('dress') || q.includes('wear') || q.includes('code') || q.includes('etiquette') || q.includes('rule') || q.includes('shoes')) {
    if (isPutra) return 'At Putra Mosque, modest attire covering shoulders and knees is mandatory. Free hooded red robes are provided for visitors at the tourist entrance counter.';
    if (isBatuCaves) return 'At Batu Caves, knees and shoulders must be covered to climb the 272 steps. Sarongs can be rented at the staircase base if needed.';
    return 'For heritage and religious sites in Malaysia, modest dress covering shoulders and knees is required, and shoes must be removed before entering prayer halls.';
  }

  if (q.includes('photo') || q.includes('picture') || q.includes('spot') || q.includes('camera') || q.includes('angle')) {
    if (isPutra) return 'The premier photo vantage point is from the pedestrian walkway of Putra Bridge, capturing the pink dome and minaret reflecting off Putrajaya Lake.';
    if (isBatuCaves) return 'Stand near the base plaza looking up to capture the 42.7m golden Lord Murugan statue alongside all 272 colorful staircase steps.';
    if (isMelaka) return 'Stand opposite the Christ Church clocktower or on the pedestrian bridge over Melaka River for vibrant colonial architectural photos.';
    return `For ${placeName || 'this location'}, morning and late afternoon offer the warmest natural light for photography.`;
  }

  if (q.includes('history') || q.includes('why') || q.includes('built') || q.includes('story') || q.includes('who')) {
    if (stop?.narration) return stop.narration;
    if (stop?.shortIntro) return stop.shortIntro;
  }

  return `${placeName || 'This landmark'} is one of Malaysia’s celebrated heritage stops. Feel free to explore, listen to the guide audio, or ask about amenities and photo spots anytime!`;
}
