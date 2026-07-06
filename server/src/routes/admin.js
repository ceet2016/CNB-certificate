import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { authMiddleware, adminMiddleware } from '../auth.js';
import { generateCertNumber, generateCertHash } from '../utils/helpers.js';
import { generateCertPDF } from '../utils/cert-gen.js';
import { rsaDecrypt } from '../utils/rsa.js';
import { verifyCaptcha } from '../utils/captcha.js';
import { validatePassword, sanitize } from '../utils/validate.js';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// All admin routes require auth + admin
router.use(authMiddleware, adminMiddleware);

// Admin change own password
router.put('/change-password', (req, res) => {
  try {
    const { current_password, new_password, captcha_id, captcha_answer } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: '请输入当前密码和新密码' });
    }

    // Verify captcha
    if (!captcha_id || !captcha_answer) {
      return res.status(400).json({ error: '请输入验证码' });
    }
    if (!verifyCaptcha(captcha_id, captcha_answer)) {
      return res.status(400).json({ error: '验证码错误或已过期', captchaFailed: true });
    }

    // Get current admin user
    const admin = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: '无权限' });
    }

    // Decrypt passwords (RSA encrypted)
    let plainCurrent, plainNew;
    try {
      plainCurrent = rsaDecrypt(current_password);
      plainNew = rsaDecrypt(new_password);
    } catch {
      return res.status(400).json({ error: '密码解密失败，请重试' });
    }

    // Validate new password (8-36 chars, letters+numbers, no Chinese)
    const passwordCheck = validatePassword(plainNew);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.error });
    }

    // Verify current password
    if (!bcrypt.compareSync(plainCurrent, admin.password)) {
      return res.status(401).json({ error: '当前密码错误' });
    }

    // Update password
    const newHash = bcrypt.hashSync(plainNew, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newHash, admin.id);

    res.json({ message: '密码修改成功' });
  } catch (e) {
    res.status(500).json({ error: '修改失败：' + e.message });
  }
});

// Dashboard stats
router.get('/stats', (req, res) => {
  const stats = {
    users: db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('user').c,
    pending_users: db.prepare("SELECT COUNT(*) as c FROM users WHERE status = ?").get('pending').c,
    works: db.prepare('SELECT COUNT(*) as c FROM works').get().c,
    pending_works: db.prepare('SELECT COUNT(*) as c FROM works WHERE status = ?').get('pending').c,
    certificates: db.prepare('SELECT COUNT(*) as c FROM certificates').get().c,
    verifications: db.prepare('SELECT COUNT(*) as c FROM verifications').get().c,
  };
  res.json({ stats });
});

// List pending users (for approval queue)
router.get('/pending-users', (req, res) => {
  const users = db.prepare(`
    SELECT id, username, email, full_name, role, status, registered_ip, created_at
    FROM users
    WHERE status = ?
    ORDER BY created_at DESC
  `).all('pending');
  res.json({ users });
});

// Approve a user registration
router.put('/users/:id/approve', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (user.role === 'admin') return res.status(400).json({ error: '管理员账号无需审核' });

  db.prepare('UPDATE users SET status = ?, approved_at = CURRENT_TIMESTAMP, approved_by = ? WHERE id = ?')
    .run('approved', req.user.id, userId);

  res.json({ message: '用户已审核通过', userId });
});

// Reject a user registration (set status to rejected)
router.put('/users/:id/reject', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (user.role === 'admin') return res.status(400).json({ error: '不能拒绝管理员账号' });

  db.prepare('UPDATE users SET status = ? WHERE id = ?').run('rejected', userId);
  res.json({ message: '已拒绝该用户注册申请', userId });
});

// Revoke approval (set back to pending — user can no longer login)
router.put('/users/:id/revoke', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (user.role === 'admin') return res.status(400).json({ error: '不能撤回管理员账号' });

  db.prepare('UPDATE users SET status = ? WHERE id = ?').run('pending', userId);
  res.json({ message: '已撤回该用户的审核状态，用户将无法登录', userId });
});

