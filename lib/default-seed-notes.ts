import type { Note } from './types'
import { SEED_NEWBIE_GUIDE_USER_NOTES } from './seed-newbie-guide-body'
import { SEED_IMPECCABLE_AI_SUMMARY, SEED_WECHAT_AI_SUMMARY } from './seed-summaries'
import { SEED_WECHAT_USER_NOTES } from './seed-wechat-generated'

/**
 * 首次安装时的默认笔记（不含新手引导流程中用户新建的条目）。
 * 微信长文正文由 public/seeds/wechat-body-part*.raw 生成至 seed-wechat-generated.ts。
 */
export function createDefaultSeedNotes(): Note[] {
  const now = Date.now()

  const newbie: Note = {
    id: 'seed-newbie-guide',
    type: 'spark',
    title: '新手指南',
    content: '',
    userNotes: SEED_NEWBIE_GUIDE_USER_NOTES,
    sourceUrl: '',
    tags: ['新手指南', 'to do'],
    status: 'inbox',
    isSpark: true,
    isDeleted: false,
    estimatedTime: '<3min',
    remindAt: null,
    createdAt: now,
    lastViewedAt: null,
    tagLoading: false,
  }

  const authorPdf: Note = {
    id: 'seed-author-profile',
    type: 'file',
    title: '作者简介',
    content: '',
    userNotes: '',
    sourceUrl: '/author-profile-xierunqian.pdf',
    tags: ['新手指南', '产品/求职'],
    status: 'inbox',
    isSpark: false,
    isDeleted: false,
    estimatedTime: '<10min',
    remindAt: null,
    createdAt: now - 60_000,
    lastViewedAt: null,
    tagLoading: false,
  }

  const impeccable: Note = {
    id: 'seed-impeccable-skill',
    type: 'url',
    title:
      'impeccable: The design language that makes your AI harness better at design.',
    content: SEED_IMPECCABLE_AI_SUMMARY,
    summary: SEED_IMPECCABLE_AI_SUMMARY,
    keyPoints: [],
    readTime: '<20min',
    userNotes: '抽空看下这个skill',
    sourceUrl: 'https://github.com/pbakaus/impeccable',
    tags: ['新手指南', '产品/AI', 'to do'],
    status: 'inbox',
    isSpark: false,
    isDeleted: false,
    estimatedTime: '<20min',
    remindAt: null,
    createdAt: now - 120_000,
    lastViewedAt: null,
    tagLoading: false,
  }

  const wechat: Note = {
    id: 'seed-wechat-agentic',
    type: 'spark',
    title: '从微信创建的笔记 · Agentic 范式下策略产品工作的冲击与变革',
    content: SEED_WECHAT_AI_SUMMARY,
    summary: SEED_WECHAT_AI_SUMMARY,
    keyPoints: [],
    readTime: '<10min',
    userNotes: SEED_WECHAT_USER_NOTES,
    sourceUrl: '',
    tags: ['新手指南', '产品'],
    status: 'inbox',
    isSpark: true,
    isDeleted: false,
    estimatedTime: '<10min',
    remindAt: null,
    createdAt: now - 180_000,
    lastViewedAt: null,
    tagLoading: false,
  }

  // 新笔记在前；待启动排序仍由 getInboxNotes 按规则重排
  return [newbie, authorPdf, impeccable, wechat]
}
