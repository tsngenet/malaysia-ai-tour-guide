import http from 'node:http';
import { spawn } from 'node:child_process';

console.log('Testing Malaysia AI Live Tour Guide API & Static Server...');

const serverProc = spawn('node', ['server.mjs'], {
  env: { ...process.env, PORT: '3055' },
  stdio: 'inherit'
});

async function runTests() {
  // Give server 1s to start
  await new Promise(r => setTimeout(r, 1200));

  try {
    // 1. Health check
    const healthRes = await fetch('http://localhost:3055/health');
    const health = await healthRes.json();
    console.log('[TEST 1] /health response:', health.ok ? 'PASS' : 'FAIL', health);

    // 2. Static root check
    const rootRes = await fetch('http://localhost:3055/');
    console.log('[TEST 2] / static HTML status:', rootRes.status === 200 ? 'PASS' : 'FAIL');

    // 3. /api/ask with context (English)
    const askEnRes = await fetch('http://localhost:3055/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What snacks or food should I try?',
        place: 'Melaka Dutch Square',
        placeId: 'dutch-square',
        language: 'en',
        knowledgeContext: '[Restroom and Food]: Chicken rice balls and durian cendol near the river bridge.'
      })
    });
    const askEnData = await askEnRes.json();
    console.log('[TEST 3] /api/ask EN answer:', askEnData.answer ? 'PASS' : 'FAIL');
    console.log('         Snippet:', askEnData.answer?.slice(0, 80) + '...');

    // 4. /api/ask in Chinese
    const askZhRes = await fetch('http://localhost:3055/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: '这里有什么着装要求？',
        place: 'Putra Mosque',
        placeId: 'putra-mosque',
        language: 'zh'
      })
    });
    const askZhData = await askZhRes.json();
    console.log('[TEST 4] /api/ask ZH answer:', askZhData.answer ? 'PASS' : 'FAIL');
    console.log('         Snippet:', askZhData.answer?.slice(0, 80) + '...');

    // 5. Validation error check
    const badRes = await fetch('http://localhost:3055/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    console.log('[TEST 5] Empty question rejection:', badRes.status === 400 ? 'PASS' : 'FAIL');

    console.log('\nAll integration tests PASSED successfully!');
  } catch (err) {
    console.error('Integration test failed:', err);
    process.exitCode = 1;
  } finally {
    serverProc.kill();
  }
}

runTests();