// Reset user password (admin sets a new password for the user)
router.post('/users/:id/reset-password', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    if (user.role === 'admin') return res.status(400).json({ error: '不能重置管理员密码' });

    const { new_password } = req.body;
    if (!new_password) {
      return res.status(400).json({ error: '请输入新密码' });
    }

    // Decrypt if RSA-encrypted
    let plainPassword = new_password;
    if (typeof new_password === 'string' && new_password.length > 100) {
      try {
        plainPassword = rsaDecrypt(new_password);
      } catch {
        return res.status(400).json({ error: '密码解密失败，请重试' });
      }
    }

    const passwordCheck = validatePassword(plainPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.error });
    }

    const newHash = bcrypt.hashSync(plainPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newHash, userId);

    res.json({ message: '密码已重置' });
  } catch (e) {
    res.status(500).json({ error: '重置失败：' + e.message });
  }
});

// List all works (with user info — LEFT JOIN for orphaned records)
router.get('/works', (req, res) => {
  const works = db.prepare(`
    SELECT w.*, u.username, u.email, u.full_name, u.status as user_status
    FROM works w
    LEFT JOIN users u ON w.user_id = u.id
    ORDER BY
      CASE w.status WHEN 'pending' THEN 0 ELSE 1 END,
      w.submitted_at DESC
  `).all();
  res.json({ works });
});

// Review a work (approve / reject)
router.put('/works/:id/review', (req, res) => {
  const { status, review_note } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '状态必须为 approved 或 rejected' });
  }

  const work = db.prepare('SELECT * FROM works WHERE id = ?').get(req.params.id);
  if (!work) return res.status(404).json({ error: '作品不存在' });

  const cleanNote = sanitize(review_note, 500);

  db.prepare(`
    UPDATE works SET status = ?, review_note = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, cleanNote, req.params.id);

  let certificate = null;
  // Always issue a certificate when a work is approved
  if (status === 'approved') {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(work.user_id);
    const certNumber = generateCertNumber();
    const hash = generateCertHash({
      cert_number: certNumber,
      user_id: work.user_id,
      work_id: work.id,
      cert_type: 'completion',
      holder_name: user.full_name || user.username,
      timestamp: Date.now(),
    });

    const result = db.prepare(`
      INSERT INTO certificates (cert_number, user_id, work_id, cert_type, holder_name, work_title, hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(certNumber, work.user_id, work.id, 'completion',
           user.full_name || user.username, work.title, hash);

    certificate = db.prepare('SELECT * FROM certificates WHERE id = ?').get(result.lastInsertRowid);
  }

  const updated = db.prepare('SELECT * FROM works WHERE id = ?').get(req.params.id);
  res.json({ work: updated, certificate });
});

// Delete a work (admin can delete any work)
router.delete('/works/:id', (req, res) => {
  const work = db.prepare('SELECT * FROM works WHERE id = ?').get(req.params.id);
  if (!work) return res.status(404).json({ error: '作品不存在' });

  try {
    const txn = db.transaction(() => {
      db.prepare('UPDATE certificates SET work_id = NULL WHERE work_id = ?').run(req.params.id);
      db.prepare('DELETE FROM works WHERE id = ?').run(req.params.id);
    });
    txn();
    res.json({ message: '作品已删除' });
  } catch (e) {
    res.status(500).json({ error: '删除失败：' + e.message });
  }
});

