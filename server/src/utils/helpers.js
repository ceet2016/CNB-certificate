import crypto from 'crypto';

/**
 * Generate a unique certificate number: CNB-YYYY-XXXXXXXX
 */
export function generateCertNumber() {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CNB-${year}-${random}`;
}

/**
 * Generate SHA-256 hash for certificate integrity verification
 */
export function generateCertHash(data) {
  const payload = JSON.stringify(data);
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Certificate type labels (Chinese)
 */
export const CERT_TYPE_LABELS = {
  completion: '作品完成证书',
  skill: '技能认证证书',
  copyright: '原创性存证证书',
  excellence: '优质作品表彰证书',
};

/**
 * Skill level labels
 */
export const SKILL_LEVEL_LABELS = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
};

/**
 * Work category labels
 */
export const CATEGORY_LABELS = {
  design: '设计',
  development: '开发',
  writing: '写作',
  video: '视频',
  other: '其他',
};
