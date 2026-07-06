import http from 'http';

const SERVER = { host: 'localhost', port: 3000 };
let passed = 0, failed = 0;
const results = [];

function ok(name) { passed++; results.push(`  PASS  ${name}`); }
function fail(name, reason) { failed++; results.push(`  FAIL  ${name} -- ${reason}`); }

function api(method, path, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: SERVER.host, port: SERVER.port,
      path: `/api${path}`, method,
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ code: res.statusCode, data: JSON.parse(raw) }); }
        catch { resolve({ code: res.statusCode, data: { _raw: raw } }); }
      });
    });
    req.on('error', (e) => resolve({ code: 0, data: { _error: e.message } }));
    if (data) req.write(data);
    req.end();
  });
}

// Parse captcha question and compute answer
function solveCaptcha(question) {
  // Formats: "3 + 6 = ?", "7 - 2 = ?", "4 x 6 = ?"
  const m = question.match(/(\d+)\s*([+\-x\u00d7])\s*(\d+)/);
  if (!m) return null;
  const a = parseInt(m[1]);
  const b = parseInt(m[3]);
  const op = m[2];
  switch (op) {
    case '+': return String(a + b);
    case '-': return String(a - b);
    case 'x':
    case '\u00d7': return String(a * b);
    default: return null;
  }
}

async function getCaptcha() {
  const res = await api('GET', '/auth/captcha');
  const answer = solveCaptcha(res.data.question);
  return { id: res.data.id, answer };
}

