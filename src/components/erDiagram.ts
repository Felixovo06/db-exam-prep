/**
 * E-R 图渲染（陈氏表示法）：矩形=实体，椭圆=属性（主码加下划线），菱形=联系。
 *
 * 代码块语言为 `er`，每行一条声明：
 *   E 实体名 @列,行 | 属性1* 属性2 ...      实体，属性名后加 * 表示主码
 *   R 联系名 @列,行 | 属性1 属性2 ...       联系（| 后面是联系自身的属性，可省略）
 *   L 节点A 基数 节点B                        连线，基数写在靠近实体的一端（1 / n / m ...）
 */

interface Node {
  kind: 'E' | 'R';
  name: string;
  gx: number;
  gy: number;
  attrs: { name: string; pk: boolean }[];
  x: number;
  y: number;
  hw: number; // half width
  hh: number; // half height
}

const GX = 270;
const GY = 230;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function textWidth(s: string, size = 13): number {
  let w = 0;
  for (const ch of s) w += /[　-鿿＀-￯]/.test(ch) ? size : size * 0.58;
  return w;
}

export function renderEr(src: string): string {
  const nodes = new Map<string, Node>();
  const links: { a: string; card: string; b: string }[] = [];

  for (const raw of src.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const [head, attrPart = ''] = line.split('|');
    const t = head.trim().split(/\s+/);
    if (t[0] === 'E' || t[0] === 'R') {
      const pos = /^@(-?[\d.]+),(-?[\d.]+)$/.exec(t[2] ?? '');
      const attrs = attrPart
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((a) => ({ name: a.replace(/\*$/, ''), pk: a.endsWith('*') }));
      nodes.set(t[1], {
        kind: t[0],
        name: t[1],
        gx: pos ? parseFloat(pos[1]) : 0,
        gy: pos ? parseFloat(pos[2]) : 0,
        attrs,
        x: 0,
        y: 0,
        hw: 0,
        hh: 0,
      });
    } else if (t[0] === 'L' && t.length >= 4) {
      links.push({ a: t[1], card: t[2], b: t[3] });
    }
  }
  if (!nodes.size) return '';

  // 节点位置与尺寸
  for (const n of nodes.values()) {
    n.x = n.gx * GX;
    n.y = n.gy * GY;
    const w = textWidth(n.name, 14);
    if (n.kind === 'E') {
      n.hw = Math.max(36, w / 2 + 14);
      n.hh = 18;
    } else {
      n.hw = Math.max(44, w / 2 + 30);
      n.hh = 26;
    }
  }

  // 每个节点的相邻方向
  const neigh = new Map<string, number[]>();
  for (const l of links) {
    const a = nodes.get(l.a);
    const b = nodes.get(l.b);
    if (!a || !b) continue;
    neigh.set(a.name, [...(neigh.get(a.name) ?? []), Math.atan2(b.y - a.y, b.x - a.x)]);
    neigh.set(b.name, [...(neigh.get(b.name) ?? []), Math.atan2(a.y - b.y, a.x - b.x)]);
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const grow = (x1: number, y1: number, x2: number, y2: number) => {
    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  };

  const lines: string[] = [];
  const shapes: string[] = [];

  // 属性布局
  for (const n of nodes.values()) {
    const m = n.attrs.length;
    grow(n.x - n.hw, n.y - n.hh, n.x + n.hw, n.y + n.hh);
    if (!m) continue;
    const angles = (neigh.get(n.name) ?? []).slice().sort((a, b) => a - b);
    let center = -Math.PI / 2;
    let gap = Math.PI * 2;
    if (angles.length) {
      gap = 0;
      for (let i = 0; i < angles.length; i++) {
        const a = angles[i];
        const b = i + 1 < angles.length ? angles[i + 1] : angles[0] + Math.PI * 2;
        if (b - a > gap) {
          gap = b - a;
          center = (a + b) / 2;
        }
      }
    }
    const maxRx = Math.max(...n.attrs.map((a) => Math.max(30, textWidth(a.name) / 2 + 12)));
    const usable = Math.max(0.6, gap - 0.55);
    const step = m > 1 ? Math.min(0.95, usable / (m - 1)) : 0;
    const span = step * (m - 1);
    const R = Math.min(230, Math.max(112, m > 1 ? (maxRx * 2 + 8) / (2 * Math.sin(Math.max(step, 0.2) / 2)) : 112));
    n.attrs.forEach((a, i) => {
      const ang = center + (i - (m - 1) / 2) * (m > 1 ? span / (m - 1) : 0);
      const ax = n.x + Math.cos(ang) * R;
      const ay = n.y + Math.sin(ang) * R * 0.78;
      const rx = Math.max(30, textWidth(a.name) / 2 + 12);
      const ry = 14;
      grow(ax - rx, ay - ry, ax + rx, ay + ry);
      lines.push(`<line x1="${n.x}" y1="${n.y}" x2="${ax}" y2="${ay}" class="er-line"/>`);
      shapes.push(
        `<ellipse cx="${ax}" cy="${ay}" rx="${rx}" ry="${ry}" class="er-attr"/>` +
          `<text x="${ax}" y="${ay + 4.5}" text-anchor="middle" class="er-text er-small${a.pk ? ' er-pk' : ''}">${esc(a.name)}</text>`,
      );
    });
  }

  // 连线与基数标注
  for (const l of links) {
    const a = nodes.get(l.a);
    const b = nodes.get(l.b);
    if (!a || !b) continue;
    lines.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="er-line er-main"/>`);
    // 基数标注贴近实体一端
    const ent = a.kind === 'E' ? a : b;
    const oth = ent === a ? b : a;
    const dx = oth.x - ent.x;
    const dy = oth.y - ent.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const tEdge = Math.min(ent.hw / Math.max(Math.abs(ux), 1e-6), ent.hh / Math.max(Math.abs(uy), 1e-6));
    const d = tEdge + 16;
    const lx = ent.x + ux * d - uy * 11;
    const ly = ent.y + uy * d + ux * 11 + 4;
    shapes.push(`<text x="${lx}" y="${ly}" text-anchor="middle" class="er-text er-card">${esc(l.card)}</text>`);
  }

  // 实体与联系图形
  for (const n of nodes.values()) {
    if (n.kind === 'E') {
      shapes.push(
        `<rect x="${n.x - n.hw}" y="${n.y - n.hh}" width="${n.hw * 2}" height="${n.hh * 2}" class="er-entity"/>` +
          `<text x="${n.x}" y="${n.y + 5}" text-anchor="middle" class="er-text er-name">${esc(n.name)}</text>`,
      );
    } else {
      shapes.push(
        `<polygon points="${n.x},${n.y - n.hh} ${n.x + n.hw},${n.y} ${n.x},${n.y + n.hh} ${n.x - n.hw},${n.y}" class="er-rel"/>` +
          `<text x="${n.x}" y="${n.y + 5}" text-anchor="middle" class="er-text er-name">${esc(n.name)}</text>`,
      );
    }
  }

  const pad = 14;
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;
  return (
    `<div class="erdiagram"><svg viewBox="${minX - pad} ${minY - pad} ${w} ${h}" style="width:100%;max-width:${Math.round(w)}px;--ew:${Math.round(w)}px" xmlns="http://www.w3.org/2000/svg" role="img">` +
    lines.join('') +
    shapes.join('') +
    `</svg></div>`
  );
}
