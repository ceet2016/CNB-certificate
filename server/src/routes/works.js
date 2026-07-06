import { Router } from 'express';
import db from '../db.js';
import { authMiddleware, approvedUserMiddleware } from '../auth.js';
import { CATEGORY_LABELS } from '../utils/helpers.js';
import { validateWorkTitle, sanitize } from '../utils/validate.js';

const router = Router();

// Submit a work (requires approved user)
router.post('/', authMiddleware, approvedUserMiddleware, (req, res) => {
  try {
    const { title, description, category, work_url, work_type } = req.body;

    const cleanTitle = sanitize(title, 100);
    const titleCheck = validateWorkTitle(cleanTitle);
    if (!titleCheck.valid) {
      return res.status(400).json({ error: titleCheck.error });
    }

    const validCategories = Object.keys(CATEGORY_LABELS);
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({ error: '请选择有效的作品分类' });
    }

    const cleanDescription = sanitize(description, 2000);
    const cleanWorkUrl = sanitize(work_url, 500);
    const validWorkTypes = ['url', 'github', 'behance', 'file'];
    const cleanWorkType = validWorkTypes.includes(work_type) ? work_type : 'url';

    const result = db.prepare(`
      INSERT INTO works (user_id, title, description, category, work_url, work_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, cleanTitle, cleanDescription, category, cleanWorkUrl, cleanWorkType);

    const work = db.prepare('SELECT * FROM works WHERE id = ?').get(result.lastInsertRowid);
    res.json({ work });
  } catch (e) {
    res.status(500).json({ error: '提交失败：' + e.message });
  }
});

// List my works
router.get('/my', authMiddleware, (req, res) => {
  const works = db.prepare('SELECT * FROM works WHERE user_id = ? ORDER BY submitted_at DESC').all(req.user.id);
  res.json({ works });
});

// Get work detail
router.get('/:id', authMiddleware, (req, res) => {
  const work = db.prepare('SELECT * FROM works WHERE id = ?').get(req.params.id);
  if (!work) return res.status(404).json({ error: '作品不存在' });
  if (work.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权查看' });
  }
  res.json({ work });
});

// Update work (only if pending)
router.put('/:id', authMiddleware, approvedUserMiddleware, (req, res) => {
  const work = db.prepare('SELECT * FROM works WHERE id = ?').get(req.params.id);
  if (!work) return res.status(404).json({ error: '作品不存在' });
  if (work.user_id !== req.user.id) return res.status(403).json({ error: '无权操作' });
  if (work.status !== 'pending') return res.status(400).json({ error: '作品已审核，无法修改' });

  const { title, description, category, work_url, work_type } = req.body;
  const cleanTitle = title ? sanitize(title, 100) : work.title;
  if (title) {
    const titleCheck = validateWorkTitle(cleanTitle);
    if (!titleCheck.valid) {
      return res.status(400).json({ error: titleCheck.error });
    }
  }

  db.prepare(`
    UPDATE works SET title = ?, description = ?, category = ?, work_url = ?, work_type = ?
    WHERE id = ?
  `).run(cleanTitle, description !== undefined ? sanitize(description, 2000) : work.description,
         category || work.category,
         work_url !== undefined ? sanitize(work_url, 500) : work.work_url,
         work_type || work.work_type, req.params.id);

  const updated = db.prepare('SELECT * FROM works WHERE id = ?').get(req.params.id);
  res.json({ work: updated });
});

// Delete work (only if pending)
router.delete('/:id', authMiddleware, (req, res) => {
  const work = db.prepare('SELECT * FROM works WHERE id = ?').get(req.params.id);
  if (!work) return res.status(404).json({ error: '作品不存在' });
  if (work.user_id !== req.user.id) return res.status(403).json({ error: '无权操作' });
  if (work.status !== 'pending') return res.status(400).json({ error: '作品已审核，无法删除' });

  db.prepare('DELETE FROM works WHERE id = ?').run(req.params.id);
  res.json({ message: '已删除' });
});

// Get categories
router.get('/meta/categories', (req, res) => {
  res.json({ categories: CATEGORY_LABELS });
});

export default router;