// List all users (with status info)
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.email, u.full_name, u.role, u.status, u.created_at, u.approved_at,
           (SELECT COUNT(*) FROM works WHERE user_id = u.id) as work_count,
           (SELECT COUNT(*) FROM certificates WHERE user_id = u.id) as cert_count
    FROM users u
    ORDER BY
      CASE u.status WHEN 'pending' THEN 0 ELSE 1 END,
      u.created_at DESC
  `).all();
  res.json({ users });
});

// Delete a user (with optional cascade)
router.delete('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const cascade = req.query.cascade === 'true';

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  // Prevent self-deletion
  if (user.id === req.user.id) {
    return res.status(400).json({ error: '不能删除当前登录的管理员账号' });
  }

  try {
    if (cascade) {
      const txn = db.transaction(() => {
        db.prepare(`
          DELETE FROM verifications WHERE certificate_id IN
          (SELECT id FROM certificates WHERE user_id = ?)
        `).run(userId);
        db.prepare('DELETE FROM certificates WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM works WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM users WHERE id = ?').run(userId);
      });
      txn();
    } else {
      db.pragma('foreign_keys = OFF');
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
      db.pragma('foreign_keys = ON');
    }

    res.json({
      message: cascade
        ? '用户及其所有作品、证书已彻底删除'
        : '用户已删除，相关作品和证书已保留',
      cascade,
    });
  } catch (e) {
    db.pragma('foreign_keys = ON');
    res.status(500).json({ error: '删除失败：' + e.message });
  }
});

// List all certificates (LEFT JOIN for orphaned records)
router.get('/certificates', (req, res) => {
  const certs = db.prepare(`
    SELECT c.*, u.username, u.email
    FROM certificates c
    LEFT JOIN users u ON c.user_id = u.id
    ORDER BY c.issue_date DESC
  `).all();
  res.json({ certificates: certs });
});

// Revoke a certificate (soft delete — status → revoked)
router.put('/certificates/:id/revoke', (req, res) => {
  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
  if (!cert) return res.status(404).json({ error: '证书不存在' });
  db.prepare('UPDATE certificates SET status = ? WHERE id = ?').run('revoked', req.params.id);
  res.json({ message: '证书已撤销' });
});

// Permanently delete a certificate
router.delete('/certificates/:id', (req, res) => {
  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
  if (!cert) return res.status(404).json({ error: '证书不存在' });

  try {
    const txn = db.transaction(() => {
      db.prepare('DELETE FROM verifications WHERE certificate_id = ?').run(req.params.id);
      db.prepare('DELETE FROM certificates WHERE id = ?').run(req.params.id);
    });
    txn();

    const certsDir = join(__dirname, '..', '..', 'public', 'certs');
    const pdfPath = join(certsDir, `${cert.cert_number}.pdf`);
    if (fs.existsSync(pdfPath)) {
      try { fs.unlinkSync(pdfPath); } catch {}
    }

    res.json({ message: '证书已彻底删除' });
  } catch (e) {
    res.status(500).json({ error: '删除失败：' + e.message });
  }
});

// Modify certificate content
router.put('/certificates/:id', (req, res) => {
  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
  if (!cert) return res.status(404).json({ error: '证书不存在' });

  const { holder_name, work_title, skill_level, cert_type, status, expiry_date } = req.body;

  const updates = {};
  if (holder_name !== undefined) updates.holder_name = sanitize(holder_name, 50);
  if (work_title !== undefined) updates.work_title = sanitize(work_title, 100);
  if (skill_level !== undefined) updates.skill_level = sanitize(skill_level, 20);
  if (cert_type !== undefined) updates.cert_type = sanitize(cert_type, 30);
  if (status !== undefined) {
    if (!['active', 'revoked'].includes(status)) {
      return res.status(400).json({ error: '状态必须为 active 或 revoked' });
    }
    updates.status = status;
  }
  if (expiry_date !== undefined) updates.expiry_date = expiry_date || null;

  // Regenerate hash if core fields changed
  if (updates.holder_name !== undefined || updates.cert_type !== undefined) {
    const newHash = generateCertHash({
      cert_number: cert.cert_number,
      user_id: cert.user_id,
      work_id: cert.work_id,
      cert_type: updates.cert_type !== undefined ? updates.cert_type : cert.cert_type,
      holder_name: updates.holder_name !== undefined ? updates.holder_name : cert.holder_name,
      timestamp: Date.now(),
    });
    updates.hash = newHash;
  }

  const setClauses = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
  if (!setClauses) {
    return res.status(400).json({ error: '没有需要更新的字段' });
  }

  db.prepare(`UPDATE certificates SET ${setClauses} WHERE id = ${req.params.id}`)
    .run(updates);

  const updated = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
  res.json({ certificate: updated, message: '证书已更新' });
});

export default router;
