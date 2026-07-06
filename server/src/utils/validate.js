// Input validation utilities — used by both auth routes and admin routes

// Detect Chinese characters (CJK Unified Ideographs + Extension A + Compatibility)
const CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;

export function hasChinese(str) {
  if (!str || typeof str !== 'string') return false;
  return CHINESE_REGEX.test(str);
}

// Username: 3-20 chars, alphanumeric + underscore, must start with a letter
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: '用户名不能为空' };
  }
  if (hasChinese(username)) {
    return { valid: false, error: '用户名不能包含中文' };
  }
  if (username.length < 3 || username.length > 20) {
    return { valid: false, error: '用户名长度需为3-20位' };
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) {
    return { valid: false, error: '用户名只能包含字母、数字和下划线，且以字母开头' };
  }
  return { valid: true };
}

// Email: standard email format
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: '邮箱不能为空' };
  }
  if (email.length > 254) {
    return { valid: false, error: '邮箱地址过长' };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: '邮箱格式不正确' };
  }
  return { valid: true };
}

// Common weak passwords blacklist
const WEAK_PASSWORDS = [
  '12345678', '123456789', '1234567890', '87654321', '11111111',
  '00000000', 'password', 'password1', 'qwerty123', 'abc12345',
  'aaaaaaaa', 'abcd1234', '1234abcd', 'iloveyou', 'sunshine1',
  'football', 'baseball', 'dragon12', 'master12', 'login123',
  'welcome1', 'admin123', 'letmein1', 'monkey12', 'shadow12',
  'superman', 'trustno1', 'qazwsx12', 'zxcvbnm1',
];

// Password: 8-36 chars, must contain both letters and numbers, no Chinese
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: '密码不能为空' };
  }
  if (hasChinese(password)) {
    return { valid: false, error: '密码不能包含中文' };
  }
  if (password.length < 8) {
    return { valid: false, error: '密码至少需要8位' };
  }
  if (password.length > 36) {
    return { valid: false, error: '密码最长不能超过36位' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: '密码必须包含字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: '密码必须包含数字' };
  }
  // Check against weak password list (case-insensitive)
  if (WEAK_PASSWORDS.includes(password.toLowerCase())) {
    return { valid: false, error: '密码过于简单，请使用更复杂的密码' };
  }
  // Check for all same character
  if (/^(.)\1+$/.test(password)) {
    return { valid: false, error: '密码不能全部为相同字符' };
  }
  // Check for sequential numbers
  if (/^(0123|1234|2345|3456|4567|5678|6789|7890)/.test(password)) {
    return { valid: false, error: '密码包含连续数字，过于简单' };
  }
  return { valid: true };
}

// Full name: 1-30 chars, no special HTML characters
export function validateFullName(fullName) {
  if (!fullName) return { valid: true }; // Optional
  if (typeof fullName !== 'string' || fullName.length > 30) {
    return { valid: false, error: '姓名长度不能超过30位' };
  }
  if (/[<>{}]/.test(fullName)) {
    return { valid: false, error: '姓名不能包含特殊字符' };
  }
  return { valid: true };
}

// Work title validation
export function validateWorkTitle(title) {
  if (!title || typeof title !== 'string') {
    return { valid: false, error: '作品标题不能为空' };
  }
  if (title.trim().length < 2 || title.length > 100) {
    return { valid: false, error: '作品标题长度需为2-100位' };
  }
  return { valid: true };
}

// Sanitize string input: trim + limit length
export function sanitize(str, maxLen = 1000) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

// IP-based registration rate limiter
// In-memory store: Map<ip, { timestamps: number[] }>
const registrationAttempts = new Map();
const WINDOW_HOURS = 1;     // Time window in hours
const MAX_PER_HOUR = 5;     // Max registrations per IP per hour
const MAX_PER_DAY = 10;     // Max registrations per IP per 24 hours

export function checkIpRegistrationLimit(ip) {
  if (!ip) return { allowed: true };

  const now = Date.now();
  const hourMs = WINDOW_HOURS * 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;

  let record = registrationAttempts.get(ip);
  if (!record) {
    record = { timestamps: [] };
    registrationAttempts.set(ip, record);
  }

  // Filter timestamps within the last 24 hours
  record.timestamps = record.timestamps.filter(ts => now - ts < dayMs);

  // Count within last hour
  const recentHour = record.timestamps.filter(ts => now - ts < hourMs).length;
  if (recentHour >= MAX_PER_HOUR) {
    return {
      allowed: false,
      error: `同一IP在${WINDOW_HOURS}小时内最多注册${MAX_PER_HOUR}次，请稍后再试`,
    };
  }

  // Count within last 24 hours
  if (record.timestamps.length >= MAX_PER_DAY) {
    return {
      allowed: false,
      error: `同一IP每天最多注册${MAX_PER_DAY}次，请明天再试`,
    };
  }

  return { allowed: true };
}

export function recordRegistrationAttempt(ip) {
  if (!ip) return;
  let record = registrationAttempts.get(ip);
  if (!record) {
    record = { timestamps: [] };
    registrationAttempts.set(ip, record);
  }
  record.timestamps.push(Date.now());
}

// Get client IP from request
export function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || '';
}

// ============================================================
// Login rate limiter — IP-based failed attempt tracking
// After MAX_LOGIN_FAILURES wrong attempts within LOGIN_WINDOW_MS,
// the IP is locked out for LOGIN_LOCKOUT_MS.
// ============================================================
const loginAttempts = new Map(); // Map<ip, { failures: number[], lockedUntil: number }>
const MAX_LOGIN_FAILURES = 5;        // Max failed attempts before lockout
const LOGIN_WINDOW_MS = 15 * 60 * 1000;   // 15-minute rolling window
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;  // 15-minute lockout duration

// Check if IP is currently allowed to attempt login
export function checkLoginRateLimit(ip) {
  if (!ip) return { allowed: true };

  const now = Date.now();
  let record = loginAttempts.get(ip);
  if (!record) {
    return { allowed: true };
  }

  // Check if currently locked out
  if (record.lockedUntil && now < record.lockedUntil) {
    const retryAfter = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      error: `登录失败次数过多，请${retryAfter}秒后再试`,
      locked: true,
      retryAfter,
    };
  }

  // Lockout expired — reset
  if (record.lockedUntil && now >= record.lockedUntil) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

// Get remaining attempts before lockout
export function getRemainingAttempts(ip) {
  if (!ip) return MAX_LOGIN_FAILURES;
  const record = loginAttempts.get(ip);
  if (!record) return MAX_LOGIN_FAILURES;

  const now = Date.now();
  const recentFailures = record.failures.filter(ts => now - ts < LOGIN_WINDOW_MS);
  return Math.max(0, MAX_LOGIN_FAILURES - recentFailures.length);
}

// Record a failed login attempt; auto-locks if threshold reached
export function recordLoginFailure(ip) {
  if (!ip) return;
  const now = Date.now();

  let record = loginAttempts.get(ip);
  if (!record) {
    record = { failures: [], lockedUntil: 0 };
    loginAttempts.set(ip, record);
  }

  // Prune old failures outside the window
  record.failures = record.failures.filter(ts => now - ts < LOGIN_WINDOW_MS);
  record.failures.push(now);

  // Auto-lock if threshold reached
  if (record.failures.length >= MAX_LOGIN_FAILURES) {
    record.lockedUntil = now + LOGIN_LOCKOUT_MS;
  }
}

// Clear all failures for an IP (on successful login)
export function clearLoginFailures(ip) {
  if (!ip) return;
  loginAttempts.delete(ip);
}
