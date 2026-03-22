/** 引导全部完成后不再展示。清除：`localStorage.removeItem('buluohui-onboarding-completed')` */
export const ONBOARDING_STORAGE_KEY = 'buluohui-onboarding-completed'

/** 第一步预填与演示用豆瓣链接 */
export const ONBOARDING_DEMO_URL = 'https://book.douban.com/subject/1787729/'

/** 第三步展示的固定摘要文案（与真实摘要风格一致） */
export const ONBOARDING_DEMO_SUMMARY =
  '《单向度的人》是法兰克福学派左翼代表赫伯特・马尔库塞的代表作，旨在揭示发达工业社会的极权主义特征，曾被称作西方 60 年代末大学造反运动的教科书。全书分三部分，通过多领域批判指出，发达工业社会压制了人的否定、批判与超越性，使人成为丧失自由与创造力、不再追求别样生活的「单向度的人」。'

export function normalizeUrlForTour(input: string) {
  return input.trim().replace(/\/+$/, '').toLowerCase()
}

export function isOnboardingDemoUrl(input: string) {
  return normalizeUrlForTour(input) === normalizeUrlForTour(ONBOARDING_DEMO_URL)
}
