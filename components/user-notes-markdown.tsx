'use client'

import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

const mdComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-2 mt-4 text-xl font-bold tracking-tight text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-lg font-semibold tracking-tight text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-3 text-base font-semibold text-foreground first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-foreground">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-6 text-foreground last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-6 text-foreground last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-primary underline-offset-4 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-[3px] border-primary/35 pl-4 text-muted-foreground italic last:mb-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-border" />,
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes('language-'))
    if (isBlock) {
      return (
        <code className={cn('font-mono text-[13px] text-foreground', className)} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className="rounded-md bg-muted/90 px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-2xl border border-border/60 bg-muted/50 p-4 text-sm last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-border">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-border bg-muted/40 px-3 py-2 font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border border-border px-3 py-2 text-foreground">{children}</td>,
  tr: ({ children }) => <tr className="border-border/80">{children}</tr>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground">{children}</em>,
  del: ({ children }) => <del className="text-muted-foreground line-through">{children}</del>,
}

interface UserNotesMarkdownPreviewProps {
  source: string
  className?: string
}

/** 「我的笔记」预览：GFM（表格、任务列表等）+ 与应用一致的排版 */
export function UserNotesMarkdownPreview({ source, className }: UserNotesMarkdownPreviewProps) {
  const trimmed = source.trim()
  if (!trimmed) {
    return (
      <p className="text-sm text-muted-foreground">
        暂无内容，切换到「编辑」书写；支持 Markdown（**粗体**、列表、代码块、链接等）。
      </p>
    )
  }

  return (
    <div
      className={cn(
        'min-h-[160px] rounded-2xl border border-border/60 bg-card/40 px-4 py-4 text-[15px] md:text-base',
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {source}
      </ReactMarkdown>
    </div>
  )
}
