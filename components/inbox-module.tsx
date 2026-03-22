'use client'

import { Flame, ChevronRight } from 'lucide-react'
import { NoteCard } from '@/components/note-card'
import { useOnboardingTour } from '@/components/onboarding-tour-provider'
import { useNoteStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface InboxModuleProps {
  onNoteClick: (noteId: string) => void
  onHeaderClick: () => void
}

const headerShell =
  'sticky top-0 z-10 mb-2 w-full rounded-2xl border border-border/70 bg-card/95 p-4 text-left shadow-[var(--shadow-card)] backdrop-blur-sm transition-all hover:border-border hover:shadow-md'

export function InboxModule({ onNoteClick, onHeaderClick }: InboxModuleProps) {
  const onboarding = useOnboardingTour()
  const getInboxNotes = useNoteStore((state) => state.getInboxNotes)
  const notes = useNoteStore((state) => state.notes)

  const displayNotes = getInboxNotes()
  const totalCount = notes.filter(
    (n) => ['inbox', 'loading', 'active'].includes(n.status) && !n.isDeleted
  ).length

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <button type="button" onClick={onHeaderClick} className={cn(headerShell, 'shrink-0')}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
                'bg-primary/10 ring-1 ring-primary/10 dark:bg-primary/15'
              )}
            >
              <Flame
                className="h-8 w-8 text-primary drop-shadow-sm animate-flame-breathe"
                strokeWidth={2}
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-foreground">待启动</h2>
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                快速结束吃灰，点开看一眼吧~
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="text-3xl font-bold tabular-nums text-primary">{totalCount}</span>
            <ChevronRight className="h-7 w-7 text-muted-foreground" />
          </div>
        </div>
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] pr-0.5">
        <div className="flex flex-col gap-2 pb-1">
        {displayNotes.length > 0 ? (
          displayNotes.slice(0, 5).map((note) => {
            const isTourCard =
              onboarding?.isActive &&
              onboarding.step === 2 &&
              onboarding.tourNoteId === note.id
            return (
              <NoteCard
                key={note.id}
                note={note}
                compact
                inboxHomeFixed
                dataTour={isTourCard ? 'onboarding-inbox-note' : undefined}
                tourEmphasizeTime={Boolean(isTourCard)}
                onClick={() => onNoteClick(note.id)}
              />
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/25 py-8 text-center">
            <Flame className="mb-2 h-7 w-7 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">暂无待启动的笔记</p>
            <p className="mt-1 text-xs text-muted-foreground/70">在下方输入框添加新内容</p>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
