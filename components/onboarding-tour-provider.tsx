'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { ONBOARDING_STORAGE_KEY } from '@/lib/onboarding-tour'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export type OnboardingStep = 0 | 1 | 2 | 3 | 4

type OnboardingTourContextValue = {
  /** 当前是否在引导流程中（未完成且已启动） */
  isActive: boolean
  step: OnboardingStep
  /** 第一步发送后创建的笔记 id */
  tourNoteId: string | null
  /** 第一步提交成功，进入第二步 */
  beginStep2: (noteId: string) => void
  /** 第二步：用户点开对应笔记 */
  tryAdvanceOnNoteOpen: (noteId: string) => void
  /** 第三步：用户点击「灵感」或「已消化」后进入第四步 */
  goToStep4: () => void
  /** 第四步点击「好的」 */
  completeTour: () => void
  /** 随时跳过 */
  skipTour: () => void
  /** NoteViewer 内：是否抑制「池空」自动 toast+关闭 */
  suppressViewerPoolEmptyExit: boolean
}

const OnboardingTourContext = createContext<OnboardingTourContextValue | null>(null)

export function useOnboardingTour() {
  return useContext(OnboardingTourContext)
}

const STEP_COPY: Record<
  Exclude<OnboardingStep, 0>,
  { title: string; body: string; hint?: string }
> = {
  1: {
    title: '粘贴，剩下的交给我。',
    body: '不管是网址、随笔还是文件，都能自动推荐 tag、生成 AI 摘要、设置提醒时间。',
    hint: '试试点击发送，将示例链接保存为笔记',
  },
  2: {
    title: '从最轻松的开始。',
    body: '笔记已就绪。优先推荐耗时最短的内容，帮你快速进入状态，拒绝笔记吃灰。',
    hint: '点开这条笔记继续',
  },
  3: {
    title: '让思考留下痕迹。',
    body: '标注「灵感」让它在未来与你重逢；标记「已消化」将其归档至标签系统。',
    hint: '任点其一即可完成本步',
  },
  4: {
    title: '灵感，随时随地。',
    body: '绑定微信，碎片信息一键转发，网页端同步生成。',
    hint: '点击下方按钮结束引导',
  },
}

