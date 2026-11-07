import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { INITIAL_TOURS } from './src/data/tours.js';

const port = Number(process.env.PORT || 3000);
const root = join(process.cwd(), 'dist');



async function parseBody(req, limit = 500000) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > limit) throw new Error('Request payload too large');
  }
  return JSON.parse(raw || '{}');
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function json(res, status, data) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization'
  });
  res.end(JSON.stringify(data));
}

/**
 * Server-side AI Provider Layer
 * Supports:
 * 1. Google Gemini via GEMINI_API_KEY
 * 2. OpenAI-compatible / Custom endpoint via AI_ENDPOINT + AI_API_KEY
 * 3. Graceful Grounded Fallback: Provides reliable answers from vetted knowledge store
 */
async function generateAiGuideResponse({ question, place, placeId, tourId, language = 'en', knowledgeContext = '' }) {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  const customEndpoint = process.env.AI_ENDPOINT;

  const contextBlock = knowledgeContext
    ? `\n\nApproved Site Knowledge & Driver Observations:\n${knowledgeContext}`
    : '';

  const systemInstruction = `You are the Malaysia AI Live Tour Guide passenger assistant for tourists travelling in a vehicle across Malaysia.
Current stop: "${place || 'Malaysia'}".
Passenger language: "${language}".${contextBlock}
Instructions:
- Provide an informative, welcoming, and concise response (under 120 words) tailored to a passenger on the road.
- Prioritise the supplied approved site knowledge above.
- Only state verified Malaysian cultural, historical, and practical information.
- If unsure about specific current opening times or prices, clearly advise the passenger to verify with the site counter or tour driver.
- Do NOT hallucinate unverified historical or commercial claims.
- Reply in the passenger's language (${language}).`;

  // 1. Google Gemini 1.5 Flash / Pro REST API
  if (geminiApiKey && (!customEndpoint || customEndpoint.includes('googleapis.com'))) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemInstruction}\n\nPassenger Question: "${question}"` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 300
        }
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (resp.ok) {
        const data = await resp.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) return candidate.trim();
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local provider:', err.message);
    }
  }

  // 2. Generic OpenAI-compatible endpoint
  if (customEndpoint && geminiApiKey) {
    try {
      const resp = await fetch(customEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${geminiApiKey}`
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: question }
          ]
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        const candidate = data.choices?.[0]?.message?.content;
        if (candidate) return candidate.trim();
      }
    } catch (err) {
      console.warn('Custom AI endpoint failed, falling back to local provider:', err.message);
    }
  }

  // 3. Grounded Fallback: Reliable local knowledge matching
  return generateGroundedFallbackResponse(question, place, language, knowledgeContext);
}

