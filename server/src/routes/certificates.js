import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../auth.js';
import { generateCertNumber, generateCertHash, CERT_TYPE_LABELS } from '../utils/helpers.js';
import { generateCertPDF } from '../utils/cert-gen.js';

const router = Router();

// List my certificates
router.get('/my', authMiddleware, (req, res) => {
  const certs = db.prepare(`
    SELECT c.*, w.title as work_title_orig, w.category as work_category
    FROM certificates c
    LEFT JOIN works w ON c.work_id = w.id
    WHERE c.user_id = ?
    ORDER BY c.issue_date DESC
  `).all(req.user.id);
  res.json({ certificates: certs });
});

// Get certificate detail by ID
router.get('/:id', authMiddleware, (req, res) => {
  const cert = db.prepare(`
    SELECT c.*, w.title as work_title_orig, w.category as work_category, w.description as work_description
    FROM certificates c
    LEFT JOIN works w ON c.work_id = w.id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!cert) return res.status(404).json({ error: '证书不存在' });
  if (cert.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权查看' });
  }
  res.json({ certificate: cert });
});

// Public verify by cert number
router.get('/verify/:certNumber', (req, res) => {
  const cert = db.prepare(`
    SELECT c.id, c.cert_number, c.cert_type, c.holder_name, c.work_title,
           c.skill_level, c.issue_date, c.expiry_date, c.status, c.hash,
           u.username, u.avatar
    FROM certificates c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.cert_number = ?
  `).get(req.params.certNumber);

  if (!cert) {
    return res.status(404).json({ valid: false, error: '未找到该证书编号' });
  }

  // Record verification
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const ua = req.headers['user-agent'] || '';
  db.prepare('INSERT INTO verifications (certificate_id, ip, user_agent) VALUES (?, ?, ?)')
    .run(cert.id, ip, ua);

  const verifyCount = db.prepare('SELECT COUNT(*) as c FROM verifications WHERE certificate_id = ?').get(cert.id);

  res.json({
    valid: cert.status === 'active',
    certificate: {
      cert_number: cert.cert_number,
      cert_type: cert.cert_type,
      cert_type_label: CERT_TYPE_LABELS[cert.cert_type] || cert.cert_type,
      holder_name: cert.holder_name,
      work_title: cert.work_title,
      skill_level: cert.skill_level,
      issue_date: cert.issue_date,
      expiry_date: cert.expiry_date,
      status: cert.status,
      hash: cert.hash.substring(0, 16) + '...',
      holder_username: cert.username,
      holder_avatar: cert.avatar,
      verify_count: verifyCount.c,
    }
  });
});

// Download PDF
router.get('/:id/download', authMiddleware, async (req, res) => {
  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(req.params.id);
  if (!cert) return res.status(404).json({ error: '证书不存在' });
  if (cert.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权下载' });
  }

  const verifyUrl = `${req.protocol}://${req.get('host')}/verify/${cert.cert_number}`;
  try {
    const filePath = await generateCertPDF(cert, verifyUrl);
    res.download(filePath, `${cert.cert_number}.pdf`);
  } catch (e) {
    res.status(500).json({ error: '生成PDF失败：' + e.message });
  }
});

// Admin: issue a certificate (optionally linked to a work)
router.post('/issue', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }

  try {
    const { user_id, work_id, cert_type, holder_name, work_title, skill_level, metadata } = req.body;
    if (!user_id || !cert_type || !holder_name) {
      return res.status(400).json({ error: '用户ID、证书类型和持有人姓名为必填项' });
    }

    const certNumber = generateCertNumber();
    const hash = generateCertHash({
      cert_number: certNumber,
      user_id,
      work_id: work_id || null,
      cert_type,
      holder_name,
      timestamp: Date.now(),
    });

    const result = db.prepare(`
      INSERT INTO certificates (cert_number, user_id, work_id, cert_type, holder_name, work_title, skill_level, hash, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(certNumber, user_id, work_id || null, cert_type, holder_name,
           work_title || '', skill_level || '', hash, JSON.stringify(metadata || {}));

    const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(result.lastInsertRowid);
    res.json({ certificate: cert });
  } catch (e) {
    res.status(500).json({ error: '颁发失败：' + e.message });
  }
});

export default router;
