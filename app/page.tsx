'use client'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { WelcomeScreen } from '@/components/welcome-screen'
import { OnboardingTourProvider, useOnboardingTour } from '@/components/onboarding-tour-provider'
import { useWelcomeGate } from '@/hooks/use-welcome-gate'
import { AppSidebar } from '@/components/app-sidebar'
import { InboxModule } from '@/components/inbox-module'
import { ProcessingModule } from '@/components/processing-module'
import { SparkModule } from '@/components/spark-module'
import { NoteInput } from '@/components/note-input'
import { NoteViewer } from '@/components/note-viewer'
import { NoteListPage } from '@/components/note-list-page'
import { WechatUploadPage } from '@/components/wechat-upload-page'
import { useNoteStore } from '@/lib/store'
import { Toaster } from 'sonner'

/**
 * 主应用壳：必须在 OnboardingTourProvider 内，才能使用 useOnboardingTour。
 */
function HomeMain() {
  const onboarding = useOnboardingTour()
  const {
    currentView,
    viewerOpen,
    currentNoteId,
    openViewer,
    closeViewer,
    setCurrentView,
  } = useNoteStore()

  const handleNoteClick = (noteId: string) => {
    onboarding?.tryAdvanceOnNoteOpen(noteId)
    openViewer(noteId)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="relative flex h-screen flex-col">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-card/40 px-6 backdrop-blur-sm">
            <SidebarTrigger className="h-9 w-9 rounded-xl" />
            <span className="text-sm font-medium tracking-tight text-muted-foreground">
              {currentView === 'home' && '首页'}
              {currentView === 'wechatUpload' && '微信上传'}
            </span>
          </header>

          <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 lg:px-8 lg:py-5">
            {currentView === 'wechatUpload' ? (
              <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
                <WechatUploadPage />
              </div>
            ) : currentView === 'home' ? (
              <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
                <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] lg:grid lg:grid-cols-2 lg:gap-8 lg:overflow-hidden">
                  <div className="flex min-h-0 flex-col lg:h-full lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:pr-1 lg:[scrollbar-gutter:stable]">
                    <InboxModule
                      onNoteClick={handleNoteClick}
                      onHeaderClick={() => setCurrentView('inbox')}
                    />
                  </div>
                  <div className="flex min-h-0 flex-col gap-5 lg:h-full lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:pr-1 lg:[scrollbar-gutter:stable]">
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
              <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col">
                <NoteListPage onNoteClick={handleNoteClick} />
              </div>
            )}
          </main>

          {currentView !== 'wechatUpload' && (
            <div className="border-t border-border/60 bg-background/80 px-6 py-6 backdrop-blur-md lg:px-10">
              <div className="mx-auto max-w-2xl">
                <NoteInput />
              </div>
            </div>
          )}

          <Toaster
            position="top-center"
            duration={1500}
            closeButton={false}
            richColors={false}
            toastOptions={{
              classNames: {
                toast:
                  '!justify-center !text-center !bg-background/75 !backdrop-blur-md !border-border/40 !shadow-lg',
                title: '!text-center !w-full',
                description: '!text-center !w-full',
              },
            }}
          />
        </div>
      </SidebarInset>

      {viewerOpen && currentNoteId && (
        <NoteViewer noteId={currentNoteId} onClose={closeViewer} />
      )}
    </SidebarProvider>
  )
}

export default function HomePage() {
  const { state: welcomeState, dismiss: dismissWelcome } = useWelcomeGate()

  if (welcomeState === 'loading') {
    return <div className="min-h-svh bg-background" aria-hidden />
  }

  if (welcomeState === 'show') {
    return <WelcomeScreen onDismiss={dismissWelcome} />
  }

  return (
    <OnboardingTourProvider>
      <HomeMain />
    </OnboardingTourProvider>
  )
}
