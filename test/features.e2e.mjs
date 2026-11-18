import assert from 'node:assert/strict';

const BASE_URL = process.env.API_URL || 'http://127.0.0.1:3001';

console.log(`\n🚀 Running E2E feature tests against ${BASE_URL}...\n`);

async function runTests() {
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• ${name}... `);
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err) {
      console.log(`❌ FAIL\n  Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Correlation ID Tests
  await test('Generates x-correlation-id if none provided', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/posts`);
    const cid = res.headers.get('x-correlation-id');
    assert.ok(cid, 'Expected x-correlation-id header');
    assert.ok(cid.length > 10, 'Expected valid UUID correlation id');
  });

  await test('Preserves client-provided x-correlation-id', async () => {
    const customCid = 'test-trace-' + Date.now();
    const res = await fetch(`${BASE_URL}/api/v1/posts`, {
      headers: { 'x-correlation-id': customCid },
    });
    const cid = res.headers.get('x-correlation-id');
    assert.strictEqual(cid, customCid, 'Expected custom x-correlation-id to match');
  });

  // 2. Caching Tests
  await test('Response Caching: consecutive requests return X-Cache: HIT', async () => {
    const res1 = await fetch(`${BASE_URL}/api/v1/posts`);
    assert.strictEqual(res1.status, 200);

    const res2 = await fetch(`${BASE_URL}/api/v1/posts`);
    assert.strictEqual(res2.status, 200);
    const cacheHeader = res2.headers.get('x-cache');
    assert.strictEqual(cacheHeader, 'HIT', `Expected X-Cache: HIT, got ${cacheHeader}`);
  });

  // 3. Rate Limiting Tests
  await test('Rate Limiting: triggers HTTP 429 on /auth/login after 10 requests', async () => {
    const uniqueEmail = `ratelimit_${Date.now()}@example.com`;
    let got429 = false;
    let errorBody = null;

    for (let i = 1; i <= 12; i++) {
      const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: uniqueEmail, password: 'wrong' }),
      });

      if (res.status === 429) {
        got429 = true;
        errorBody = await res.json();
        break;
      }
    }

    assert.ok(got429, 'Expected at least one HTTP 429 Too Many Requests response');
    assert.strictEqual(errorBody?.statusCode, 429);
    assert.strictEqual(errorBody?.error, 'Too Many Requests');
  });

  // 4. SkipThrottle Test
  await test('SkipThrottle: /auth/profile is not throttled', async () => {
    for (let i = 1; i <= 12; i++) {
      const res = await fetch(`${BASE_URL}/api/v1/auth/profile`);
      assert.notStrictEqual(res.status, 429, 'Profile endpoint should not trigger 429');
    }
  });

  console.log(`\n========================================`);
  console.log(`📊 Test Summary: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
