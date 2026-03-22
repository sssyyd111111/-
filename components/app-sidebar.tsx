'use client'

import { useState } from 'react'
import {
  Home,
  Inbox,
  Clock,
  Lightbulb,
  Tag,
  Trash2,
  FileText,
  ChevronDown,
  ChevronRight,
  User,
  MessageCircle,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useOnboardingTour } from '@/components/onboarding-tour-provider'
import { useNoteStore } from '@/lib/store'
import type { ViewType } from '@/lib/types'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const onboarding = useOnboardingTour()
  const {
    currentView,
    selectedTag,
    setCurrentView,
    setSelectedTag,
    getTagTree,
    notes,
  } = useNoteStore()

  const wechatTourHighlight =
    onboarding?.isActive && onboarding.step === 4

  const [statusOpen, setStatusOpen] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(true)

  const tagTree = getTagTree()

  // 计算各类笔记数量
  const inboxCount = notes.filter(
    (n) => ['inbox', 'loading', 'active'].includes(n.status) && !n.isDeleted
  ).length
  const processingCount = notes.filter(
    (n) => n.status === 'processing' && !n.isDeleted
  ).length
  const sparkCount = notes.filter(
    (n) => n.isSpark && n.status === 'done' && !n.isDeleted
  ).length
  const trashCount = notes.filter((n) => n.isDeleted).length

  const handleNavClick = (view: ViewType, tag?: string) => {
    setCurrentView(view)
    setSelectedTag(tag || null)
  }

  const handleTagClick = (tag: string) => {
    setCurrentView('tag')
    setSelectedTag(tag)
  }

  return (
    <Sidebar className="border-r border-border/60">
      <SidebarHeader className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 shadow-[0_4px_20px_-6px_var(--mint-glow)] ring-1 ring-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-lg font-bold leading-tight tracking-tight text-sidebar-foreground">
              我的知识库
            </span>
            <span className="text-[11px] leading-snug text-muted-foreground">
              把落灰的信息变成灵感
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* 首页 */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentView === 'home'}
                onClick={() => handleNavClick('home')}
                size="lg"
                className="h-10 rounded-lg text-[15px] font-semibold transition-all duration-200 hover:bg-accent"
              >
                <Home className="h-4 w-4" />
                <span>首页</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* 全部状态 */}
        <SidebarGroup>
          <Collapsible open={statusOpen} onOpenChange={setStatusOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground">
                <div className="flex items-center gap-2">
                  {statusOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <span>全部状态</span>
                </div>
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'inbox'}
                      onClick={() => handleNavClick('inbox')}
                      className="transition-all duration-200"
                    >
                      <Inbox className="h-4 w-4" />
                      <span className="font-medium">待启动</span>
                      <span className="ml-auto tabular-nums text-xs font-semibold text-muted-foreground">
                        {inboxCount}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'processing'}
                      onClick={() => handleNavClick('processing')}
                      className="transition-all duration-200"
                    >
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">处理中</span>
                      <span className="ml-auto tabular-nums text-xs font-semibold text-muted-foreground">
                        {processingCount}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={currentView === 'spark'}
                      onClick={() => handleNavClick('spark')}
                      className="transition-all duration-200"
                    >
                      <Lightbulb className="h-4 w-4" />
                      <span className="font-medium">灵感时刻</span>
                      <span className="ml-auto tabular-nums text-xs font-semibold text-muted-foreground">
                        {sparkCount}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarSeparator className="mx-2 bg-sidebar-border/60" />

        {/* 全部标签 */}
        <SidebarGroup className="pt-0">
          <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground">
                <div className="flex items-center gap-2">
                  {tagsOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <span>全部标签</span>
                </div>
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {Array.from(tagTree.entries()).map(([parentTag, children]) => (
                    <SidebarMenuItem key={parentTag} className="min-w-0">
                      {children.length > 0 ? (
                        <TagWithChildren
                          parentTag={parentTag}
                          children={children}
                          currentView={currentView}
                          selectedTag={selectedTag}
                          onTagClick={handleTagClick}
                        />
                      ) : (
                        <div className="grid w-full grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-0">
                          <span
                            className="h-8 w-7 shrink-0"
                            aria-hidden
                          />
                          <SidebarMenuButton
                            isActive={
                              currentView === 'tag' && selectedTag === parentTag
                            }
                            onClick={() => handleTagClick(parentTag)}
                            className="min-w-0 justify-start transition-all duration-200"
                          >
                            <Tag className="h-4 w-4 shrink-0" />
                            <span className="truncate text-left text-[13px] font-medium">
                              # {parentTag}
                            </span>
                          </SidebarMenuButton>
                        </div>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* 微信上传 */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentView === 'wechatUpload'}
                onClick={() => handleNavClick('wechatUpload')}
                data-tour={wechatTourHighlight ? 'sidebar-wechat' : undefined}
                className={cn(
                  'transition-all duration-200',
                  wechatTourHighlight &&
                    'relative z-[475] ring-2 ring-primary/65 ring-offset-2 ring-offset-sidebar motion-safe:animate-pulse'
                )}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium">微信上传</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* 回收站 */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentView === 'trash'}
                onClick={() => handleNavClick('trash')}
                className="transition-all duration-200"
              >
                <Trash2 className="h-4 w-4" />
                <span className="font-medium">回收站</span>
                {trashCount > 0 && (
                  <span className="ml-auto tabular-nums text-xs font-semibold text-muted-foreground">
                    {trashCount}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>README</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

// 带子标签的标签组件
function TagWithChildren({
  parentTag,
  children,
  currentView,
  selectedTag,
  onTagClick,
}: {
  parentTag: string
  children: string[]
  currentView: string
  selectedTag: string | null
  onTagClick: (tag: string) => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full min-w-0">
      {/* 一级标签：与无子项标签同一列网格，文案左缘对齐 */}
      <div className="grid w-full grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-0">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={open ? '收起子标签' : '展开子标签'}
          >
            {open ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        </CollapsibleTrigger>
        <SidebarMenuButton
          isActive={currentView === 'tag' && selectedTag === parentTag}
          onClick={() => onTagClick(parentTag)}
          className="min-w-0 justify-start transition-all duration-200"
        >
          <Tag className="h-4 w-4 shrink-0" />
          <span className="truncate text-left text-[13px] font-medium"># {parentTag}</span>
        </SidebarMenuButton>
      </div>
      <CollapsibleContent className="w-full min-w-0 data-[state=closed]:animate-none">
        <SidebarMenuSub className="mx-0 ml-[1.75rem] min-w-0 border-l border-sidebar-border/70 pl-2.5 pr-0">
          {children.map((child) => (
            <SidebarMenuSubItem key={child}>
              <SidebarMenuSubButton
                size="sm"
                isActive={
                  currentView === 'tag' &&
                  selectedTag === `${parentTag}/${child}`
                }
                onClick={() => onTagClick(`${parentTag}/${child}`)}
                className={cn(
                  'h-auto min-h-7 cursor-pointer py-1 text-left text-[11px] leading-snug text-sidebar-foreground/90 transition-all duration-200',
                  currentView === 'tag' &&
                    selectedTag === `${parentTag}/${child}` &&
                    'bg-accent'
                )}
              >
                <span className="break-words"># {child}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}
