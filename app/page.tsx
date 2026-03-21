'use client'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { InboxModule } from '@/components/inbox-module'
import { ProcessingModule } from '@/components/processing-module'
import { SparkModule } from '@/components/spark-module'
import { NoteInput } from '@/components/note-input'
import { NoteViewer } from '@/components/note-viewer'
import { NoteListPage } from '@/components/note-list-page'
import { useNoteStore } from '@/lib/store'
import { Toaster } from 'sonner'

export default function HomePage() {
  const {
    currentView,
    viewerOpen,
    currentNoteId,
    openViewer,
    closeViewer,
    setCurrentView,
  } = useNoteStore()

  const handleNoteClick = (noteId: string) => {
    openViewer(noteId)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-screen flex-col">
          {/* 顶部栏：侧边栏触发器 */}
          <header className="flex h-12 items-center gap-2 border-b px-4">
            <SidebarTrigger className="h-8 w-8" />
            <span className="text-sm font-medium text-muted-foreground">
              {currentView === 'home' ? '首页' : ''}
            </span>
          </header>

          {/* 主内容区 */}
          <main className="flex-1 overflow-hidden p-6">
            {currentView === 'home' ? (
              // 首页视图
              <div className="mx-auto h-full max-w-4xl">
                <div className="grid h-full grid-cols-2 gap-6">
                  {/* 左列：待启动 */}
                  <div className="flex flex-col overflow-hidden">
                    <InboxModule 
                      onNoteClick={handleNoteClick} 
                      onHeaderClick={() => setCurrentView('inbox')}
                    />
                  </div>

                  {/* 右列：处理中 + 灵感时刻 */}
                  <div className="flex flex-col gap-6 overflow-auto">
                    <ProcessingModule 
                      onNoteClick={handleNoteClick}
                      onHeaderClick={() => setCurrentView('processing')}
                    />
                    <SparkModule 
                      onNoteClick={handleNoteClick}
                      onHeaderClick={() => setCurrentView('spark')}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // 列表视图
              <div className="mx-auto h-full max-w-4xl">
                <NoteListPage onNoteClick={handleNoteClick} />
              </div>
            )}
          </main>

          {/* 底部输入框 */}
          <div className="border-t bg-background p-4">
            <div className="mx-auto max-w-2xl">
              <NoteInput />
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* 笔记详情弹窗 */}
      {viewerOpen && currentNoteId && (
        <NoteViewer noteId={currentNoteId} onClose={closeViewer} />
      )}

      {/* Toast 通知 */}
      <Toaster position="bottom-center" />
    </SidebarProvider>
  )
}
