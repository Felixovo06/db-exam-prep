import { useMemo } from 'react';
import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
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