function generateGroundedFallbackResponse(question, place, lang, knowledgeContext = '') {
  const q = question.toLowerCase();
  const p = (place || '').toLowerCase();

  const isBatuCaves = p.includes('batu') || q.includes('batu') || q.includes('cave');
  const isPutra = p.includes('putra') || p.includes('mosque') || p.includes('pink') || q.includes('mosque');
  const isMelaka = p.includes('melaka') || p.includes('dutch') || p.includes('famosa') || p.includes('jonker') || q.includes('melaka');

  if (lang === 'zh') {
    if (q.includes('吃') || q.includes('美食') || q.includes('餐')) {
      if (isMelaka) return '马六甲最著名的特色美食包括鸡场街的海南鸡饭粒、娘惹叻沙（Nyonya Laksa）、椰糖煎蕊（Cendol）以及娘惹传统糕点。许多店铺营业至傍晚。';
      if (isBatuCaves) return '黑风洞山下入口处有新鲜现剖椰子水（约RM 6-8）以及地道的南印度飞饼（Roti Canai）与拉茶。';
      return '马来西亚沿途汇聚了马来、华人与印度多元美食。推荐品尝椰浆饭（Nasi Lemak）、沙爹（Satay）及新鲜热带水果。';
    }
    if (q.includes('衣') || q.includes('服装') || q.includes('着装') || q.includes('礼仪')) {
      if (isPutra) return '布特拉清真寺要求非穆斯林访客着装遮盖双肩与膝盖，女性需遮盖头发。清真寺游客入口处提供免费连帽红袍租借。';
      if (isBatuCaves) return '进入黑风洞庙宇需穿着过膝裤或长裙，双肩需遮盖。现场也提供围纱租赁服务。';
      return '参观马来西亚宗教及文化场所时，建议穿着得体舒适，避免露出肩膀和膝盖，进入寺庙前请脱鞋。';
    }
    return `关于 ${place || '此景点'}：这是马来西亚著名的文化地标。您可以边欣赏独特的建筑与历史风貌，边向我们随时询问周边实用出行贴士！`;
  }

  if (lang === 'ms') {
    if (q.includes('makan') || q.includes('restoran')) {
      if (isMelaka) return 'Di Melaka dan Jonker Street, anda boleh menikmati nasi ayam bebola, cendol gula Melaka, dan masakan Nyonya asli.';
      return 'Malaysia kaya dengan pelbagai hidangan enak seperti nasi lemak, roti canai, dan buah-buahan tropika segar.';
    }
    return `Mengenai ${place || 'tempat ini'}: Ini adalah mercu tanda menarik di Malaysia. Sila patuhi etika lawatan dan nikmati pemandangan serta warisan sejarah yang unik!`;
  }

  // Default English response
  if (q.includes('food') || q.includes('eat') || q.includes('snack') || q.includes('restaurant')) {
    if (isMelaka) return 'In Melaka, do not miss the famous Hainanese chicken rice balls, traditional Nyonya laksa, and refreshing Gula Melaka cendol near the river!';
    if (isBatuCaves) return 'At the base of Batu Caves, fresh young coconuts (RM 6-8) and authentic Indian snacks like masala vadai and hot teh tarik are highly recommended.';
    return 'Malaysian cuisine is wonderfully diverse! Look out for Nasi Lemak, Roti Canai, Satay, and tropical fruits along your journey.';
  }

  if (q.includes('dress') || q.includes('wear') || q.includes('code') || q.includes('etiquette') || q.includes('rule')) {
    if (isPutra) return 'At Putra Mosque, modest attire covering shoulders and knees is mandatory. Free robes are provided for visitors at the entrance counter.';
    if (isBatuCaves) return 'At Batu Caves, knees and shoulders must be covered to climb the 272 stairs to the main temple cave. Sarongs can be rented at the foot of the stairs.';
    return 'For heritage and religious sites in Malaysia, modest dress covering shoulders and knees is required, and shoes should be removed before entering prayer areas.';
  }

  return `${place || 'This stop'} is an iconic Malaysian destination. Enjoy the architecture, take photos from the designated viewing zones, and feel free to ask for driver recommendations or restroom locations!`;
}

// HTTP Server
http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { ok: true, timestamp: new Date().toISOString() });
  }

  if (req.method === 'POST' && req.url === '/api/ask') {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 20000) return json(res, 413, { error: 'Request too large' });
    }

    try {
      const body = JSON.parse(raw || '{}');
      const question = String(body.question || '').trim();
      if (!question) {
        return json(res, 400, { error: 'Question is required' });
      }

      const answer = await generateAiGuideResponse({
        question,
        place: body.place,
        placeId: body.placeId,
        tourId: body.tourId,
        language: body.language || 'en',
        knowledgeContext: body.knowledgeContext || ''
      });

      return json(res, 200, { answer });
    } catch (err) {
      console.error('API Error in /api/ask:', err);
      return json(res, 500, { error: 'Failed to process AI question.' });
    }
  }

  // ---------------------------------------------------------------------------
  // PHASE 1C: DEPRECATED MOCK ENDPOINTS (Bypassed by official Firebase SDK)
  // ---------------------------------------------------------------------------
  if (req.url.startsWith('/api/auth/driver-') || req.url.startsWith('/api/tours/')) {
    return json(res, 410, {
      ok: false,
      error: 'Endpoint Removed',
      message: 'Mock server persistence has been decommissioned. Phase 1C connects directly to Firebase Auth and Cloud Firestore via the official Firebase Web SDK.'
    });
  }

  // Static File Serving
  if (req.method === 'GET') {
    try {
      const urlPath = req.url.split('?')[0];
      let filePath = normalize(join(root, urlPath === '/' ? 'index.html' : urlPath));
      if (!filePath.startsWith(root)) {
        return json(res, 403, { error: 'Forbidden' });
      }

      try {
        const fileStat = await stat(filePath);
        if (fileStat.isDirectory()) {
          filePath = join(filePath, 'index.html');
        }
      } catch {
        // Fallback for SPA routing
        filePath = join(root, 'index.html');
      }

      const content = await readFile(filePath);
      const ext = extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      return res.end(content);
    } catch {
      try {
        const fallback = await readFile(join(root, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(fallback);
      } catch {
        return json(res, 404, { error: 'Not found. Please build the frontend first.' });
      }
    }
  }

  json(res, 404, { error: 'Not found' });
}).listen(port, '0.0.0.0', () => {
  console.log(`🇲🇾 Malaysia AI Live Tour Guide running on port ${port}`);
});
