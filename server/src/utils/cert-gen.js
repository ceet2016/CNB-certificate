import PdfMake from 'pdfmake';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FONTS_DIR = join(__dirname, '..', 'assets', 'fonts');

/**
 * Resolve a font file path, checking bundled → system locations.
 */
function resolveFont(filename, ...systemPaths) {
  const bundled = join(FONTS_DIR, filename);
  if (fs.existsSync(bundled)) return bundled;
  for (const sp of systemPaths) {
    if (fs.existsSync(sp)) return sp;
  }
  return null;
}

// Find available Chinese font
const FONT_REGULAR_PATH = resolveFont(
  'NotoSansSC-Regular.otf',
  'NotoSansSC-Regular.ttf',
);
const FONT_BOLD_PATH = resolveFont(
  'NotoSansSC-Bold.otf',
  'NotoSansSC-Bold.ttf',
);

// --- Register Chinese font with pdfmake ---
if (FONT_REGULAR_PATH) {
  try {
    PdfMake.addFonts({
      CN: {
        normal: FONT_REGULAR_PATH,
        bold: FONT_BOLD_PATH || FONT_REGULAR_PATH,
        italics: FONT_REGULAR_PATH,
        bolditalics: FONT_BOLD_PATH || FONT_REGULAR_PATH,
      },
    });
    const sizeMB = (fs.statSync(FONT_REGULAR_PATH).size / 1024 / 1024).toFixed(1);
    console.log(`[CertGen] ✓ Chinese font registered (${sizeMB} MB)`);
  } catch (e) {
    console.error('[CertGen] ✗ Font registration failed:', e.message);
  }
} else {
  console.warn('[CertGen] ⚠ No Chinese font found! CJK text will be garbled.');
}

/**
 * Generate a PDF certificate and save to file.
 * Returns the file path.
 */
