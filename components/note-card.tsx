'use client'

import { Link, FileText, Sparkles, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Note, isQuickReadEstimate } from '@/lib/types'
import { cn } from '@/lib/utils'

interface NoteCardProps {
  note: Note
  onClick?: () => void
  className?: string
  /** 首页等高密度列表：更矮的卡片 */
  compact?: boolean
  /**
   * 列表页（待启动 / 处理中 / 灵感等）：固定卡片高度，宽度随栅格，内容超出省略
   */
  listFixedHeight?: boolean
  /** 新手引导：供 coachmark 定位 */
  dataTour?: string
  /** 新手引导第二步：强调预估阅读时间（如 &lt;3min） */
  tourEmphasizeTime?: boolean
  /**
   * 首页「待启动」：与 compact 联用，固定行高 + 列表区域可滚动
   */
  inboxHomeFixed?: boolean
}

function EstimatedTimeText({
  value,
  compact: isCompact,
}: {
  value: string
  compact?: boolean
}) {
  const quick = isQuickReadEstimate(value)
  return (
    <span
      className={cn(
        quick
          ? 'font-semibold text-orange-600 dark:text-orange-400'
          : 'text-muted-foreground',
        isCompact && quick && 'font-bold'
      )}
    >
      {value}
    </span>
  )
}

