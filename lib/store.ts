'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  Note, 
  NoteType, 
  NoteStatus, 
  ViewType, 
  SortOption,
  estimatedTimeToMinutes 
} from './types'
import { createDefaultSeedNotes } from './default-seed-notes'

interface NoteStore {
  // 状态
  notes: Note[]
  currentView: ViewType
  selectedTag: string | null
  sidebarOpen: boolean
  viewerOpen: boolean
  currentNoteId: string | null
  searchQuery: string
  sortOption: SortOption
  
  // Actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'lastViewedAt' | 'tagLoading'>) => string
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  restoreNote: (id: string) => void
  permanentDelete: (id: string) => void
  markAsSpark: (id: string, value: boolean) => void
  markAsDone: (id: string) => void
  updateStatus: (id: string, status: NoteStatus) => void
  
  // 视图控制
  setCurrentView: (view: ViewType) => void
  setSelectedTag: (tag: string | null) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openViewer: (noteId: string) => void
  closeViewer: () => void
  setSearchQuery: (query: string) => void
  setSortOption: (option: SortOption) => void
  
  // 核心算法
  getInboxNotes: () => Note[]
  getProcessingNotes: () => Note[]
  getSparkNotes: () => Note[]
  getTrashNotes: () => Note[]
  filterByTag: (tag: string) => Note[]
  getAllTags: () => string[]
  getTagTree: () => Map<string, string[]>
  getTagFrequency: () => Map<string, number>
  getFilteredNotes: () => Note[]
}

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      notes: createDefaultSeedNotes(),
      currentView: 'home',
      selectedTag: null,
      sidebarOpen: true,
      viewerOpen: false,
      currentNoteId: null,
      searchQuery: '',
      sortOption: 'createdAt-desc',
      
      // Actions
      addNote: (noteData) => {
        const id = Date.now().toString()
        const newNote: Note = {
          ...noteData,
          id,
          createdAt: Date.now(),
          lastViewedAt: null,
          tagLoading: false,
        }
        set((state) => ({ notes: [newNote, ...state.notes] }))
        return id
      },
      
      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...updates } : note
          ),
        }))
      },
      
      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, isDeleted: true } : note
          ),
        }))
      },
      
      restoreNote: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, isDeleted: false } : note
          ),
        }))
      },
      
      permanentDelete: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }))
      },
      
      /**
       * 标记/取消「灵感」。
       * 灵感时刻列表要求 isSpark && status==='done'，因此开启灵感时同步设为已归档（done）；
       * 关闭灵感时若当前为 done，则回到「处理中」以便继续消化。
       */
      markAsSpark: (id, value) => {
        set((state) => ({
          notes: state.notes.map((note) => {
            if (note.id !== id) return note
            if (value) {
              return { ...note, isSpark: true, status: 'done' as NoteStatus }
            }
            return {
              ...note,
              isSpark: false,
              status: note.status === 'done' ? ('processing' as NoteStatus) : note.status,
            }
          }),
        }))
      },
      
      markAsDone: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, status: 'done' as NoteStatus } : note
          ),
        }))
      },
      
      updateStatus: (id, status) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, status } : note
          ),
        }))
      },
      
      // 视图控制
      setCurrentView: (view) => set({ currentView: view }),
      setSelectedTag: (tag) => set({ selectedTag: tag }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      openViewer: (noteId) => set({ viewerOpen: true, currentNoteId: noteId }),
      closeViewer: () => set({ viewerOpen: false, currentNoteId: null }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSortOption: (option) => set({ sortOption: option }),
      
      // 核心算法：待启动模块 1-3-1 排序
      getInboxNotes: () => {
        const { notes } = get()
        const inboxNotes = notes.filter(
          (note) =>
            ['inbox', 'loading', 'active'].includes(note.status) && !note.isDeleted
        )
        
        if (inboxNotes.length === 0) return []
        
        const now = Date.now()
        const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000
        
        // A: estimatedTime 最小的一条
        const sortedByTime = [...inboxNotes].sort(
          (a, b) => estimatedTimeToMinutes(a.estimatedTime) - estimatedTimeToMinutes(b.estimatedTime)
        )
        const noteA = sortedByTime[0]
        
        // B/C/D: createdAt 最晚的三条
        const sortedByCreated = [...inboxNotes].sort(
          (a, b) => b.createdAt - a.createdAt
        )
        const notesBCD = sortedByCreated.slice(0, 3)
        
        // E: createdAt < (now - 3 days) 中最早的一条
        const oldNotes = inboxNotes.filter((note) => note.createdAt < threeDaysAgo)
        const noteE = oldNotes.length > 0
          ? oldNotes.sort((a, b) => a.createdAt - b.createdAt)[0]
          : null
        
        // 组合并去重
        const result: Note[] = []
        const addedIds = new Set<string>()
        
        const addNote = (note: Note | null) => {
          if (note && !addedIds.has(note.id)) {
            result.push(note)
            addedIds.add(note.id)
          }
        }
        
        addNote(noteA)
        notesBCD.forEach(addNote)
        addNote(noteE)
        
        return result.slice(0, 5)
      },
      
      // 处理中笔记
      getProcessingNotes: () => {
        const { notes } = get()
        return notes
          .filter((note) => note.status === 'processing' && !note.isDeleted)
          .sort((a, b) => (b.lastViewedAt || 0) - (a.lastViewedAt || 0))
      },
      
      // 灵感时刻笔记
      getSparkNotes: () => {
        const { notes } = get()
        return notes
          .filter((note) => note.status === 'done' && note.isSpark && !note.isDeleted)
          .sort((a, b) => b.createdAt - a.createdAt)
      },
      
      // 回收站笔记
      getTrashNotes: () => {
        const { notes } = get()
        return notes.filter((note) => note.isDeleted)
      },
      
      // 层级包含逻辑过滤
      filterByTag: (tag) => {
        const { notes } = get()
        return notes.filter((note) => {
          if (note.isDeleted) return false
          return note.tags.some((noteTag) => {
            // 如果选中的是一级标签（如"产品"），匹配所有以该标签开头的标签
            // 如果选中的是二级标签（如"产品/AI"），只匹配完全相等的标签
            if (tag.includes('/')) {
              return noteTag === tag
            }
            return noteTag === tag || noteTag.startsWith(tag + '/')
          })
        })
      },
      
      // 获取所有唯一标签
      getAllTags: () => {
        const { notes } = get()
        const tagSet = new Set<string>()
        notes.forEach((note) => {
          if (!note.isDeleted) {
            note.tags.forEach((tag) => tagSet.add(tag))
          }
        })
        return Array.from(tagSet)
      },
      
      // 构建标签树
      getTagTree: () => {
        const tags = get().getAllTags()
        const tree = new Map<string, string[]>()
        
        tags.forEach((tag) => {
          if (tag.includes('/')) {
            const [parent, child] = tag.split('/')
            if (!tree.has(parent)) {
              tree.set(parent, [])
            }
            tree.get(parent)!.push(child)
          } else {
            if (!tree.has(tag)) {
              tree.set(tag, [])
            }
          }
        })
        
        return tree
      },
      
      // 获取标签频率（用于推荐）
      getTagFrequency: () => {
        const { notes } = get()
        const frequency = new Map<string, number>()
        
        notes.forEach((note) => {
          if (!note.isDeleted) {
            note.tags.forEach((tag) => {
              const baseTag = tag.includes('/') ? tag.split('/')[0] : tag
              frequency.set(baseTag, (frequency.get(baseTag) || 0) + 1)
            })
          }
        })
        
        return frequency
      },
      
      // 获取当前视图的筛选笔记
      getFilteredNotes: () => {
        const { 
          currentView, 
          selectedTag, 
          notes, 
          searchQuery, 
          sortOption,
          filterByTag 
        } = get()
        
        let filtered: Note[] = []
        
        switch (currentView) {
          case 'home':
            return []
          case 'wechatUpload':
            return []
          case 'inbox':
            filtered = notes.filter(
              (n) => ['inbox', 'loading', 'active'].includes(n.status) && !n.isDeleted
            )
            break
          case 'processing':
            filtered = notes.filter((n) => n.status === 'processing' && !n.isDeleted)
            break
          case 'spark':
            filtered = notes.filter((n) => n.isSpark && n.status === 'done' && !n.isDeleted)
            break
          case 'tag':
            filtered = selectedTag ? filterByTag(selectedTag) : []
            break
          case 'trash':
            filtered = notes.filter((n) => n.isDeleted)
            break
        }
        
        // 搜索过滤
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(
            (note) =>
              note.title.toLowerCase().includes(query) ||
              note.content.toLowerCase().includes(query) ||
              note.userNotes.toLowerCase().includes(query)
          )
        }
        
        // 排序
        switch (sortOption) {
          case 'createdAt-desc':
            filtered.sort((a, b) => b.createdAt - a.createdAt)
            break
          case 'createdAt-asc':
            filtered.sort((a, b) => a.createdAt - b.createdAt)
            break
          case 'estimatedTime-desc':
            filtered.sort(
              (a, b) => estimatedTimeToMinutes(b.estimatedTime) - estimatedTimeToMinutes(a.estimatedTime)
            )
            break
          case 'estimatedTime-asc':
            filtered.sort(
              (a, b) => estimatedTimeToMinutes(a.estimatedTime) - estimatedTimeToMinutes(b.estimatedTime)
            )
            break
        }
        
        return filtered
      },
    }),
    {
      name: 'note-storage',
    }
  )
)
