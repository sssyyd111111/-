'use client'

import { Lightbulb, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useNoteStore } from '@/lib/store'
import { Note } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SparkModuleProps {
  onNoteClick: (noteId: string) => void
  onHeaderClick: () => void
}

export function SparkModule({ onNoteClick, onHeaderClick }: SparkModuleProps) {
  const getSparkNotes = useNoteStore((state) => state.getSparkNotes)
  const displayNotes = getSparkNotes()
  const totalCount = displayNotes.length

  return (
    <div className="flex flex-col">
      {/* 模块标题 - 可点击 */}
      <button
        onClick={onHeaderClick}
        className="mb-4 flex w-full items-center justify-between rounded-lg p-2 transition-colors hover:bg-accent/50"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-semibold text-foreground">灵感时刻</h2>
            <p className="text-xs text-muted-foreground">
              收藏的精华，随时回顾
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-sm font-medium">{totalCount}</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>

      {/* 灵感卡片网格 - 固定显示2条 */}
      {displayNotes.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {displayNotes.slice(0, 2).map((note) => (
            <SparkCard key={note.id} note={note} onClick={() => onNoteClick(note.id)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-8 text-center">
          <Lightbulb className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">暂无灵感收藏</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            阅读时点击灯泡图标收藏灵感
          </p>
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
        'group relative cursor-pointer overflow-hidden p-3 transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        'active:scale-[0.98]',
        'bg-gradient-to-br from-yellow-50/50 to-orange-50/30 border border-yellow-100/50'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
        {note.tags[0] && (
          <Badge
            variant="secondary"
            className="bg-yellow-100/50 px-1.5 py-0 text-[10px] font-normal text-yellow-700"
          >
            # {note.tags[0]}
          </Badge>
        )}
      </div>
      <h3 className="mb-1 line-clamp-1 text-xs font-medium text-foreground">
        {note.title}
      </h3>
      <p className="line-clamp-3 text-xs text-foreground/80">{displayContent}</p>
    </Card>
  )
}
