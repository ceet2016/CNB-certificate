import crypto from 'crypto';

/**
 * In-memory captcha store.
 * Each entry: { answer, expires }
 * Cleared automatically on expiry.
 */
const store = new Map();

// Periodic cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (now > entry.expires) store.delete(id);
  }
}, 5 * 60 * 1000);

/**
 * Generate a simple arithmetic captcha.
 * Returns { id, question } — the answer is stored server-side.
 */
export function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;  // 1-9
  const b = Math.floor(Math.random() * 9) + 1;  // 1-9
  const ops = ['+', '-', '*'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let answer;
  let question;
  switch (op) {
    case '+':
      answer = a + b;
      question = `${a} + ${b} = ?`;
      break;
    case '-':
      // Ensure non-negative
      const [big, small] = a >= b ? [a, b] : [b, a];
      answer = big - small;
      question = `${big} - ${small} = ?`;
      break;
    case '*':
      answer = a * b;
      question = `${a} × ${b} = ?`;
      break;
  }

  const id = crypto.randomBytes(8).toString('hex');
  store.set(id, {
    answer: String(answer),
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  return { id, question };
}

/**
 * Verify a captcha answer. Consumes the captcha (one-time use).
 * @returns {boolean}
 */
export function verifyCaptcha(id, answer) {
  const entry = store.get(id);
  if (!entry) return false;
  // Always consume (one-time use)
  store.delete(id);
  if (Date.now() > entry.expires) return false;
  return entry.answer === String(answer).trim();
}
