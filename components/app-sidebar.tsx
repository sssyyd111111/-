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
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useNoteStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const {
    currentView,
    selectedTag,
    setCurrentView,
    setSelectedTag,
    getTagTree,
    notes,
  } = useNoteStore()

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

  const handleNavClick = (
    view: 'home' | 'inbox' | 'processing' | 'spark' | 'trash',
    tag?: string
  ) => {
    setCurrentView(view)
    setSelectedTag(tag || null)
  }

  const handleTagClick = (tag: string) => {
    setCurrentView('tag')
    setSelectedTag(tag)
  }

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">我的知识库</span>
            <span className="text-xs text-muted-foreground">
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
                className="transition-all duration-200 hover:bg-accent"
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
              <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-md transition-colors">
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
                      <span>待启动</span>
                      <span className="ml-auto text-xs text-muted-foreground">
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
                      <span>处理中</span>
                      <span className="ml-auto text-xs text-muted-foreground">
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
                      <span>灵感时刻</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {sparkCount}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* 全部标签 */}
        <SidebarGroup>
          <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-accent/50 rounded-md transition-colors">
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
                    <SidebarMenuItem key={parentTag}>
                      {children.length > 0 ? (
                        <TagWithChildren
                          parentTag={parentTag}
                          children={children}
                          currentView={currentView}
                          selectedTag={selectedTag}
                          onTagClick={handleTagClick}
                        />
                      ) : (
                        <SidebarMenuButton
                          isActive={
                            currentView === 'tag' && selectedTag === parentTag
                          }
                          onClick={() => handleTagClick(parentTag)}
                          className="transition-all duration-200"
                        >
                          <Tag className="h-4 w-4" />
                          <span># {parentTag}</span>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
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
                <span>回收站</span>
                {trashCount > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {trashCount}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-muted-foreground hover:text-foreground transition-colors">
              <FileText className="h-4 w-4" />
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
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={open ? '收起标签' : '展开标签'}
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
          className="transition-all duration-200"
        >
          <Tag className="h-4 w-4" />
          <span># {parentTag}</span>
        </SidebarMenuButton>
      </div>
      <CollapsibleContent>
        <SidebarMenuSub>
          {children.map((child) => (
            <SidebarMenuSubItem key={child}>
              <SidebarMenuSubButton
                isActive={
                  currentView === 'tag' &&
                  selectedTag === `${parentTag}/${child}`
                }
                onClick={() => onTagClick(`${parentTag}/${child}`)}
                className={cn(
                  'cursor-pointer transition-all duration-200',
                  currentView === 'tag' &&
                    selectedTag === `${parentTag}/${child}` &&
                    'bg-accent'
                )}
              >
                <span># {child}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}
