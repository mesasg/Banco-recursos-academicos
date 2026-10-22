/**
 * Recursos generados en el navegador para que el mock funcione sin conexión:
 * miniaturas SVG tipo "diagrama" y PDFs mínimos descargables.
 */

type DiagramStyle = 'tree' | 'graph' | 'circuit' | 'chart';

const svgShapes: Record<DiagramStyle, string> = {
  tree: `
    <line x1="160" y1="58" x2="100" y2="108" /><line x1="160" y1="58" x2="220" y2="108" />
    <line x1="100" y1="108" x2="70" y2="158" /><line x1="100" y1="108" x2="130" y2="158" />
    <line x1="220" y1="108" x2="250" y2="158" />
    <circle cx="160" cy="58" r="16" /><circle cx="100" cy="108" r="16" /><circle cx="220" cy="108" r="16" />
    <circle cx="70" cy="158" r="16" /><circle cx="130" cy="158" r="16" /><circle cx="250" cy="158" r="16" />`,
  graph: `
    <rect x="40" y="40" width="90" height="50" rx="6" /><rect x="190" y="40" width="90" height="50" rx="6" />
    <rect x="115" y="130" width="90" height="50" rx="6" />
    <line x1="130" y1="65" x2="190" y2="65" /><line x1="85" y1="90" x2="140" y2="130" /><line x1="235" y1="90" x2="180" y2="130" />`,
  circuit: `
    <polyline points="40,60 120,60 130,45 145,75 160,45 175,75 185,60 280,60 280,160 210,160" />
    <line x1="210" y1="145" x2="210" y2="175" /><line x1="200" y1="150" x2="200" y2="170" />
    <polyline points="200,160 40,160 40,60" /><circle cx="40" cy="110" r="14" />`,
  chart: `
    <line x1="40" y1="170" x2="290" y2="170" /><line x1="40" y1="170" x2="40" y2="35" />
    <rect x="65" y="120" width="30" height="50" /><rect x="115" y="90" width="30" height="80" />
    <rect x="165" y="60" width="30" height="110" /><rect x="215" y="100" width="30" height="70" />
    <polyline points="80,110 130,80 180,50 230,90" />`,
};

/** Miniatura SVG como data URI. */
export function diagramThumbnail(style: DiagramStyle, label: string, hue = '#3F7489'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220">
    <rect width="320" height="220" fill="#F3F8FA"/>
    <g fill="#E6F0F4" stroke="${hue}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${svgShapes[style]}</g>
    <text x="16" y="208" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="600" fill="#1F2933">${escapeXml(label)}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Quita tildes: el PDF mínimo usa la fuente estándar Helvetica (WinAnsi). */
function toAscii(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[()\\]/g, '');
}

/** Construye un PDF de una página con el título del recurso. */
export function buildMockPdf(title: string, subtitle: string): Blob {
  const lines = [
    { size: 20, y: 760, text: toAscii(title) },
    { size: 12, y: 735, text: toAscii(subtitle) },
    { size: 11, y: 700, text: 'Archivo de ejemplo generado por el modo mock de la plataforma.' },
  ];
  const stream = lines
    .map((l) => `BT /F1 ${l.size} Tf 56 ${l.y} Td (${l.text}) Tj ET`)
    .join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([body], { type: 'application/pdf' });
}
