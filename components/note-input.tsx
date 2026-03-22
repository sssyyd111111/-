'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  Send,
  Sparkles,
  Bell,
  Plus,
  X,
  Link,
  Upload,
  FileText,
  ImageIcon,
  Lightbulb,
  Calendar,
  Clock,
  Moon,
  Sun,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import * as mammoth from 'mammoth'
import { createWorker } from 'tesseract.js'
import { toast } from 'sonner'
import { useNoteStore } from '@/lib/store'
import {
  ONBOARDING_DEMO_SUMMARY,
  ONBOARDING_DEMO_URL,
  isOnboardingDemoUrl,
} from '@/lib/onboarding-tour'
import { NoteType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useOnboardingTour } from '@/components/onboarding-tour-provider'

// URL 正则表达式
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,})([/?#].*)?$/i

// 提醒时间选项
type ReminderOption = {
  label: string
  icon: typeof Clock
  getTime: () => number
}

const reminderOptions: ReminderOption[] = [
  {
    label: '晚点看（2h后）',
    icon: Clock,
    getTime: () => Date.now() + 2 * 60 * 60 * 1000,
  },
  {
    label: '今晚看（22:00）',
    icon: Moon,
    getTime: () => {
      const now = new Date()
      const tonight = new Date(now)
      tonight.setHours(22, 0, 0, 0)
      if (tonight.getTime() <= now.getTime()) {
        tonight.setDate(tonight.getDate() + 1)
      }
      return tonight.getTime()
    },
  },
  {
    label: '明早看（8:00）',
    icon: Sun,
    getTime: () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(8, 0, 0, 0)
      return tomorrow.getTime()
    },
  },
]

type PendingFile = {
  id: string
  name: string
  dataUrl: string
  extractedText: string
  mimeType: string
}

function normalizeUrl(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

const IMAGE_MIME_PREFIX = 'image/'
const WORD_MIME_TYPES = new Set([
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
const MARKDOWN_MIME_TYPES = new Set([
  'text/markdown',
  'text/x-markdown',
  'text/plain',
])
const ALLOWED_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'svg',
  'tif',
  'tiff',
  'md',
  'markdown',
  'doc',
  'docx',
])

function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split('.')
  return parts.length > 1 ? parts.pop() || '' : ''
}

function isAllowedFile(file: File) {
  const ext = getFileExtension(file.name)
  if (ALLOWED_EXTENSIONS.has(ext)) return true
  if (file.type.startsWith(IMAGE_MIME_PREFIX)) return true
  if (WORD_MIME_TYPES.has(file.type)) return true
  if (MARKDOWN_MIME_TYPES.has(file.type) && (ext === 'md' || ext === 'markdown')) {
    return true
  }
  return false
}

export function NoteInput() {
  const [input, setInput] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [enableAiSummary, setEnableAiSummary] = useState(false)
  const [reminderTime, setReminderTime] = useState<number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [hoveredButton, setHoveredButton] = useState<'ai' | 'reminder' | null>(null)
  const [showReminderPopover, setShowReminderPopover] = useState(false)
  const [showTagPopover, setShowTagPopover] = useState(false)
  const [showCustomCalendar, setShowCustomCalendar] = useState(false)
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [urlTitle, setUrlTitle] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isRecognizingWeb, setIsRecognizingWeb] = useState(false)
  const [inputAreaHovered, setInputAreaHovered] = useState(false)
  const [textareaFocused, setTextareaFocused] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const ocrWorkerRef = useRef<Awaited<ReturnType<typeof createWorker>> | null>(null)

  const addNote = useNoteStore((state) => state.addNote)
  const updateNote = useNoteStore((state) => state.updateNote)
  const onboarding = useOnboardingTour()
  const onboardingPrefilledRef = useRef(false)

  /** URL 与纯文本均走 /api/summarize，由后端区分 url 抓取或直接 text */
  const runAiSummary = (
    createdId: string,
    fallbackTitle: string,
    payload: { url?: string; text?: string },
    errorMessage: string
  ) => {
    void (async () => {
      try {
        const response = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ noteId: createdId, ...payload }),
        })
        if (!response.ok) {
          throw new Error('AI 摘要失败')
        }

        const data = (await response.json()) as {
          noteId?: string
          summary?: {
            title?: string
            summary?: string
            keyPoints?: string[]
            readTime?: string
          }
        }

        const payloadSummary = data.summary
        if (!payloadSummary) throw new Error('AI 摘要返回为空')

        updateNote(createdId, {
          title:
            payloadSummary.title?.trim() || fallbackTitle,
          content: payloadSummary.summary?.trim() || '',
          summary: payloadSummary.summary?.trim() || '',
          keyPoints: payloadSummary.keyPoints || [],
          readTime: payloadSummary.readTime || '',
          estimatedTime: payloadSummary.readTime || '<3min',
          status: 'active',
        })
      } catch {
        updateNote(createdId, {
          status: 'active',
        })
        toast.error(errorMessage)
      }
    })()
  }
  const getTagFrequency = useNoteStore((state) => state.getTagFrequency)
  const getAllTags = useNoteStore((state) => state.getAllTags)

  const allTags = getAllTags()

  /** 未手动选标签时默认「未归类」 */
  const effectiveTags = useMemo(
    () => (selectedTags.length > 0 ? selectedTags : ['未归类']),
    [selectedTags]
  )

  // 获取推荐标签（词频前4）
  const tagFrequency = getTagFrequency()
  const recommendedTags = Array.from(tagFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag)
    .filter((tag) => !effectiveTags.includes(tag))

  // 判断输入类型
  const detectType = useCallback((text: string): NoteType => {
    if (URL_REGEX.test(text.trim())) {
      return 'url'
    }
    return 'spark'
  }, [])

  // 获取当前输入类型
  const currentType = detectType(input)
  const normalizedInputUrl = useMemo(() => normalizeUrl(input), [input])

  // 格式化提醒时间显示
  const formatReminderTime = (time: number) => {
    const date = new Date(time)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = date.toDateString() === tomorrow.toDateString()
    
    const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    
    if (isToday) {
      return `今天 ${timeStr}`
    } else if (isTomorrow) {
      return `明天 ${timeStr}`
    } else {
      return (
        date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) +
        ' ' +
        timeStr
      )
    }
  }

  // URL 标题抓取
  useEffect(() => {
    if (currentType !== 'url' || !input.trim()) {
      setUrlTitle('')
      setIsRecognizingWeb(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsRecognizingWeb(true)
      try {
        const response = await fetch(
          `/api/web-title?url=${encodeURIComponent(normalizedInputUrl)}`
        )
        if (!response.ok) return
        const data = (await response.json()) as { title?: string }
        setUrlTitle(data.title?.trim() || '')
      } catch {
        setUrlTitle('')
      } finally {
        setIsRecognizingWeb(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [currentType, input, normalizedInputUrl])

  useEffect(() => {
    return () => {
      if (ocrWorkerRef.current) {
        ocrWorkerRef.current.terminate()
        ocrWorkerRef.current = null
      }
    }
  }, [])

  /** 新手引导第一步：预填示例链接 */
  useEffect(() => {
    if (!onboarding?.isActive || onboarding.step !== 1) {
      onboardingPrefilledRef.current = false
      return
    }
    if (onboardingPrefilledRef.current) return
    setInput(ONBOARDING_DEMO_URL)
    onboardingPrefilledRef.current = true
  }, [onboarding?.isActive, onboarding?.step])

  // 提交笔记
  const handleSubmit = async () => {
    const hasText = Boolean(input.trim())
    const hasFiles = pendingFiles.length > 0
    if (!hasText && !hasFiles) return

    const now = new Date()

    if (hasText) {
      const type = detectType(input)
      const title =
        type === 'url'
          ? urlTitle || normalizedInputUrl
          : `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}日的灵感`

      if (type === 'url') {
        const demoOnboarding =
          onboarding?.isActive &&
          onboarding.step === 1 &&
          isOnboardingDemoUrl(normalizedInputUrl)

        const createdId = addNote({
          type: 'url',
          title: demoOnboarding ? '《单向度的人》' : title || '正在生成标题...',
          content: demoOnboarding ? ONBOARDING_DEMO_SUMMARY : '',
          summary: demoOnboarding ? ONBOARDING_DEMO_SUMMARY : '',
          keyPoints: [],
          readTime: demoOnboarding ? '<3min' : '',
          userNotes: '',
          sourceUrl: normalizedInputUrl,
          tags: effectiveTags,
          status: demoOnboarding ? 'active' : 'loading',
          isSpark: false,
          isDeleted: false,
          estimatedTime: '<3min',
          remindAt: reminderTime,
        })

        if (demoOnboarding) {
          updateNote(createdId, {
            title: '《单向度的人》',
            content: ONBOARDING_DEMO_SUMMARY,
            summary: ONBOARDING_DEMO_SUMMARY,
            readTime: '<3min',
            status: 'active',
            estimatedTime: '<3min',
          })
        } else {
          runAiSummary(
            createdId,
            title || normalizedInputUrl,
            { url: normalizedInputUrl },
            'AI 摘要失败，已保留原始链接'
          )
        }

        if (onboarding?.isActive && onboarding.step === 1) {
          onboarding.beginStep2(createdId)
        }
      } else {
        const rawText = input.trim()
        const createdId = addNote({
          type,
          title: title || '正在生成标题...',
          content: '',
          summary: '',
          keyPoints: [],
          readTime: '',
          userNotes: rawText,
          sourceUrl: '',
          tags: effectiveTags,
          status: 'loading',
          isSpark: true,
          isDeleted: false,
          estimatedTime: '<3min',
          remindAt: reminderTime,
        })

        runAiSummary(
          createdId,
          title,
          { text: rawText },
          'AI 摘要失败，已保留原始内容'
        )
      }
    }

    if (hasFiles) {
      pendingFiles.forEach((file) => {
        addNote({
          type: 'file',
          title: file.name,
          content: file.extractedText,
          userNotes: file.extractedText,
          sourceUrl: file.dataUrl,
          tags: effectiveTags,
          status: 'inbox',
          isSpark: false,
          isDeleted: false,
          estimatedTime: '<7min',
          remindAt: reminderTime,
        })
      })
    }

    // 重置状态
    setInput('')
    setPendingFiles([])
    setSelectedTags([])
    setEnableAiSummary(false)
    setReminderTime(null)
    setUrlTitle('')
    setIsRecognizingWeb(false)
  }

  // 处理拖拽进入
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 确保是真正离开了容器
    const rect = dropZoneRef.current?.getBoundingClientRect()
    if (rect) {
      const { clientX, clientY } = e
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        setIsDragOver(false)
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      void handleFiles(files)
    }
  }

  const ensureOcrWorker = async () => {
    if (ocrWorkerRef.current) {
      return ocrWorkerRef.current
    }
    const worker = await createWorker('eng+chi_sim')
    ocrWorkerRef.current = worker
    return worker
  }

  const extractTextFromFile = async (file: File, dataUrl: string) => {
    const ext = getFileExtension(file.name)

    if (ext === 'md' || ext === 'markdown') {
      return file.text()
    }

    if (ext === 'docx') {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({
        arrayBuffer,
      })
      return result.value.trim()
    }

    if (ext === 'doc') {
      return ''
    }

    if (file.type.startsWith(IMAGE_MIME_PREFIX) || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tif', 'tiff'].includes(ext)) {
      const worker = await ensureOcrWorker()
      const { data } = await worker.recognize(dataUrl)
      return data.text.trim()
    }

    return ''
  }

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })

  // 处理文件选择/拖入：先暂存，点击发送后再创建笔记
  const handleFiles = async (files: FileList) => {
    const fileList = Array.from(files)
    const validFiles = fileList.filter(isAllowedFile)

    // 不支持的类型静默忽略
    if (validFiles.length === 0) return

    setIsExtracting(true)
    try {
      const processed = await Promise.all(
        validFiles.map(async (file) => {
          const dataUrl = await fileToDataUrl(file)
          const extractedText = await extractTextFromFile(file, dataUrl)
          return {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            dataUrl,
            extractedText,
            mimeType: file.type,
          } satisfies PendingFile
        })
      )

      setPendingFiles((prev) => [...prev, ...processed])
    } catch {
      // 解析失败静默
    } finally {
      setIsExtracting(false)
    }
  }

  // 添加标签
  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
    setTagInput('')
    setShowTagPopover(false)
  }

  // 移除标签
  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag))
  }

  // 处理标签输入
  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      addTag(tagInput.trim())
    } else if (e.key === 'Escape') {
      setTagInput('')
      setShowTagPopover(false)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text').trim()
    if (URL_REGEX.test(pastedText)) {
      setIsRecognizingWeb(true)
    }
  }

  // 处理主输入框回车
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    }
  }

  // 选择提醒时间
  const handleSelectReminder = (option: ReminderOption) => {
    setReminderTime(option.getTime())
    setShowReminderPopover(false)
    setShowCustomCalendar(false)
  }

  // 选择自定义日期
  const handleSelectCustomDate = (date: Date | undefined) => {
    if (date) {
      // 设置为当天上午9点
      date.setHours(9, 0, 0, 0)
      setReminderTime(date.getTime())
      setCustomDate(date)
      setShowReminderPopover(false)
      setShowCustomCalendar(false)
    }
  }

  // 清除提醒时间
  const clearReminder = () => {
    setReminderTime(null)
    setShowReminderPopover(false)
    setShowCustomCalendar(false)
  }

  const hasTypedInput = input.trim().length > 0
  const inputEngaged = textareaFocused || hasTypedInput

  return (
    <div
      ref={dropZoneRef}
      data-tour="note-input"
      className={cn(
        'relative rounded-[1.25rem] border bg-card/90 p-4 shadow-[var(--shadow-float)] backdrop-blur-sm',
        'transition-[transform,box-shadow,border-color,ring] duration-300 ease-out motion-reduce:transition-none',
        onboarding?.isActive &&
          onboarding.step === 1 &&
          'z-[475] ring-2 ring-primary/65 ring-offset-2 ring-offset-background motion-safe:animate-pulse',
        /* 默认 */
        !isDragOver &&
          !inputEngaged &&
          'border-border/60 motion-safe:hover:-translate-y-0.5 hover:border-primary/35 motion-safe:hover:shadow-lg',
        /* 鼠标悬停（未聚焦时加强一点） */
        inputAreaHovered && !isDragOver && !textareaFocused && 'border-primary/25 shadow-md',
        /* 聚焦或正在输入 */
        inputEngaged && !isDragOver && 'border-primary/50 shadow-md ring-2 ring-primary/15',
        isDragOver && 'border-primary ring-2 ring-primary/25'
      )}
      onMouseEnter={() => setInputAreaHovered(true)}
      onMouseLeave={() => setInputAreaHovered(false)}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 拖拽提示 */}
      {isDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.25rem] bg-primary/8 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-primary">
            <FileText className="h-8 w-8" />
            <span className="text-sm font-medium">
              松开添加（图片 / Word / Markdown）
            </span>
          </div>
        </div>
      )}

      {/* 上传成功文件列表（发送后才会创建为笔记） */}
      {isExtracting && (
        <div className="mb-2 text-xs text-muted-foreground">正在提取文件文字...</div>
      )}
      {isRecognizingWeb && (
        <div className="mb-2 text-xs text-muted-foreground">正在识别网页...</div>
      )}
      {pendingFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {pendingFiles.map((file) => (
            <Badge key={file.id} variant="secondary" className="gap-1 px-2 py-1 text-xs">
              {file.mimeType.startsWith('image/') ? (
                <ImageIcon className="h-3 w-3 text-blue-500" />
              ) : (
                <FileText className="h-3 w-3 text-orange-500" />
              )}
              {file.name}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() =>
                  setPendingFiles((prev) => prev.filter((item) => item.id !== file.id))
                }
              />
            </Badge>
          ))}
        </div>
      )}

      {/* 主输入区：高度约为原 120px 的 2/3 */}
      <div
        className={cn(
          'flex items-start gap-3 transition-transform duration-300 ease-out motion-reduce:transition-none',
          inputAreaHovered && !isDragOver && 'motion-safe:-translate-y-px',
          textareaFocused && 'motion-safe:scale-[1.01]'
        )}
      >
        {/* 输入类型图标 */}
        <div
          className={cn(
            'mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10 transition-all duration-300 motion-reduce:transition-none',
            (inputAreaHovered || textareaFocused) && 'motion-safe:scale-105 ring-primary/25'
          )}
        >
          {currentType === 'url' ? (
            <Link className="h-4 w-4 text-primary" />
          ) : (
            <Lightbulb className="h-4 w-4 text-amber-500" />
          )}
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setTextareaFocused(true)}
          onBlur={() => setTextareaFocused(false)}
          placeholder="粘贴网址，记录灵感，拖拽添加文件..."
          className={cn(
            'min-h-[80px] flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground placeholder:transition-colors',
            'transition-[color,opacity] duration-200',
            textareaFocused && 'placeholder:text-muted-foreground/60'
          )}
        />

        <Button
          size="icon"
          onClick={() => void handleSubmit()}
          disabled={isExtracting || (!input.trim() && pendingFiles.length === 0)}
          className={cn(
            'h-9 w-9 shrink-0 rounded-xl shadow-sm transition-transform duration-300 motion-reduce:transition-none',
            inputAreaHovered && !isDragOver && 'motion-safe:scale-105'
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* 底部工具栏 */}
      <div className="mt-4 flex items-center justify-between gap-4 pt-0.5">
        {/* 左侧：标签区域 */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* 推荐标签 */}
          {recommendedTags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer px-2 py-0.5 text-xs transition-colors hover:bg-accent"
              onClick={() => addTag(tag)}
            >
              # {tag}
            </Badge>
          ))}

          {/* 已选标签 */}
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 px-2 py-0.5 text-xs"
            >
              # {tag}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}

          {/* 添加标签按钮：支持输入新标签或选择已有标签 */}
          <Popover open={showTagPopover} onOpenChange={setShowTagPopover}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="space-y-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="输入新标签后回车"
                  className="h-8 text-xs"
                  autoFocus
                />
                <div className="max-h-44 overflow-y-auto rounded-md border p-1">
                  {allTags
                    .filter((tag) =>
                      tag.toLowerCase().includes(tagInput.trim().toLowerCase())
                    )
                    .filter((tag) => !effectiveTags.includes(tag))
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
        </div>

        {/* 右侧：功能按钮 */}
        <div className="flex items-center gap-1">
          {/* 上传本地文件 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => fileInputRef.current?.click()}
            title="上传本地文件"
          >
            <Upload className="h-3.5 w-3.5" />
          </Button>

          {/* 显示已设置的提醒时间 */}
          {reminderTime && (
            <Badge
              variant="secondary"
              className="mr-1 gap-1 px-2 py-0.5 text-xs"
            >
              <Bell className="h-3 w-3 text-blue-500" />
              {formatReminderTime(reminderTime)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={clearReminder}
              />
            </Badge>
          )}

          {/* AI 摘要按钮 */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredButton('ai')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Button
              variant={enableAiSummary ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'h-7 gap-1.5 overflow-hidden transition-all duration-200',
                hoveredButton === 'ai' ? 'w-auto px-3' : 'w-7 p-0'
              )}
              onClick={() => setEnableAiSummary(!enableAiSummary)}
            >
              <Sparkles
                className={cn(
                  'h-3.5 w-3.5 flex-shrink-0',
                  enableAiSummary && 'text-yellow-500'
                )}
              />
              {hoveredButton === 'ai' && (
                <span className="whitespace-nowrap text-xs">生成AI摘要</span>
              )}
            </Button>
          </div>

          {/* 提醒按钮 */}
          <Popover open={showReminderPopover} onOpenChange={setShowReminderPopover}>
            <PopoverTrigger asChild>
              <div
                className="relative"
                onMouseEnter={() => setHoveredButton('reminder')}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <Button
                  variant={reminderTime ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-7 gap-1.5 overflow-hidden transition-all duration-200',
                    hoveredButton === 'reminder' ? 'w-auto px-3' : 'w-7 p-0'
                  )}
                >
                  <Bell
                    className={cn(
                      'h-3.5 w-3.5 flex-shrink-0',
                      reminderTime && 'text-blue-500'
                    )}
                  />
                  {hoveredButton === 'reminder' && (
                    <span className="whitespace-nowrap text-xs">提醒我看</span>
                  )}
                </Button>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              {!showCustomCalendar ? (
                <div className="flex flex-col gap-1">
                  <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">选择提醒时间</p>
                  {reminderOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <Button
                        key={option.label}
                        variant="ghost"
                        size="sm"
                        className="justify-start gap-2 text-sm"
                        onClick={() => handleSelectReminder(option)}
                      >
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </Button>
                    )
                  })}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2 text-sm"
                    onClick={() => setShowCustomCalendar(true)}
                  >
                    <Calendar className="h-4 w-4" />
                    自定义
                  </Button>
                  {reminderTime && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start gap-2 text-sm text-destructive hover:text-destructive"
                      onClick={clearReminder}
                    >
                      <X className="h-4 w-4" />
                      清除提醒
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="px-2 text-xs font-medium text-muted-foreground">选择日期</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setShowCustomCalendar(false)}
                    >
                      返回
                    </Button>
                  </div>
                  <CalendarComponent
                    mode="single"
                    selected={customDate}
                    onSelect={handleSelectCustomDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.doc,.docx,image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files
          if (files && files.length > 0) void handleFiles(files)
          e.currentTarget.value = ''
        }}
      />
    </div>
  )
}
