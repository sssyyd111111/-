'use client'

import { useState } from 'react'
import {
  Search,
  ArrowUpDown,
  Inbox,
  Clock,
  Lightbulb,
  Tag,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NoteCard } from '@/components/note-card'
import { useNoteStore } from '@/lib/store'
import { SortOption, ViewType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface NoteListPageProps {
  onNoteClick: (noteId: string) => void
}

// 视图配置
const viewConfig: Record<
  Exclude<ViewType, 'home'>,
  {
    icon: typeof Inbox
    title: string
    description: string
    iconBg: string
    iconColor: string
  }
> = {
  inbox: {
    icon: Inbox,
    title: '待启动',
    description: '等待你去探索的知识宝藏',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  processing: {
    icon: Clock,
    title: '处理中',
    description: '正在消化吸收的内容',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  spark: {
    icon: Lightbulb,
    title: '灵感时刻',
    description: '收藏的精华，随时回顾',
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
  },
  tag: {
    icon: Tag,
    title: '标签筛选',
    description: '按标签分类的知识',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  trash: {
    icon: Trash2,
    title: '回收站',
    description: '已删除的内容，可以恢复',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
  },
}

// 排序选项
const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'createdAt-desc', label: '时间倒序' },
  { value: 'createdAt-asc', label: '时间正序' },
  { value: 'estimatedTime-asc', label: '阅读时间短' },
  { value: 'estimatedTime-desc', label: '阅读时间长' },
]

export function NoteListPage({ onNoteClick }: NoteListPageProps) {
  const {
    currentView,
    selectedTag,
    searchQuery,
    sortOption,
    setSearchQuery,
    setSortOption,
    getFilteredNotes,
    restoreNote,
    permanentDelete,
  } = useNoteStore()

  const [localSearch, setLocalSearch] = useState(searchQuery)
  const notes = getFilteredNotes()

  if (currentView === 'home') {
    return null
  }

  const config = currentView === 'tag' && selectedTag
    ? {
        ...viewConfig.tag,
        title: `# ${selectedTag}`,
      }
    : viewConfig[currentView]

  const Icon = config.icon

  const handleSearch = () => {
    setSearchQuery(localSearch)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* 顶部信息卡片 */}
      <div className="mb-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl',
                config.iconBg
              )}
            >
              <Icon className={cn('h-6 w-6', config.iconColor)} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {config.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <span className="text-xl font-bold text-foreground">
              {notes.length}
            </span>
          </div>
        </div>
      </div>

      {/* 搜索和排序栏 */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="根据标题、摘要、笔记等搜索条目..."
            className="pr-10"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full"
            onClick={handleSearch}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setSortOption(option.value)}
                className={cn(
                  sortOption === option.value && 'bg-accent'
                )}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 笔记列表 */}
      <ScrollArea className="flex-1">
        {notes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 pb-4">
            {notes.map((note) => (
              <div key={note.id} className="relative">
                <NoteCard
                  note={note}
                  onClick={() => {
                    if (note.type === 'file' && note.sourceUrl) {
                      window.open(note.sourceUrl, '_blank')
                      return
                    }
                    onNoteClick(note.id)
                  }}
                />
                {/* 回收站特殊操作 */}
                {currentView === 'trash' && (
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        restoreNote(note.id)
                      }}
                      title="恢复"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        permanentDelete(note.id)
                      }}
                      title="永久删除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icon className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">暂无相关笔记</p>
            {searchQuery && (
              <p className="mt-1 text-xs text-muted-foreground/70">
                尝试使用其他关键词搜索
              </p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
