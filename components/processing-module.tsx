'use client'

import { Clock, ChevronRight } from 'lucide-react'
import { NoteCard } from '@/components/note-card'
import { useNoteStore } from '@/lib/store'

interface ProcessingModuleProps {
  onNoteClick: (noteId: string) => void
  onHeaderClick: () => void
}

export function ProcessingModule({ onNoteClick, onHeaderClick }: ProcessingModuleProps) {
  const getProcessingNotes = useNoteStore((state) => state.getProcessingNotes)
  const displayNotes = getProcessingNotes()
  const totalCount = displayNotes.length

  return (
    <div className="flex flex-col">
      {/* 模块标题 - 可点击 */}
      <button
        onClick={onHeaderClick}
        className="mb-4 flex w-full items-center justify-between rounded-lg p-2 transition-colors hover:bg-accent/50"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
            <Clock className="h-4 w-4 text-orange-600" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-semibold text-foreground">处理中</h2>
            <p className="text-xs text-muted-foreground">
              继续上次的阅读进度
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-sm font-medium">{totalCount}</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>

      {/* 笔记列表 - 固定显示3条 */}
      <div className="flex flex-col gap-3">
        {displayNotes.length > 0 ? (
          displayNotes.slice(0, 3).map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => onNoteClick(note.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-8 text-center">
            <Clock className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">暂无处理中的笔记</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              点击待启动的笔记开始阅读
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