export async function generateCertPDF(cert, verifyUrl) {
  const outDir = join(__dirname, '..', '..', 'public', 'certs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const filePath = join(outDir, `${cert.cert_number}.pdf`);
  const hasCN = !!FONT_REGULAR_PATH;

  const typeLabels = {
    completion: '作 品 完 成 证 书',
    skill: '技 能 认 证 证 书',
    copyright: '原 创 性 存 证 证 书',
    excellence: '优 质 作 品 表 彰 证 书',
  };
  const levelLabels = { beginner: '初级', intermediate: '中级', advanced: '高级' };

  const issueDate = new Date(cert.issue_date);
  const dateStr = `${issueDate.getFullYear()}年${issueDate.getMonth() + 1}月${issueDate.getDate()}日`;

  // QR code image data URL
  let qrDataUrl = null;
  try {
    qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 160,
      margin: 1,
      color: { dark: '#2c2c2c', light: '#ffffff' },
    });
  } catch (e) {
    console.error('[CertGen] QR code error:', e.message);
  }

  // Build document definition
  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [0, 0, 0, 0],

    defaultStyle: {
      font: hasCN ? 'CN' : 'Roboto',
      fontSize: 12,
    },

    background: [
      // Background color
      { canvas: [{ type: 'rect', x: 0, y: 0, w: 842, h: 595, color: '#fdfbf7' }] },
      // Outer border
      { canvas: [{ type: 'rect', x: 20, y: 20, w: 802, h: 555, lineColor: '#c8a96a', lineWidth: 3 }] },
      { canvas: [{ type: 'rect', x: 28, y: 28, w: 786, h: 539, lineColor: '#d4b878', lineWidth: 1 }] },
      // Top-left corner
      { canvas: [{ type: 'polyline', lineWidth: 2, lineColor: '#b8945a', points: [[28, 63], [28, 28], [63, 28]] }] },
      // Top-right corner
      { canvas: [{ type: 'polyline', lineWidth: 2, lineColor: '#b8945a', points: [[779, 28], [814, 28], [814, 63]] }] },
      // Bottom-left corner
      { canvas: [{ type: 'polyline', lineWidth: 2, lineColor: '#b8945a', points: [[28, 532], [28, 567], [63, 567]] }] },
      // Bottom-right corner
      { canvas: [{ type: 'polyline', lineWidth: 2, lineColor: '#b8945a', points: [[779, 567], [814, 567], [814, 532]] }] },
    ],

    content: [
      // Header - English
      {
        text: 'CNB ASIA INTERNET ACADEMY',
        fontSize: 16,
        bold: true,
        color: '#8a6d3b',
        alignment: 'center',
        margin: [0, 55, 0, 0],
        font: hasCN ? 'CN' : 'Roboto',
      },
      // Header - Chinese subtitle
      {
        text: 'CNB 亚洲互联网学院',
        fontSize: 11,
        color: '#a08862',
        alignment: 'center',
        margin: [0, 3, 0, 0],
      },
      // Decorative separator line
      {
        canvas: [{ type: 'line', x1: 371, y1: 0, x2: 471, y2: 0, lineWidth: 1, lineColor: '#c8a96a' }],
        margin: [0, 10, 0, 0],
      },
      // Certificate title
      {
        text: typeLabels[cert.cert_type] || '证 书',
        fontSize: 28,
        bold: true,
        color: '#2c2c2c',
        alignment: 'center',
        margin: [0, 20, 0, 0],
      },
      // 兹证明
      {
        text: '兹证明',
        fontSize: 13,
        color: '#555555',
        alignment: 'center',
        margin: [0, 30, 0, 0],
      },
      // Holder name (prominent)
      {
        text: cert.holder_name,
        fontSize: 28,
        bold: true,
        color: '#1a1a1a',
        alignment: 'center',
        margin: [0, 12, 0, 0],
      },
      // Name underline
      {
        canvas: [{ type: 'line', x1: 330, y1: 0, x2: 512, y2: 0, lineWidth: 1, lineColor: '#c8a96a' }],
        margin: [0, 7, 0, 0],
      },
      // Work title (conditional)
      ...(cert.work_title ? [{
        text: `作品/项目名称：${cert.work_title}`,
        fontSize: 13,
        color: '#555555',
        alignment: 'center',
        margin: [0, 16, 0, 0],
      }] : []),
      // Skill level (conditional)
      ...(cert.skill_level ? [{
        text: `技能等级：${levelLabels[cert.skill_level] || cert.skill_level}`,
        fontSize: 13,
        color: '#555555',
        alignment: 'center',
        margin: [0, 10, 0, 0],
      }] : []),
      // Certification statement line 1
      {
        text: '经 CNB 亚洲互联网学院审核认证，该作品/技能符合学院颁发标准，',
        fontSize: 12,
        color: '#666666',
        alignment: 'center',
        margin: [0, 18, 0, 0],
      },
      // Certification statement line 2
      {
        text: '特发此证，以资证明。',
        fontSize: 12,
        color: '#666666',
        alignment: 'center',
        margin: [0, 3, 0, 0],
      },

      // === Bottom section: QR | Info | Signature ===
      {
        columns: [
          // Left: QR code
          {
            width: 90,
            stack: qrDataUrl ? [
              { image: qrDataUrl, width: 70, height: 70 },
              { text: '扫码验证', fontSize: 8, color: '#999999', alignment: 'center', margin: [0, 2, 0, 0] },
            ] : [],
            margin: [50, 50, 0, 0],
          },
          // Center: cert number + date + hash
          {
            width: '*',
            stack: [
              { text: `证书编号：${cert.cert_number}`, fontSize: 10, color: '#999999', alignment: 'center' },
              { text: `颁发日期：${dateStr}`, fontSize: 11, color: '#555555', alignment: 'center', margin: [0, 8, 0, 0] },
              { text: `Hash: ${cert.hash.substring(0, 32)}...`, fontSize: 7, color: '#bbbbbb', alignment: 'center', margin: [0, 22, 0, 0] },
            ],
            alignment: 'center',
          },
          // Right: signature area
          {
            width: 180,
            stack: [
              { text: 'CNB Asia Internet Academy', fontSize: 12, bold: true, color: '#333333' },
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 1, lineColor: '#c8a96a' }], margin: [0, 8, 0, 0] },
              { text: '授权签发', fontSize: 9, color: '#999999', margin: [0, 2, 0, 0] },
            ],
            alignment: 'right',
            margin: [0, 50, 50, 0],
          },
        ],
      },
    ],
  };

  // Create PDF and write to file
  const pdfDoc = PdfMake.createPdf(docDefinition);

  // Use .write() for server-side file output (OutputDocumentServer)
  await pdfDoc.write(filePath);
  return filePath;
}