async function main() {
  console.log('\n=== Login & Registration Security Tests ===\n');

  // 1. Password >36 chars on registration
  {
    const ts = Date.now();
    const cap = await getCaptcha();
    const res = await api('POST', '/auth/register', {
      username: `max36_${ts}`, email: `max36_${ts}@test.com`,
      password: 'a'.repeat(37) + '1', full_name: 'Test',
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 400 && res.data.error.includes('36'))
      ok('Registration: password >36 chars rejected');
    else
      fail('Registration: password >36 chars rejected', `code=${res.code}, error=${res.data.error}`);
  }

  // 2. Chinese password on registration
  {
    const ts = Date.now();
    const cap = await getCaptcha();
    const res = await api('POST', '/auth/register', {
      username: `cn_${ts}`, email: `cn_${ts}@test.com`,
      password: '\u5bc6\u7801123abc', full_name: 'Test',
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 400 && res.data.error.includes('\u4e2d\u6587'))
      ok('Registration: Chinese password rejected');
    else
      fail('Registration: Chinese password rejected', `code=${res.code}, error=${res.data.error}`);
  }

  // 3. Chinese username on registration
  {
    const ts = Date.now();
    const cap = await getCaptcha();
    const res = await api('POST', '/auth/register', {
      username: '\u7528\u6237\u540dtest', email: `ucn_${ts}@test.com`,
      password: 'Valid1234', full_name: 'Test',
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 400 && res.data.error.includes('\u4e2d\u6587'))
      ok('Registration: Chinese username rejected');
    else
      fail('Registration: Chinese username rejected', `code=${res.code}, error=${res.data.error}`);
  }

  // 4. Valid registration still works
  {
    const ts = Date.now();
    const cap = await getCaptcha();
    const res = await api('POST', '/auth/register', {
      username: `ok_${ts}`, email: `ok_${ts}@test.com`,
      password: 'Valid1234', full_name: 'Test User',
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 200 && res.data.pending === true)
      ok('Registration: valid user still works');
    else
      fail('Registration: valid user still works', `code=${res.code}, error=${res.data.error}`);
  }

  // 5. Login with Chinese username
  {
    const cap = await getCaptcha();
    const res = await api('POST', '/auth/login', {
      username: '\u7528\u6237\u540dtest', password: 'SomePass1', encrypted: false,
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 400 && res.data.error.includes('\u4e2d\u6587'))
      ok('Login: Chinese username rejected');
    else
      fail('Login: Chinese username rejected', `code=${res.code}, error=${res.data.error}`);
  }

  // 6. Login with Chinese password
  {
    const cap = await getCaptcha();
    const res = await api('POST', '/auth/login', {
      username: 'someuser', password: '\u5bc6\u7801123abc', encrypted: false,
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 400 && res.data.error.includes('\u4e2d\u6587'))
      ok('Login: Chinese password rejected');
    else
      fail('Login: Chinese password rejected', `code=${res.code}, error=${res.data.error}`);
  }

  // 7. Login with >36 char password
  {
    const cap = await getCaptcha();
    const res = await api('POST', '/auth/login', {
      username: 'someuser', password: 'a'.repeat(37) + '1', encrypted: false,
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 400 && res.data.error.includes('36'))
      ok('Login: >36 char password rejected');
    else
      fail('Login: >36 char password rejected', `code=${res.code}, error=${res.data.error}`);
  }

  // 8. Login with >254 char username
  {
    const cap = await getCaptcha();
    const res = await api('POST', '/auth/login', {
      username: 'a'.repeat(255), password: 'SomePass1', encrypted: false,
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 400 && res.data.error.includes('254'))
      ok('Login: >254 char username rejected');
    else
      fail('Login: >254 char username rejected', `code=${res.code}, error=${res.data.error}`);
  }

  // 9. Admin without encryption correctly rejected (before lockout test)
  {
    const cap = await getCaptcha();
    const res = await api('POST', '/auth/login', {
      username: 'ceet2016', password: 'WrongPass', encrypted: false,
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 403 && res.data.requireEncryption)
      ok('Login: admin without encryption correctly rejected');
    else
      fail('Login: admin without encryption rejected', `code=${res.code}, data=${JSON.stringify(res.data)}`);
  }

  // 10. Wrong captcha rejected
  {
    const cap = await getCaptcha();
    const res = await api('POST', '/auth/login', {
      username: 'testuser', password: 'SomePass1', encrypted: false,
      captcha_id: cap.id, captcha_answer: '99999',
    });
    if (res.code === 400 && res.data.error.includes('\u9a8c\u8bc1\u7801'))
      ok('Login: wrong captcha rejected');
    else
      fail('Login: wrong captcha rejected', `code=${res.code}, error=${res.data.error}`);
  }

  // 11. Empty username rejected
  {
    const cap = await getCaptcha();
    const res = await api('POST', '/auth/login', {
      username: '', password: 'SomePass1', encrypted: false,
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 400)
      ok('Login: empty username rejected');
    else
      fail('Login: empty username rejected', `code=${res.code}, error=${res.data.error}`);
  }

  // 12. IP rate limiting -- 5 failures then lockout (MUST BE LAST -- locks the IP)
  {
    const username = `nouser_${Date.now()}`;
    let res;

    // Attempt 1
    let cap = await getCaptcha();
    res = await api('POST', '/auth/login', {
      username, password: 'WrongPass1', encrypted: false,
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 401 && typeof res.data.remaining === 'number')
      ok(`Login: 1st failure, remaining=${res.data.remaining}`);
    else
      fail('Login: 1st failure shows remaining', `code=${res.code}, data=${JSON.stringify(res.data)}`);

    // Attempt 2
    cap = await getCaptcha();
    res = await api('POST', '/auth/login', {
      username, password: 'WrongPass2', encrypted: false,
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 401 && res.data.remaining === 3)
      ok('Login: 2nd failure, remaining=3');
    else
      fail('Login: 2nd failure remaining=3', `code=${res.code}, remaining=${res.data.remaining}`);

    // Attempt 3
    cap = await getCaptcha();
    res = await api('POST', '/auth/login', {
      username, password: 'WrongPass3', encrypted: false,
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 401 && res.data.remaining === 2)
      ok('Login: 3rd failure, remaining=2');
    else
      fail('Login: 3rd failure remaining=2', `code=${res.code}, remaining=${res.data.remaining}`);

    // Attempt 4
    cap = await getCaptcha();
    res = await api('POST', '/auth/login', {
      username, password: 'WrongPass4', encrypted: false,
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 401 && res.data.remaining === 1)
      ok('Login: 4th failure, remaining=1');
    else
      fail('Login: 4th failure remaining=1', `code=${res.code}, remaining=${res.data.remaining}`);

    // Attempt 5 -- should trigger lockout
    cap = await getCaptcha();
    res = await api('POST', '/auth/login', {
      username, password: 'WrongPass5', encrypted: false,
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 429 && res.data.locked === true)
      ok('Login: 5th failure triggers lockout');
    else
      fail('Login: 5th failure triggers lockout', `code=${res.code}, data=${JSON.stringify(res.data)}`);

    // Attempt 6 -- should be blocked
    cap = await getCaptcha();
    res = await api('POST', '/auth/login', {
      username, password: 'WrongPass6', encrypted: false,
      captcha_id: cap.id, captcha_answer: cap.answer,
    });
    if (res.code === 429 && res.data.locked === true)
      ok('Login: locked IP blocked on 6th attempt');
    else
      fail('Login: locked IP blocked on 6th attempt', `code=${res.code}, data=${JSON.stringify(res.data)}`);
  }

  console.log(results.join('\n'));
  console.log(`\n=== Results: ${passed} passed, ${failed} failed, ${passed + failed} total ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
