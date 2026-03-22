'use client'

import { FolderOpen, ChevronRight } from 'lucide-react'
import { NoteCard } from '@/components/note-card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  homeDashboardListScrollAreaClass,
  homeDashboardSingleColumnGridClass,
} from '@/lib/home-list-styles'
import { openNoteOrFile } from '@/lib/open-note-or-file'
import { useNoteStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface ProcessingModuleProps {
  onNoteClick: (noteId: string) => void
  onHeaderClick: () => void
}

const headerShell =
  'mb-2 w-full shrink-0 rounded-2xl border border-border/70 bg-card/95 p-4 text-left shadow-[var(--shadow-card)] backdrop-blur-sm transition-all hover:border-border hover:shadow-md'

export function ProcessingModule({ onNoteClick, onHeaderClick }: ProcessingModuleProps) {
  const getProcessingNotes = useNoteStore((state) => state.getProcessingNotes)
  const displayNotes = getProcessingNotes()
  const totalCount = displayNotes.length

  return (
    <div className="flex min-h-0 flex-1 flex-col max-lg:flex-none">
      <button type="button" onClick={onHeaderClick} className={headerShell}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
                'bg-primary/10 ring-1 ring-primary/10 dark:bg-primary/15'
              )}
            >
              <FolderOpen className="h-8 w-8 text-primary" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-foreground">处理中</h2>
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                摄入信息中，继续上次的进度
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-3xl font-bold tabular-nums text-primary">{totalCount}</span>
            <ChevronRight className="h-7 w-7 text-muted-foreground" />
          </div>
        </div>
      </button>

      <ScrollArea className={homeDashboardListScrollAreaClass}>
        {displayNotes.length > 0 ? (
          <div className={cn(homeDashboardSingleColumnGridClass, 'items-start')}>
            {displayNotes.map((note) => (
              <div key={note.id} className="min-w-0">
                <NoteCard
                  note={note}
                  listFixedHeight
                  onClick={() => openNoteOrFile(note, onNoteClick)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/25 py-16 text-center">
            <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">暂无处理中的笔记</p>
            <p className="mt-1 text-xs text-muted-foreground/70">点击待启动的笔记开始阅读</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
