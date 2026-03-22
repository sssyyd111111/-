'use client'

import { StickyNote, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNoteStore } from '@/lib/store'
import { Note } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SparkModuleProps {
  onNoteClick: (noteId: string) => void
  onHeaderClick: () => void
}

const headerShell =
  'sticky top-0 z-10 mb-2 w-full rounded-2xl border border-border/70 bg-card/95 p-4 text-left shadow-[var(--shadow-card)] backdrop-blur-sm transition-all hover:border-border hover:shadow-md'

export function SparkModule({ onNoteClick, onHeaderClick }: SparkModuleProps) {
  const getSparkNotes = useNoteStore((state) => state.getSparkNotes)
  const displayNotes = getSparkNotes()
  const totalCount = displayNotes.length

  return (
    <div className="flex min-h-0 shrink-0 flex-col">
      <button type="button" onClick={onHeaderClick} className={headerShell}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
                'bg-primary/10 ring-1 ring-primary/10 dark:bg-primary/15'
              )}
            >
              <StickyNote className="h-7 w-7 text-primary" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-foreground">灵感时刻</h2>
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                把那些灵机一动的想法落地吧
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-3xl font-bold tabular-nums text-primary">{totalCount}</span>
            <ChevronRight className="h-7 w-7 text-muted-foreground" />
          </div>
        </div>
      </button>

      {displayNotes.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {displayNotes.slice(0, 2).map((note) => (
            <SparkCard key={note.id} note={note} onClick={() => onNoteClick(note.id)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/25 py-6 text-center">
          <StickyNote className="mb-2 h-7 w-7 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">暂无灵感收藏</p>
          <p className="mt-1 text-xs text-muted-foreground/70">阅读时点击灯泡图标收藏灵感</p>
        </div>
      )}
    </div>
  )
}

function SparkCard({ note, onClick }: { note: Note; onClick: () => void }) {
  const displayContent = note.userNotes || note.content || '暂无内容'

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group relative cursor-pointer gap-0 overflow-hidden rounded-xl border border-border/60 bg-card/95 p-2.5 transition-all duration-200',
        'shadow-[var(--shadow-card)] hover:-translate-y-px hover:shadow-md',
        'active:scale-[0.99]'
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-1">
        <StickyNote className="h-3 w-3 text-primary" />
        {note.tags[0] && (
          <Badge
            variant="secondary"
            className="max-w-[4.5rem] truncate bg-muted/80 px-1 py-0 text-[9px] font-normal text-muted-foreground"
          >
            #{note.tags[0]}
          </Badge>
        )}
      </div>
      <h3 className="mb-0.5 line-clamp-1 text-[11px] font-semibold leading-tight text-foreground">
        {note.title}
      </h3>
      <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">{displayContent}</p>
    </Card>
  )
}
