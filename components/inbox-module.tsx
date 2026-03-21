'use client'

import { Inbox, ChevronRight } from 'lucide-react'
import { NoteCard } from '@/components/note-card'
import { useNoteStore } from '@/lib/store'

interface InboxModuleProps {
  onNoteClick: (noteId: string) => void
  onHeaderClick: () => void
}

export function InboxModule({ onNoteClick, onHeaderClick }: InboxModuleProps) {
  const getInboxNotes = useNoteStore((state) => state.getInboxNotes)
  const notes = useNoteStore((state) => state.notes)
  
  const displayNotes = getInboxNotes()
  const totalCount = notes.filter(
    (n) => ['inbox', 'loading', 'active'].includes(n.status) && !n.isDeleted
  ).length

  return (
    <div className="flex flex-col">
      {/* 模块标题 - 可点击 */}
      <button
        onClick={onHeaderClick}
        className="mb-4 flex w-full items-center justify-between rounded-lg p-2 transition-colors hover:bg-accent/50"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <Inbox className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-semibold text-foreground">待启动</h2>
            <p className="text-xs text-muted-foreground">
              快速开始，每次只看5条
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-sm font-medium">{totalCount}</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>

      {/* 笔记列表 - 固定显示5条 */}
      <div className="flex flex-col gap-3">
        {displayNotes.length > 0 ? (
          displayNotes.slice(0, 5).map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => onNoteClick(note.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-8 text-center">
            <Inbox className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">暂无待启动的笔记</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              在下方输入框添加新内容
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