function readCompleted(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeCompleted() {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

type ProviderProps = { children: React.ReactNode }

export function OnboardingTourProvider({ children }: ProviderProps) {
  const [mounted, setMounted] = useState(false)
  /** 在客户端读完 localStorage 之前不启动引导，避免误判 */
  const [hydrated, setHydrated] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [step, setStep] = useState<OnboardingStep>(0)
  const [tourNoteId, setTourNoteId] = useState<string | null>(null)
  const tourNoteIdRef = useRef<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const done = readCompleted()
    setCompleted(done)
    if (!done) {
      setStep(1)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    tourNoteIdRef.current = tourNoteId
  }, [tourNoteId])

  const isActive =
    mounted && hydrated && !completed && step >= 1 && step <= 4

  const finish = useCallback(() => {
    writeCompleted()
    setCompleted(true)
    setStep(0)
    setTourNoteId(null)
  }, [])

  const beginStep2 = useCallback((noteId: string) => {
    setTourNoteId(noteId)
    setStep(2)
  }, [])

  const tryAdvanceOnNoteOpen = useCallback((noteId: string) => {
    const target = tourNoteIdRef.current
    if (!target || noteId !== target) return
    setStep((s) => (s === 2 ? 3 : s))
  }, [])

  const goToStep4 = useCallback(() => {
    setStep(4)
  }, [])

  const completeTour = useCallback(() => {
    finish()
  }, [finish])

  const skipTour = useCallback(() => {
    finish()
  }, [finish])

  const suppressViewerPoolEmptyExit =
    isActive && step === 3 && Boolean(tourNoteId)

  const value = useMemo<OnboardingTourContextValue>(
    () => ({
      isActive,
      step,
      tourNoteId,
      beginStep2,
      tryAdvanceOnNoteOpen,
      goToStep4,
      completeTour,
      skipTour,
      suppressViewerPoolEmptyExit,
    }),
    [
      isActive,
      step,
      tourNoteId,
      beginStep2,
      tryAdvanceOnNoteOpen,
      goToStep4,
      completeTour,
      skipTour,
      suppressViewerPoolEmptyExit,
    ]
  )

  return (
    <OnboardingTourContext.Provider value={value}>
      {children}
      {mounted && isActive && <OnboardingCoachmark step={step} onSkip={skipTour} onOk={completeTour} />}
    </OnboardingTourContext.Provider>
  )
}

function OnboardingCoachmark({
  step,
  onSkip,
  onOk,
}: {
  step: OnboardingStep
  onSkip: () => void
  onOk: () => void
}) {
  if (step < 1 || step > 4) return null

  const copy = STEP_COPY[step as 1 | 2 | 3 | 4]
  const [cardPos, setCardPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const updatePosition = useCallback(() => {
    if (step === 3) {
      setCardPos(null)
      return
    }
    const selByStep: Record<number, string> = {
      1: '[data-tour="note-input"]',
      2: '[data-tour="onboarding-inbox-note"]',
      4: '[data-tour="sidebar-wechat"]',
    }
    const sel = selByStep[step]
    if (!sel) return
    const parts = sel.split(',')
    let minL = Infinity
    let minT = Infinity
    let maxR = -Infinity
    let maxB = -Infinity
    let found = false
    for (const p of parts) {
      const el = document.querySelector(p.trim())
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      found = true
      minL = Math.min(minL, r.left)
      minT = Math.min(minT, r.top)
      maxR = Math.max(maxR, r.right)
      maxB = Math.max(maxB, r.bottom)
    }
    if (!found) {
      setCardPos(null)
      return
    }
    const pad = 12
    const vw = typeof window !== 'undefined' ? window.innerWidth : 400
    const cardW = Math.min(340, vw - 32)
    let left = minL + (maxR - minL) / 2 - cardW / 2
    left = Math.max(16, Math.min(left, vw - cardW - 16))
    let top = maxB + pad
    if (typeof window !== 'undefined' && top + 220 > window.innerHeight) {
      top = Math.max(16, minT - pad - 200)
    }
    setCardPos({ top, left, width: cardW })
  }, [step])

  useLayoutEffect(() => {
    updatePosition()
    const t = window.setTimeout(updatePosition, 80)
    const ro = new ResizeObserver(() => updatePosition())
    ro.observe(document.body)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.clearTimeout(t)
      ro.disconnect()
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [updatePosition, step])

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <div
        className="pointer-events-none fixed inset-0 z-[468] bg-primary/[0.04] motion-safe:transition-opacity motion-safe:duration-300"
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-auto fixed z-[480] max-w-[calc(100vw-2rem)] rounded-2xl border border-primary/20 bg-card/95 p-4 shadow-[var(--shadow-float)] backdrop-blur-md',
          'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300',
          (step === 3 || !cardPos) &&
            'bottom-6 left-1/2 w-[min(340px,calc(100vw-2rem))] -translate-x-1/2'
        )}
        style={
          cardPos && step !== 3
            ? {
                top: cardPos.top,
                left: cardPos.left,
                width: cardPos.width,
              }
            : undefined
        }
        role="dialog"
        aria-modal="false"
        aria-labelledby="onboarding-title"
      >
        <div className="flex items-start justify-between gap-2">
          <h2
            id="onboarding-title"
            className="text-base font-bold leading-snug tracking-tight text-foreground"
          >
            {copy.title}
          </h2>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="跳过引导"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
        {copy.hint && <p className="mt-2 text-xs font-medium text-primary/90">{copy.hint}</p>}
        {step === 4 && (
          <Button className="mt-4 h-10 w-full rounded-xl text-sm font-semibold shadow-sm" onClick={onOk}>
            好的
          </Button>
        )}
        <button
          type="button"
          onClick={onSkip}
          className="mt-3 w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          跳过引导
        </button>
      </div>
    </>,
    document.body
  )
}
