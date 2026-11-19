import { useMemo } from 'react';
import { marked, type TokenizerAndRendererExtension } from 'marked';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { renderEr } from './erDiagram';

/* ---------- KaTeX helpers ---------- */

export function renderTex(tex: string, displayMode = false): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: 'html',
    });
  } catch {
    return `<code>${tex.replace(/</g, '&lt;')}</code>`;
  }
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const mathBlock: TokenizerAndRendererExtension = {
  name: 'mathBlock',
  level: 'block',
  start(src) {
    const i = src.indexOf('$$');
    return i < 0 ? undefined : i;
  },
  tokenizer(src) {
    const m = /^\$\$\n?([\s\S]+?)\n?\$\$(?:\n|$)/.exec(src);
    if (m) return { type: 'mathBlock', raw: m[0], text: m[1].trim() };
    return undefined;
  },
  renderer(token) {
    return `<div class="math-block">${renderTex(String(token.text), true)}</div>`;
  },
};

const mathInline: TokenizerAndRendererExtension = {
  name: 'mathInline',
  level: 'inline',
  start(src) {
    const i = src.indexOf('$');
    return i < 0 ? undefined : i;
  },
  tokenizer(src) {
    const m = /^\$([^$\n]+?)\$/.exec(src);
    if (m) return { type: 'mathInline', raw: m[0], text: m[1].trim() };
    return undefined;
  },
  renderer(token) {
    return renderTex(String(token.text), false);
  },
};

/* ---------- Query-tree (语法树) rendering ----------
 * Fenced block with language `tree`; each line is one node, children are
 * indented by two spaces deeper than the parent. Labels are LaTeX.
 */
interface TreeNode {
  label: string;
  children: TreeNode[];
}

function parseTree(src: string): TreeNode | null {
  const root: TreeNode = { label: '', children: [] };
  const stack: { node: TreeNode; depth: number }[] = [{ node: root, depth: -1 }];
  for (const raw of src.split('\n')) {
    if (!raw.trim()) continue;
    const depth = (raw.length - raw.trimStart().length) / 2;
    const node: TreeNode = { label: raw.trim(), children: [] };
    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) stack.pop();
    stack[stack.length - 1].node.children.push(node);
    stack.push({ node, depth });
  }
  return root.children[0] ?? null;
}

function treeToHtml(node: TreeNode): string {
  const label = node.label.startsWith('=') // `=名称` => plain relation name
    ? `<span class="qt-leaf">${renderTex(`\\mathrm{${node.label.slice(1)}}`)}</span>`
    : `<span class="qt-node">${renderTex(node.label)}</span>`;
  const kids = node.children.length
    ? `<ul>${node.children.map((c) => treeToHtml(c)).join('')}</ul>`
    : '';
  return `<li>${label}${kids}</li>`;
}

marked.use({
  breaks: true,
  gfm: true,
  extensions: [mathBlock, mathInline],
  renderer: {
    code({ text, lang }) {
      if (lang === 'er') {
        const svg = renderEr(text);
        if (svg) return svg;
      }
      if (lang === 'tree') {
        const root = parseTree(text);
        if (root) return `<div class="qtree"><ul>${treeToHtml(root)}</ul></div>`;
      }
      return `<pre><code${lang ? ` class="language-${escapeHtml(lang)}"` : ''}>${escapeHtml(text)}\n</code></pre>`;
    },
  },
});

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export function MarkdownView({ content, className = '' }: MarkdownViewProps) {
  const html = useMemo(() => {
    if (!content) return '';
    return marked.parse(content) as string;
  }, [content]);

  return (
    <div
      className={`md-content text-slate-800 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** 行内公式组件，用于非 Markdown 的界面文本 */
export function Tex({ t }: { t: string }) {
  return <span dangerouslySetInnerHTML={{ __html: renderTex(t) }} />;
}
