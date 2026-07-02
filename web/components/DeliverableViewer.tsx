'use client';

import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText } from 'lucide-react';
import { MermaidDiagram } from './MermaidDiagram';

function normalizeCollapsedTables(content: string): string {
  const lines = content.split('\n');

  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('|') || !trimmed.includes(' | |')) {
        return line;
      }

      const isLikelyTableLine = /\|\s*[-:]{3,}[-|:\s]*\|/.test(trimmed);
      if (!isLikelyTableLine && (line.match(/\|/g)?.length ?? 0) < 8) {
        return line;
      }

      const rows = line
        .split(/\s\|\s(?=\|)/g)
        .map((row) => row.trim())
        .filter(Boolean);

      return rows.length > 1 ? rows.join('\n') : line;
    })
    .join('\n');
}

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-8 border-t border-slate-200 pt-6 text-2xl font-semibold tracking-tight text-slate-950 dark:border-slate-800 dark:text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-6 text-lg font-semibold text-slate-950 dark:text-white">{children}</h3>,
  p: ({ children }) => <p className="text-[15px] leading-7 text-slate-700 dark:text-slate-300">{children}</p>,
  ul: ({ children }) => <ul className="space-y-2 pl-5 text-[15px] leading-7 text-slate-700 marker:text-brand-500 dark:text-slate-300">{children}</ul>,
  ol: ({ children }) => <ol className="space-y-2 pl-5 text-[15px] leading-7 text-slate-700 marker:text-brand-500 dark:text-slate-300">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  hr: () => <hr className="my-8 border-slate-200 dark:border-slate-800" />,
  blockquote: ({ children }) => (
    <blockquote className="rounded-r-2xl border-l-4 border-brand-500 bg-brand-50/80 px-5 py-4 text-slate-700 dark:bg-brand-500/10 dark:text-slate-200">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a href={href} className="font-medium text-brand-600 underline decoration-brand-300 underline-offset-4 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200">
      {children}
    </a>
  ),
  code({ className, children }) {
    const lang = (className ?? '').replace('language-', '');
    const code = String(children).replace(/\n$/, '');

    if (lang === 'mermaid') {
      return (
        <div className="my-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <MermaidDiagram chart={code} />
        </div>
      );
    }

    return (
      <code className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-sm text-brand-700 dark:bg-slate-800 dark:text-brand-300">
        {children}
      </code>
    );
  },
  pre({ children }) {
    return (
      <pre className="overflow-x-auto rounded-3xl bg-slate-950 p-5 font-mono text-sm leading-7 text-slate-100 shadow-inner shadow-black/20">
        {children}
      </pre>
    );
  },
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800">
      <table className="min-w-full table-fixed border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-100 dark:bg-slate-800">{children}</thead>,
  th: ({ children }) => (
    <th className="w-44 border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:border-slate-700 dark:text-white sm:w-auto">
      {children}
    </th>
  ),
  tbody: ({ children }) => <tbody className="[&_tr:nth-child(even)]:bg-slate-50/70 dark:[&_tr:nth-child(even)]:bg-slate-900/40">{children}</tbody>,
  td: ({ children }) => <td className="break-words border-b border-slate-200 px-4 py-3 align-top text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">{children}</td>,
};

interface Props {
  content: string;
}

export function DeliverableViewer({ content }: Props) {
  const normalizedContent = normalizeCollapsedTables(content);

  return (
    <section className="card-base overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-200/80 px-6 py-5 dark:border-slate-800">
        <div className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Deliverable</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Generated stage content rendered from the project files.</p>
        </div>
      </div>

      <div className="space-y-5 px-6 py-6 lg:px-8 lg:py-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {normalizedContent}
        </ReactMarkdown>
      </div>
    </section>
  );
}
