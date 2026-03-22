/**
 * 首页「待启动 / 处理中 / 灵感」与 NoteListPage 中「全部状态」三类列表
 * 共用的滚动容器与栅格样式，保证逻辑与视觉一致。
 */
/** 列表页（含小屏）：ScrollArea 占满主区域剩余高度 */
export const homeStatusListScrollAreaClass =
  'h-0 min-h-0 flex-1 overflow-hidden pr-1' as const

/**
 * 首页三模块：大屏与列表页一致；小屏高度随内容，由首页外层容器滚动。
 */
export const homeDashboardListScrollAreaClass =
  'min-h-0 pr-1 max-lg:h-auto max-lg:flex-none max-lg:overflow-visible lg:h-0 lg:flex-1 lg:overflow-hidden' as const

/** 条目间距约为原 gap-5 / md:gap-6 的一半 */
export const homeStatusListGridClass =
  'grid grid-cols-1 gap-2.5 pb-4 md:grid-cols-2 md:gap-3' as const

/** 首页待启动 / 处理中：始终单列（与侧栏列表页双列区分） */
export const homeDashboardSingleColumnGridClass =
  'grid grid-cols-1 gap-2.5 pb-4 md:gap-3' as const
