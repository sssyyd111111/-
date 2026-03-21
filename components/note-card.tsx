'use client'

import { Link, FileText, Sparkles, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Note } from '@/lib/types'
import { cn } from '@/lib/utils'

interface NoteCardProps {
  note: Note
  onClick?: () => void
  className?: string
}

export function NoteCard({ note, onClick, className }: NoteCardProps) {
  const getTypeIcon = () => {
    switch (note.type) {
      case 'url':
        return <Link className="h-3.5 w-3.5 text-blue-500" />
      case 'file':
        return <FileText className="h-3.5 w-3.5 text-orange-500" />
      case 'spark':
        return <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
    }
  }

  const displayContent = note.content || note.userNotes || '暂无内容'

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group relative cursor-pointer overflow-hidden p-4 transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        'active:scale-[0.98]',
        'bg-card border border-border/50',
        className
      )}
    >
      {/* 标题区域 */}
      <div className="mb-2 flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">{getTypeIcon()}</div>
        <h3 className="line-clamp-1 flex-1 text-sm font-medium text-foreground">
          {note.title}
        </h3>
        {note.isSpark && (
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500" />
        )}
      </div>

      {/* 内容摘要 */}
      <p className="mb-3 line-clamp-1 text-xs text-muted-foreground">
        {displayContent}
      </p>

      {/* 底部信息 */}
      <div className="flex items-center justify-between">
        {/* 标签 */}
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
            <Badge
              variant="secondary"
              className="px-1.5 py-0 text-[10px] font-normal"
            >
              +{note.tags.length - 2}
            </Badge>
          )}
        </div>

        {/* 预计阅读时间 */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{note.estimatedTime}</span>
        </div>
      </div>
    </Card>
  )
}
