// ─────────────────────────────────────────────────────────────────────────────
// Malaika Nest — Production Load Test (k6)
// ─────────────────────────────────────────────────────────────────────────────
// Usage:
//   docker run --rm -i -v "%cd%:/app" grafana/k6 run /app/load-test.js
//
// Targets:  api.malaikanest.com (production)
// Endpoints: product listing (GET), login (POST), cart add + checkout (POST)
//
// Metrics collected:
//   - Request latency  (avg, p50, p95, p99, min, max) per endpoint
//   - Error rate       (% of non-2xx/3xx responses)
//   - Rate-limit hits  (429 responses tracked separately)
//   - Throughput       (req/s)
//
// Memory pressure: the report shows per-endpoint P95/P99 latency trends.
// If P99 climbs >3x the baseline under sustained load, the server is likely
// swapping or running OOM. Run `free -m` on the server during the test for
// direct memory measurement.
// ─────────────────────────────────────────────────────────────────────────────

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// ─── Custom Metrics ─────────────────────────────────────────────────────────

const latencyProducts = new Trend('latency_products_ms', true);
const latencyLogin    = new Trend('latency_login_ms',    true);
const latencyCartRead = new Trend('latency_cart_read_ms', true);
const latencyCartAdd  = new Trend('latency_cart_add_ms',  true);
const latencyCheckout = new Trend('latency_checkout_ms',  true);
const latencyHealth   = new Trend('latency_health_ms',    true);
const errorRate       = new Rate('error_rate');
const rateLimitHits   = new Rate('rate_limit_hits');

// ─── Configuration ──────────────────────────────────────────────────────────

const BASE_URL = 'https://api.malaikanest.com';

// Scenario C (checkout) uses env vars if set, otherwise dummy creds
var TEST_USER_EMAIL    = __ENV.TEST_USER_EMAIL    || 'loadtest@malaikanest.com';
var TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD || 'LoadTest123!';

// ─── k6 Options ─────────────────────────────────────────────────────────────

