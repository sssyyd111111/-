'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  X,
  Lightbulb,
  Highlighter,
  ExternalLink,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Link,
  FileText,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useNoteStore } from '@/lib/store'
import { Note } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const MAX_TAGS = 6
const MIN_TAGS = 1

interface NoteViewerProps {
  noteId: string
  onClose: () => void
}

export function NoteViewer({ noteId, onClose }: NoteViewerProps) {
  const {
    notes,
    currentView,
    selectedTag,
    updateNote,
    deleteNote,
    markAsSpark,
    markAsDone,
    updateStatus,
    filterByTag,
    getAllTags,
  } = useNoteStore()

  const [userNotes, setUserNotes] = useState('')
  const [titleDraft, setTitleDraft] = useState('')
  const [tagsDraft, setTagsDraft] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false)
  const [isHighlightMode, setIsHighlightMode] = useState(false)
  const [navigationIds, setNavigationIds] = useState<string[]>([])
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const navigationSeedRef = useRef<{
    noteId: string
    status: Note['status']
    isSpark: boolean
  } | null>(null)
  const navInitedRef = useRef(false)
  /** 避免首屏 navigationIds 尚未写入时 pool 为空误触「全部完成」 */
  const poolHadNotesRef = useRef(false)

  const allTags = getAllTags()

  const sourceNote = notes.find((n) => n.id === noteId) || null

  useEffect(() => {
    if (navigationSeedRef.current?.noteId === noteId) {
      return
    }
    const openingNote = notes.find((n) => n.id === noteId)
    if (!openingNote) {
      navigationSeedRef.current = null
      return
    }
    navigationSeedRef.current = {
      noteId,
      status: openingNote.status,
      isSpark: openingNote.isSpark,
    }
  }, [noteId, notes])

  const buildCandidateIds = useCallback((): string[] => {
    if (!sourceNote) return []
    const seed = navigationSeedRef.current
    const seedStatus = seed?.status || sourceNote.status
    const seedIsSpark = seed?.isSpark ?? sourceNote.isSpark

    const visible = notes.filter((n) => !n.isDeleted)
    let candidates: Note[] = []

    if (seedStatus === 'inbox' || seedStatus === 'active' || seedStatus === 'loading') {
      candidates = visible.filter((n) =>
        ['inbox', 'active', 'loading'].includes(n.status)
      )
    } else {
      switch (currentView) {
        case 'inbox':
          candidates = visible.filter((n) =>
            ['inbox', 'active', 'loading'].includes(n.status)
          )
          break
        case 'processing':
          candidates = visible.filter((n) => n.status === 'processing')
          break
        case 'spark':
          candidates = visible.filter((n) => n.isSpark && n.status === 'done')
          break
        case 'tag':
          candidates = selectedTag ? filterByTag(selectedTag) : []
          break
        case 'trash':
          candidates = notes.filter((n) => n.isDeleted)
          break
        case 'home':
        default:
          if (seedStatus === 'processing') {
            candidates = visible.filter((n) => n.status === 'processing')
          } else if (seedIsSpark && seedStatus === 'done') {
            candidates = visible.filter((n) => n.isSpark && n.status === 'done')
          } else {
            candidates = visible
          }
          break
      }
    }

    candidates.sort((a, b) => b.createdAt - a.createdAt)
    if (!candidates.some((n) => n.id === sourceNote.id)) {
      candidates = [sourceNote, ...candidates]
    }
    return candidates.map((n) => n.id)
  }, [sourceNote, notes, currentView, selectedTag, filterByTag])

  useEffect(() => {
    if (!sourceNote || navInitedRef.current) return
    navInitedRef.current = true
    setNavigationIds(buildCandidateIds())
  }, [sourceNote, buildCandidateIds])

  const matchesSeedPool = useCallback(
    (note: Note) => {
      const seed = navigationSeedRef.current
      if (!seed) return true
      const seedStatus = seed.status
      const seedIsSpark = seed.isSpark

      if (note.isDeleted) {
        return currentView === 'trash'
      }

      if (seedStatus === 'inbox' || seedStatus === 'active' || seedStatus === 'loading') {
        return ['inbox', 'active', 'loading'].includes(note.status)
      }
      if (seedStatus === 'processing') {
        return note.status === 'processing'
      }
      if (seedIsSpark && seedStatus === 'done') {
        return note.isSpark && note.status === 'done'
      }
      switch (currentView) {
        case 'tag':
          return selectedTag ? filterByTag(selectedTag).some((n) => n.id === note.id) : false
        case 'trash':
          return note.isDeleted
        default:
          return true
      }
    },
    [currentView, selectedTag, filterByTag]
  )

  const poolFilteredNotes = useMemo(() => {
    return navigationIds
      .map((id) => notes.find((n) => n.id === id))
      .filter((note): note is Note => Boolean(note && !note.isDeleted && matchesSeedPool(note)))
  }, [navigationIds, notes, matchesSeedPool])

  const currentNote = notes.find((n) => n.id === noteId)

  useEffect(() => {
    if (!currentNote) return
    setUserNotes(currentNote.userNotes)
    setTitleDraft(currentNote.title)
    setTagsDraft([...currentNote.tags])
  }, [currentNote?.id])

  useEffect(() => {
    if (currentNote && currentNote.status === 'inbox') {
      updateNote(currentNote.id, {
        lastViewedAt: Date.now(),
      })
    }
  }, [currentNote?.id])

  /** 当前笔记已不在「池中」且仍有其它可浏览项时，切到第一个仍在池中的 */
  useEffect(() => {
    if (!currentNote || poolFilteredNotes.length === 0) return
    if (!poolFilteredNotes.some((n) => n.id === noteId)) {
      const target = poolFilteredNotes[0]
      if (target) {
        useNoteStore.getState().openViewer(target.id)
      }
    }
  }, [poolFilteredNotes, noteId, currentNote])

  /** 仅在环里曾经有过可展示笔记后，池变空才提示「全部完成」（排除首次打开前的空池） */
  useEffect(() => {
    if (poolFilteredNotes.length > 0) {
      poolHadNotesRef.current = true
      return
    }
    if (!poolHadNotesRef.current) return
    toast.success('全部处理完成，获得清爽大脑~')
    onClose()
  }, [poolFilteredNotes.length, onClose])

  if (!currentNote) {
    return null
  }

  const moveToProcessingIfInbox = () => {
    if (currentNote.status === 'inbox') {
      updateStatus(currentNote.id, 'processing')
      updateNote(currentNote.id, {
        lastViewedAt: Date.now(),
      })
    }
  }

  const handleOpenSource = () => {
    if (currentNote.sourceUrl) {
      moveToProcessingIfInbox()
      window.open(currentNote.sourceUrl, '_blank')
    }
  }

  const handleOpenLocalFile = () => {
    if (currentNote.type === 'file' && currentNote.sourceUrl) {
      moveToProcessingIfInbox()
      window.open(currentNote.sourceUrl, '_blank')
    }
  }

  const handleToggleSpark = () => {
    markAsSpark(currentNote.id, !currentNote.isSpark)
    moveToProcessingIfInbox()
  }

  const handleSaveTitle = () => {
    const t = titleDraft.trim()
    if (t && t !== currentNote.title) {
      updateNote(currentNote.id, { title: t })
    }
  }

  const commitTags = (next: string[]) => {
    const normalized = next.map((x) => x.trim()).filter(Boolean)
    if (normalized.length < MIN_TAGS) {
      setTagsDraft([...currentNote.tags])
      return
    }
    if (normalized.length > MAX_TAGS) {
      setTagsDraft([...currentNote.tags])
      return
    }
    updateNote(currentNote.id, { tags: normalized })
    setTagsDraft(normalized)
    moveToProcessingIfInbox()
  }

  const removeTag = (tag: string) => {
    if (tagsDraft.length === 1) {
      commitTags(['未归类'])
      return
    }
    const next = tagsDraft.filter((t) => t !== tag)
    commitTags(next)
  }

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#+\s*/, '')
    if (!tag) return
    if (tagsDraft.includes(tag)) {
      setTagInput('')
      setTagPopoverOpen(false)
      return
    }
    if (tagsDraft.length >= MAX_TAGS) {
      return
    }
    commitTags([...tagsDraft, tag])
    setTagInput('')
    setTagPopoverOpen(false)
  }

  const handleMarkDone = () => {
    if (userNotes !== currentNote.userNotes) {
      updateNote(currentNote.id, { userNotes })
    }
    const list = poolFilteredNotes
    const idx = list.findIndex((n) => n.id === noteId)

    if (list.length <= 1) {
      markAsDone(currentNote.id)
      setNavigationIds((prev) => prev.filter((id) => id !== currentNote.id))
      return
    }

    const nextInRing = list[(idx + 1) % list.length]!
    markAsDone(currentNote.id)
    setNavigationIds((prev) => prev.filter((id) => id !== currentNote.id))
    setSlideDirection('right')
    useNoteStore.getState().openViewer(nextInRing.id)
  }

  const handleDelete = () => {
    deleteNote(currentNote.id)
    onClose()
  }

  const handleNotesChange = (value: string) => {
    setUserNotes(value)
    moveToProcessingIfInbox()
  }

  const handleSaveNotes = () => {
    if (userNotes !== currentNote.userNotes) {
      updateNote(currentNote.id, { userNotes })
    }
  }

  const goToPrev = () => {
    if (poolFilteredNotes.length === 0) return
    setSlideDirection('left')
    handleSaveNotes()
    const i = poolFilteredNotes.findIndex((n) => n.id === noteId)
    const l = poolFilteredNotes.length
    const prev = poolFilteredNotes[(i - 1 + l) % l]!
    useNoteStore.getState().openViewer(prev.id)
  }

  const goToNext = () => {
    if (poolFilteredNotes.length === 0) return
    setSlideDirection('right')
    handleSaveNotes()
    const i = poolFilteredNotes.findIndex((n) => n.id === noteId)
    const l = poolFilteredNotes.length
    const next = poolFilteredNotes[(i + 1) % l]!
    useNoteStore.getState().openViewer(next.id)
  }

  const handleClose = () => {
    handleSaveNotes()
    onClose()
  }

  const getTypeIcon = () => {
    switch (currentNote.type) {
      case 'url':
        return <Link className="h-4 w-4 text-blue-500" />
      case 'file':
        return <FileText className="h-4 w-4 text-orange-500" />
      case 'spark':
        return <Sparkles className="h-4 w-4 text-yellow-500" />
    }
  }

  const showSideNav = poolFilteredNotes.length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative flex h-[85vh] w-full max-w-[900px] items-center px-4">
        {showSideNav && (
          <div
            onClick={goToPrev}
            className="absolute left-0 z-0 h-[75vh] w-16 cursor-pointer opacity-60 transition-all duration-300 hover:opacity-80"
          >
            <Card className="h-full rounded-r-none border-r-0 bg-card/80 backdrop-blur">
              <div className="flex h-full items-center justify-center">
                <ChevronLeft className="h-6 w-6 text-muted-foreground" />
              </div>
            </Card>
          </div>
        )}

        <Card
          key={currentNote.id}
          className={cn(
            'relative z-10 mx-auto flex h-full w-full max-w-[800px] flex-col overflow-hidden bg-card shadow-2xl',
            'animate-in duration-300',
            slideDirection === 'left' && 'slide-in-from-left-6',
            slideDirection === 'right' && 'slide-in-from-right-6'
          )}
        >
          <div className="flex items-center justify-between border-b p-4">
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant={currentNote.isSpark ? 'secondary' : 'ghost'}
                size="icon"
                onClick={handleToggleSpark}
                title="标记灵感"
              >
                <Lightbulb
                  className={cn(
                    'h-4 w-4',
                    currentNote.isSpark && 'text-yellow-500'
                  )}
                />
              </Button>
              <Button
                variant={isHighlightMode ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => {
                  setIsHighlightMode(!isHighlightMode)
                  moveToProcessingIfInbox()
                }}
                title="高亮勾画"
              >
                <Highlighter
                  className={cn(
                    'h-4 w-4',
                    isHighlightMode && 'text-green-500'
                  )}
                />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-12 py-8">
            <div className="mb-4 flex items-start gap-3">
              <div className="mt-1 flex-shrink-0">{getTypeIcon()}</div>
              <Input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleSaveTitle}
                className="border-transparent bg-transparent text-3xl font-semibold leading-tight text-foreground shadow-none hover:bg-muted/30 focus-visible:ring-1"
              />
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              {tagsDraft.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 pr-1 text-xs"
                >
                  # {tag}
                  <button
                    type="button"
                    className="rounded p-0.5 hover:bg-muted"
                    onClick={() => removeTag(tag)}
                    aria-label={`移除标签 ${tag}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {tagsDraft.length < MAX_TAGS && (
                <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
                      <Plus className="h-3 w-3" />
                      标签
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTag(tagInput)
                          } else if (e.key === 'Escape') {
                            setTagInput('')
                            setTagPopoverOpen(false)
                          }
                        }}
                        placeholder="输入新标签后回车"
                        className="h-8 text-xs"
                        autoFocus
                      />
                      <div className="max-h-44 overflow-y-auto rounded-md border p-1">
                        {allTags
                          .filter((tag) =>
                            tag.toLowerCase().includes(tagInput.trim().toLowerCase())
                          )
                          .filter((tag) => !tagsDraft.includes(tag))
                          .map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => addTag(tag)}
                              className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-accent"
                            >
                              # {tag}
                            </button>
                          ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {currentNote.type === 'url' && currentNote.sourceUrl && (
              <Button
                size="sm"
                className="mb-4 gap-2 bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleOpenSource}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                访问原链接
              </Button>
            )}

            {currentNote.type === 'file' && currentNote.sourceUrl && (
              <Button
                variant="outline"
                size="sm"
                className="mb-4 gap-2"
                onClick={handleOpenLocalFile}
              >
                <FileText className="h-3.5 w-3.5" />
                打开本地文件
              </Button>
            )}

            {currentNote.content && (
              <div className="mb-6">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  AI 摘要
                </h3>
                <div
                  className={cn(
                    'rounded-lg bg-[#e6f7f2]/95 p-4 text-sm leading-relaxed text-foreground',
                    isHighlightMode && 'selection:bg-yellow-200'
                  )}
                >
                  {currentNote.content}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                我的笔记
              </h3>
              <Textarea
                value={userNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="开始写下你的灵感吧..."
                className="min-h-[150px] resize-none"
              />
            </div>
          </div>

          <div className="border-t p-4">
            <Button className="mb-3 w-full gap-2" onClick={handleMarkDone}>
              <Check className="h-4 w-4" />
              已消化
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <p className="cursor-pointer text-center text-sm text-muted-foreground transition-colors hover:text-destructive">
                  删除该条目
                </p>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除</AlertDialogTitle>
                  <AlertDialogDescription>
                    确定要删除这条笔记吗？删除后将移入回收站。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>

        {showSideNav && (
          <div
            onClick={goToNext}
            className="absolute right-0 z-0 h-[75vh] w-16 cursor-pointer opacity-60 transition-all duration-300 hover:opacity-80"
          >
            <Card className="h-full rounded-l-none border-l-0 bg-card/80 backdrop-blur">
              <div className="flex h-full items-center justify-center">
                <ChevronRight className="h-6 w-6 text-muted-foreground" />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
