import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { RateLimit } from 'k6/metrics';

const apiBase = __ENV.API_BASE_URL || 'https://malaikanest.duckdns.org';

const customMetric = new RateLimit('custom_rate_limit');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  group('Homepage', () => {
    const homepage = http.get(`${apiBase}/`);
    check(homepage, {
      'homepage status 200': (r) => r.status === 200,
    });
  });

  group('API - Banners', () => {
    const banners = http.get(`${apiBase}/api/products/banners/`);
    check(banners, {
      'banners status 200': (r) => r.status === 200,
      'banners cached < 100ms': (r) => r.timings.duration < 100,
    });
    customMetric.add(banners.status === 429 ? 1 : 0);
  });

  group('API - Categories', () => {
    const categories = http.get(`${apiBase}/api/products/categories/`);
    check(categories, {
      'categories status 200': (r) => r.status === 200,
      'categories cached < 80ms': (r) => r.timings.duration < 80,
    });
    customMetric.add(categories.status === 429 ? 1 : 0);
  });

  group('API - Products List', () => {
    const products = http.get(`${apiBase}/api/products/products/`);
    check(products, {
      'products status 200': (r) => r.status === 200,
      'products cached < 120ms': (r) => r.timings.duration < 120,
    });
    customMetric.add(products.status === 429 ? 1 : 0);
  });

  group('API - Products Filtered', () => {
    const filtered = http.get(`${apiBase}/api/products/products/?category=nursery&page=1`);
    check(filtered, {
      'filtered products status 200': (r) => r.status === 200,
      'filtered products < 200ms': (r) => r.timings.duration < 200,
    });
    customMetric.add(filtered.status === 429 ? 1 : 0);
  });

  group('API - Health Check', () => {
    const health = http.get(`${apiBase}/api/core/health/`);
    check(health, {
      'health status 200': (r) => r.status === 200,
      'health healthy': (r) => JSON.parse(r.body).status === 'healthy',
    });
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  let output = `${indent}Load Test Results\n`;
  output += `${indent}==================\n\n`;
  
  if (data.metrics.http_req_duration) {
    const duration = data.metrics.http_req_duration;
    output += `${indent}Request Duration:\n`;
    output += `${indent}  avg: ${duration.values.avg.toFixed(2)}ms\n`;
    output += `${indent}  p95: ${duration.values['p(95)'].toFixed(2)}ms\n`;
    output += `${indent}  max: ${duration.values.max.toFixed(2)}ms\n\n`;
  }
  
  if (data.metrics.http_req_failed) {
    const failed = data.metrics.http_req_failed;
    output += `${indent}Failed Requests: ${(failed.values.rate * 100).toFixed(2)}%\n\n`;
  }
  
  output += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  output += `${indent}Duration: ${(data.state.testRunDurationMs / 1000).toFixed(1)}s\n`;
  
  return output;
}