export var options = {
  // Don't overwhelm the free-tier e2-micro (1 GB RAM)
  scenarios: {
    // ── Scenario A: Browse products (read-heavy) ────────────────────────────
    catalogue: {
      executor: 'ramping-arrival-rate',
      startRate: 2,
      timeUnit: '1s',
      preAllocatedVUs: 10,
      maxVUs: 20,
      stages: [
        { duration: '20s', target: 5 },   // warm-up
        { duration: '1m',  target: 15 },   // ramp up
        { duration: '2m',  target: 20 },   // sustained moderate load
        { duration: '30s', target: 1 },    // cool down
      ],
      gracefulStop: '10s',
      exec: 'browseProducts',
    },

    // ── Scenario B: Login attempts (auth load) ──────────────────────────────
    login: {
      executor: 'constant-vus',
      vus: 3,
      duration: '2m',
      startTime: '30s',
      gracefulStop: '5s',
      exec: 'loginFlow',
    },

    // ── Scenario C: Checkout flow (cart → checkout, write-heavy) ────────────
    checkout: {
      executor: 'per-vu-iterations',
      vus: 2,
      iterations: 5,
      maxDuration: '3m',
      startTime: '1m',
      gracefulStop: '10s',
      exec: 'checkoutFlow',
    },

    // ── Scenario D: Health check poll (baseline latency proxy) ──────────────
    health: {
      executor: 'constant-arrival-rate',
      rate: 1,
      timeUnit: '10s',
      duration: '3m30s',
      preAllocatedVUs: 1,
      maxVUs: 1,
      startTime: '0s',
      exec: 'healthCheck',
    },
  },

  thresholds: {
    'error_rate':             ['rate<0.01'],  // < 1% errors
    'rate_limit_hits':        ['rate<0.05'],  // < 5% rate-limited
    'latency_products_ms':    ['p(95)<2000', 'p(99)<4000'],
    'latency_login_ms':       ['p(95)<3000', 'p(99)<5000'],
    'latency_cart_read_ms':   ['p(95)<1500', 'p(99)<3000'],
    'latency_cart_add_ms':    ['p(95)<2000', 'p(99)<4000'],
    'latency_checkout_ms':    ['p(95)<5000', 'p(99)<8000'],
    'latency_health_ms':      ['p(95)<500',  'p(99)<1000'],
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function randomEmail() {
  var domains = ['example.com', 'test.org', 'mail.xyz'];
  var id = String(__VU) + '-' + String(__ITER);
  return 'loadtest.' + id + '.' + Date.now().toString(36) + '@' + domains[__VU % domains.length];
}

function recordLatency(metric, resp) {
  metric.add(resp.timings.duration);
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO A: Browse Products (GET — read-heavy)
// ═══════════════════════════════════════════════════════════════════════════

export function browseProducts() {
  group('Browse Products', function () {
    // First page, default sort (most common)
    var resp = http.get(
      BASE_URL + '/api/v1/products/products/?ordering=-created_at&page=1&page_size=24',
      { tags: { endpoint: 'products' } }
    );
    recordLatency(latencyProducts, resp);
    var ok = check(resp, {
      'products 200': function (r) { return r.status === 200; },
      'products has results': function (r) {
        try {
          var body = JSON.parse(r.body);
          return Array.isArray(body.results);
        } catch (e) { return false; }
      },
    });
    errorRate.add(!ok);

    // Second page with filters (less common but heavier query)
    resp = http.get(
      BASE_URL + '/api/v1/products/products/?ordering=-created_at&page=2&page_size=24&age_group=baby&gender=girl',
      { tags: { endpoint: 'products_filtered' } }
    );
    recordLatency(latencyProducts, resp);
    ok = check(resp, {
      'products filtered 200': function (r) { return r.status === 200; },
    });
    errorRate.add(!ok);

    // Categories endpoint (20% chance)
    if (Math.random() < 0.2) {
      resp = http.get(
        BASE_URL + '/api/v1/products/categories/',
        { tags: { endpoint: 'categories' } }
      );
      check(resp, {
        'categories 200': function (r) { return r.status === 200; },
      });
    }
  });
  sleep(0.5 + Math.random() * 1.5);
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO B: Login (POST — auth, rate-limited)
// ═══════════════════════════════════════════════════════════════════════════

export function loginFlow() {
  group('Login', function () {
    var email = randomEmail();
    var payload = JSON.stringify({
      email: email,
      password: 'wrong-password-for-' + String(__ITER),
    });
    var resp = http.post(
      BASE_URL + '/api/v1/accounts/token/',
      payload,
      { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'login' } }
    );
    recordLatency(latencyLogin, resp);

    // Expected: 401 (wrong creds) — still stresses the server
    // Track 429 (rate limited) and 5xx (real errors) separately
    var isRateLimited = resp.status === 429;
    var isServerError = resp.status >= 500;
    var ok = check(resp, {
      'login no server error': function (r) { return r.status < 500; },
    });
    errorRate.add(!ok || isServerError);
    rateLimitHits.add(isRateLimited);
  });

  // Respect the 5r/m rate limit on auth endpoint
  sleep(8 + Math.random() * 7);
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO C: Checkout Flow (cart read → add → checkout)
// ═══════════════════════════════════════════════════════════════════════════
// Requires a registered user. Set TEST_USER_EMAIL / TEST_USER_PASSWORD env
// vars for a valid login. Without them, falls back to guest path (401
// expected) but still exercises the Django middleware + DB.

export function checkoutFlow() {
  group('Checkout Flow', function () {
    var authToken;
    var headers = {};
    headers['Content-Type'] = 'application/json';

    // Step 1: Login
    var loginPayload = JSON.stringify({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });
    var resp = http.post(
      BASE_URL + '/api/v1/accounts/token/',
      loginPayload,
      { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'checkout_login' } }
    );
    recordLatency(latencyLogin, resp);

    if (resp.status === 200) {
      try {
        authToken = JSON.parse(resp.body).access;
        headers['Authorization'] = 'Bearer ' + authToken;
      } catch (e) { /* guest path fallback */ }
    }

    // Step 2: Read cart
    resp = http.get(
      BASE_URL + '/api/v1/orders/cart/',
      { headers: headers, tags: { endpoint: 'cart_read' } }
    );
    recordLatency(latencyCartRead, resp);
    var ok = check(resp, {
      'cart read ok': function (r) { return r.status < 500; },
    });
    errorRate.add(!ok);

    // Step 3: Fetch a real product to get a valid product_id
    resp = http.get(
      BASE_URL + '/api/v1/products/products/?page=1&page_size=1',
      { headers: { 'Accept': 'application/json' }, tags: { endpoint: 'checkout_product_fetch' } }
    );

    var productId;
    if (resp.status === 200) {
      try {
        var body = JSON.parse(resp.body);
        var results = body.results || [];
        if (results.length > 0) {
          productId = results[0].id;
        }
      } catch (e) { /* no products */ }
    }

    // Step 4: Add product to cart (if we found one)
    if (productId) {
      var addPayload = JSON.stringify({ product_id: productId, quantity: 1 });
      resp = http.post(
        BASE_URL + '/api/v1/orders/cart/add/',
        addPayload,
        { headers: headers, tags: { endpoint: 'cart_add' } }
      );
      recordLatency(latencyCartAdd, resp);
      ok = check(resp, {
        'cart add ok': function (r) { return r.status < 500; },
      });
      errorRate.add(!ok);
      rateLimitHits.add(resp.status === 429);

      // Step 5: Checkout
      var checkoutPayload = JSON.stringify({
        is_guest: !authToken,
        guest_email: authToken ? '' : TEST_USER_EMAIL,
        guest_phone: authToken ? '' : '0712345678',
        delivery_region: 'nairobi',
        shipping_name: 'Load Test',
        shipping_phone: '0712345678',
        shipping_address: '123 Test St',
        shipping_city: 'Nairobi',
        shipping_county: 'Nairobi',
      });
      resp = http.post(
        BASE_URL + '/api/v1/orders/cart/checkout/',
        checkoutPayload,
        { headers: headers, tags: { endpoint: 'checkout' } }
      );
      recordLatency(latencyCheckout, resp);
      ok = check(resp, {
        'checkout handled': function (r) { return r.status < 500; },
      });
      errorRate.add(!ok);
    }

    // Step 6: Clear cart (reset state)
    http.post(
      BASE_URL + '/api/v1/orders/cart/clear/',
      '{}',
      { headers: headers, tags: { endpoint: 'cart_clear' } }
    );
  });
  sleep(2 + Math.random() * 3);
}

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO D: Health Check (baseline latency every 10s)
// ═══════════════════════════════════════════════════════════════════════════

export function healthCheck() {
  var resp = http.get(BASE_URL + '/api/v1/accounts/token/', {
    headers: { 'Accept': 'application/json' },
    tags: { endpoint: 'health' },
  });
  recordLatency(latencyHealth, resp);
  check(resp, {
    'health responds': function (r) { return r.status > 0; },
  });
}
