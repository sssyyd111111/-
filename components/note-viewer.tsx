'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  } = useNoteStore()

  const [userNotes, setUserNotes] = useState('')
  const [isHighlightMode, setIsHighlightMode] = useState(false)
  const [navigationIds, setNavigationIds] = useState<string[]>([])
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const navigationSeedRef = useRef<{
    noteId: string
    status: Note['status']
    isSpark: boolean
  } | null>(null)

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

  // 打开时确定可左右切换的笔记范围，避免因状态变化导致导航集合抖动
  useEffect(() => {
    if (!sourceNote) {
      setNavigationIds([])
      return
    }

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
    setNavigationIds(candidates.map((n) => n.id))
  }, [noteId, notes, currentView, selectedTag, filterByTag, sourceNote])

  const viewableNotes = useMemo(() => {
    if (navigationIds.length === 0) return []
    const noteMap = new Map(notes.map((n) => [n.id, n]))
    return navigationIds
      .map((id) => noteMap.get(id))
      .filter((note): note is Note => Boolean(note && !note.isDeleted))
  }, [navigationIds, notes])

  // 当前笔记索引
  const currentIndex = viewableNotes.findIndex((n) => n.id === noteId)
  const currentNote = viewableNotes[currentIndex]

  // 上一条/下一条
  const prevNote = currentIndex > 0 ? viewableNotes[currentIndex - 1] : null
  const nextNote =
    currentIndex < viewableNotes.length - 1
      ? viewableNotes[currentIndex + 1]
      : null

  // 初始化用户笔记
  useEffect(() => {
    if (currentNote) {
      setUserNotes(currentNote.userNotes)
    }
  }, [currentNote])

  // 打开笔记时更新状态
  useEffect(() => {
    if (currentNote && currentNote.status === 'inbox') {
      updateNote(currentNote.id, {
        lastViewedAt: Date.now(),
      })
    }
  }, [currentNote?.id])

  if (!currentNote) {
    return null
  }

  // 命中关键交互时，inbox 立即流转 processing
  const moveToProcessingIfInbox = () => {
    if (currentNote.status === 'inbox') {
      updateStatus(currentNote.id, 'processing')
      updateNote(currentNote.id, {
        lastViewedAt: Date.now(),
      })
    }
  }

  // 跳转原链接
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

  // 切换灵感标记
  const handleToggleSpark = () => {
    markAsSpark(currentNote.id, !currentNote.isSpark)
    moveToProcessingIfInbox()
  }

  // 标记已消化
  const handleMarkDone = () => {
    // 保存用户笔记
    if (userNotes !== currentNote.userNotes) {
      updateNote(currentNote.id, { userNotes })
    }
    markAsDone(currentNote.id)
    toast.success('已标记为完成')
    onClose()
  }

  // 删除笔记
  const handleDelete = () => {
    deleteNote(currentNote.id)
    toast.success('已移至回收站')
    onClose()
  }

  // 保存用户笔记
  const handleNotesChange = (value: string) => {
    setUserNotes(value)
    moveToProcessingIfInbox()
  }

  // 保存笔记内容
  const handleSaveNotes = () => {
    if (userNotes !== currentNote.userNotes) {
      updateNote(currentNote.id, { userNotes })
      toast.success('笔记已保存')
    }
  }

  // 导航到上一条
  const goToPrev = () => {
    if (prevNote) {
      setSlideDirection('left')
      handleSaveNotes()
      useNoteStore.getState().openViewer(prevNote.id)
    } else {
      toast.info('已经是第一条')
    }
  }

  // 导航到下一条
  const goToNext = () => {
    if (nextNote) {
      setSlideDirection('right')
      handleSaveNotes()
      useNoteStore.getState().openViewer(nextNote.id)
    } else {
      toast.info('已经全部查看完成！')
    }
  }

  // 关闭时提交状态变化
  const handleClose = () => {
    handleSaveNotes()
    onClose()
  }

  // 获取类型图标
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {/* 层叠卡片容器 */}
      <div className="relative flex h-[85vh] w-full max-w-[900px] items-center px-4">
        {/* 左侧卡片预览（上一条） */}
        {prevNote && (
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

        {/* 主卡片 - 宽度800px，内边距48px */}
        <Card
          key={currentNote.id}
          className={cn(
            'relative z-10 mx-auto flex h-full w-full max-w-[800px] flex-col overflow-hidden bg-card shadow-2xl',
            'animate-in duration-300',
            slideDirection === 'left' && 'slide-in-from-left-6',
            slideDirection === 'right' && 'slide-in-from-right-6'
          )}
        >
          {/* 顶部工具栏 */}
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
                  handleInteraction()
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

          {/* 内容区域 - 内边距48px */}
          <div className="flex-1 overflow-y-auto px-12 py-8">
            {/* 标题 */}
            <div className="mb-4 flex items-start gap-3">
              <div className="mt-1 flex-shrink-0">{getTypeIcon()}</div>
              <h1 className="text-xl font-semibold leading-tight text-foreground">
                {currentNote.title}
              </h1>
            </div>

            {/* 标签 */}
            <div className="mb-4 flex flex-wrap gap-1.5">
              {currentNote.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  # {tag}
                </Badge>
              ))}
            </div>

            {/* 跳转原链接 */}
            {currentNote.type === 'url' && currentNote.sourceUrl && (
              <Button
                variant="outline"
                size="sm"
                className="mb-4 gap-2"
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

            {/* AI 摘要 */}
            {currentNote.content && (
              <div className="mb-6">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  AI 摘要
                </h3>
                <div
                  className={cn(
                    'rounded-lg bg-muted/50 p-4 text-sm leading-relaxed',
                    isHighlightMode && 'selection:bg-yellow-200'
                  )}
                >
                  {currentNote.content}
                </div>
              </div>
            )}

            {/* 用户笔记 */}
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

          {/* 底部操作区 */}
          <div className="border-t p-4">
            <Button
              className="mb-3 w-full gap-2"
              onClick={handleMarkDone}
            >
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

        {/* 右侧卡片预览（下一条） */}
        {nextNote && (
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