export function NoteCard({
  note,
  onClick,
  className,
  compact = false,
  listFixedHeight = false,
  dataTour,
  tourEmphasizeTime = false,
  inboxHomeFixed = false,
}: NoteCardProps) {
  const getTypeIcon = () => {
    const iconClass = compact ? 'h-3 w-3' : 'h-3.5 w-3.5'
    switch (note.type) {
      case 'url':
        return <Link className={cn(iconClass, 'text-primary')} />
      case 'file':
        return <FileText className={cn(iconClass, 'text-orange-500')} />
      case 'spark':
        return <Sparkles className={cn(iconClass, 'text-yellow-500')} />
    }
  }

  const displayContent = note.content || note.userNotes || '暂无内容'

  if (listFixedHeight && !compact) {
    return (
      <Card
        onClick={onClick}
        className={cn(
          'group relative flex h-[8.25rem] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/50 p-4 !gap-0 transition-all duration-300',
          'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-float)] hover:-translate-y-0.5',
          'active:scale-[0.99]',
          'bg-card/95 backdrop-blur-[2px]',
          className
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
          <div className="flex shrink-0 items-start gap-2">
            <div className="mt-0.5 flex-shrink-0">{getTypeIcon()}</div>
            <h3 className="line-clamp-1 min-h-5 flex-1 text-sm font-medium leading-tight text-foreground">
              {note.title}
            </h3>
            {note.isSpark && (
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500" />
            )}
          </div>
          <p className="line-clamp-2 min-h-0 flex-1 overflow-hidden text-xs leading-relaxed text-muted-foreground">
            {displayContent}
          </p>
        </div>
        <div className="mt-auto flex shrink-0 items-center justify-between gap-2 border-t border-border/30 pt-2">
          <div className="flex min-w-0 flex-wrap gap-1">
            {note.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-1.5 py-0 text-[10px] font-normal"
              >
                # {tag}
              </Badge>
            ))}
            {note.tags.length > 2 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                +{note.tags.length - 2}
              </Badge>
            )}
          </div>
          <div
            className={cn(
              'flex shrink-0 items-center gap-1 text-[10px]',
              !isQuickReadEstimate(note.estimatedTime) && 'text-muted-foreground'
            )}
          >
            <Clock
              className={cn(
                'h-3 w-3',
                isQuickReadEstimate(note.estimatedTime) && 'text-orange-500 dark:text-orange-400'
              )}
            />
            <EstimatedTimeText value={note.estimatedTime} />
          </div>
        </div>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card
        onClick={onClick}
        data-tour={dataTour}
        className={cn(
          'group relative cursor-pointer gap-0 overflow-hidden rounded-xl border border-border/50 p-2.5 transition-all duration-200',
          'shadow-[0_1px_3px_oklch(0.25_0.02_250/0.06)] hover:shadow-md hover:-translate-y-px active:scale-[0.99] bg-card/95',
          inboxHomeFixed && 'flex h-[5.75rem] shrink-0 flex-col',
          tourEmphasizeTime &&
            'relative z-[475] ring-2 ring-primary/65 ring-offset-2 ring-offset-background motion-safe:animate-pulse',
          className
        )}
      >
        <div
          className={cn(
            'flex gap-2',
            inboxHomeFixed ? 'min-h-0 flex-1' : 'items-start'
          )}
        >
          <div className="mt-0.5 flex-shrink-0">{getTypeIcon()}</div>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 items-start gap-1">
              <h3
                className={cn(
                  'flex-1 font-medium text-foreground',
                  inboxHomeFixed
                    ? 'line-clamp-2 text-xs leading-snug'
                    : 'line-clamp-1 text-xs leading-tight'
                )}
              >
                {note.title}
              </h3>
              {note.isSpark && (
                <Sparkles className="h-3 w-3 flex-shrink-0 text-yellow-500" />
              )}
            </div>
            <p
              className={cn(
                'line-clamp-1 leading-snug text-muted-foreground',
                inboxHomeFixed ? 'mt-0.5 text-[10px]' : 'mt-0.5 text-[11px]'
              )}
            >
              {displayContent}
            </p>
          </div>
        </div>
        <div
          className={cn(
            'flex items-center justify-between gap-2',
            inboxHomeFixed ? 'mt-auto shrink-0 border-t border-border/25 pt-1.5' : 'mt-1.5'
          )}
        >
          <div className="flex min-w-0 flex-wrap gap-0.5">
            {note.tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-1 py-0 text-[9px] font-normal leading-none"
              >
                #{tag}
              </Badge>
            ))}
            {note.tags.length > 2 && (
              <Badge variant="secondary" className="px-1 py-0 text-[9px] font-normal">
                +{note.tags.length - 2}
              </Badge>
            )}
          </div>
          <div
            className={cn(
              'flex shrink-0 items-center gap-0.5 text-[9px]',
              !isQuickReadEstimate(note.estimatedTime) && 'text-muted-foreground',
              tourEmphasizeTime &&
                'rounded-md bg-orange-500/10 px-1 py-0.5 ring-1 ring-orange-500/35 motion-safe:animate-pulse'
            )}
          >
            <Clock
              className={cn(
                'h-2.5 w-2.5',
                isQuickReadEstimate(note.estimatedTime) && 'text-orange-500 dark:text-orange-400'
              )}
            />
            <EstimatedTimeText value={note.estimatedTime} compact />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group relative cursor-pointer gap-0 overflow-hidden rounded-2xl border border-border/50 p-5 py-5 transition-all duration-300',
        'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-float)] hover:-translate-y-0.5',
        'active:scale-[0.99]',
        'bg-card/95 backdrop-blur-[2px]',
        className
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">{getTypeIcon()}</div>
        <h3 className="line-clamp-1 flex-1 text-sm font-medium text-foreground">{note.title}</h3>
        {note.isSpark && (
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500" />
        )}
      </div>

      <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {displayContent}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {note.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="px-1.5 py-0 text-[10px] font-normal"
            >
              # {tag}
            </Badge>
          ))}
          {note.tags.length > 2 && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
              +{note.tags.length - 2}
            </Badge>
          )}
        </div>

        <div
          className={cn(
            'flex items-center gap-1 text-[10px]',
            !isQuickReadEstimate(note.estimatedTime) && 'text-muted-foreground'
          )}
        >
          <Clock
            className={cn(
              'h-3 w-3',
              isQuickReadEstimate(note.estimatedTime) && 'text-orange-500 dark:text-orange-400'
            )}
          />
          <EstimatedTimeText value={note.estimatedTime} />
        </div>
      </div>
    </Card>
  )
}
