// 笔记类型
export type NoteType = 'url' | 'file' | 'spark'

// 笔记状态
export type NoteStatus = 'inbox' | 'loading' | 'active' | 'processing' | 'done'

// 视图类型
export type ViewType = 
  | 'home' 
  | 'inbox' 
  | 'processing' 
  | 'spark' 
  | 'tag' 
  | 'trash'

// 笔记接口定义
export interface Note {
  id: string
  type: NoteType
  title: string
  content: string                    // AI 摘要
  summary?: string                   // 一句话精华
  keyPoints?: string[]               // 关键要点
  readTime?: string                  // AI 估算阅读时间
  userNotes: string                  // 用户笔记 (Markdown)
  sourceUrl: string                  // 原始链接或本地文件 data URL
  tags: string[]                     // 标签路径数组，如 ['产品/AI']
  status: NoteStatus
  isSpark: boolean                   // type 为 spark 时默认为 true
  isDeleted: boolean                 // 回收站标记
  estimatedTime: string              // 预估阅读时间
  remindAt: number | null            // 提醒时间戳
  createdAt: number                  // 创建时间戳
  lastViewedAt: number | null        // 最后查看时间戳
  tagLoading: boolean                // AI 标签生成加载状态
}

// 排序选项
export type SortOption = 
  | 'createdAt-desc' 
  | 'createdAt-asc' 
  | 'estimatedTime-desc' 
  | 'estimatedTime-asc'

// 预估阅读时间计算
export function getEstimatedTime(
  wordCount: number, 
  isVideo?: boolean, 
  videoDuration?: number
): string {
  if (isVideo && videoDuration) {
    return `Video ${Math.ceil(videoDuration)}min`
  }
  if (wordCount < 1000) return '<3min'
  if (wordCount < 3000) return '<7min'
  if (wordCount < 5000) return '<10min'
  if (wordCount < 10000) return '<20min'
  return '>20min'
}

// 估计时间转数值（用于排序）
export function estimatedTimeToMinutes(time: string): number {
  if (time.startsWith('Video')) {
    const match = time.match(/\d+/)
    return match ? parseInt(match[0]) : 0
  }
  switch (time) {
    case '<3min': return 3
    case '<7min': return 7
    case '<10min': return 10
    case '<20min': return 20
    case '>20min': return 30
    default: return 0
  }
}

// 格式化日期
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${month}-${day}日的灵感`
}
