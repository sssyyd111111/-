'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type WelcomeScreenProps = {
  onDismiss: () => void
}

/** 入场动效：与 motion-safe 配合；减少动效时仅保留静态布局 */
const enter = {
  base: cn(
    'motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-500 motion-safe:ease-out'
  ),
  fadeUp: cn(
    'motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-600 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]'
  ),
  fadeIn: 'motion-safe:fade-in motion-safe:duration-500',
  fadeDown: 'motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-400',
  zoomIn: 'motion-safe:fade-in motion-safe:zoom-in-[0.98] motion-safe:duration-500',
} as const

/**
 * 开始页：与全站薄荷中性体系一致，简洁高效。
 */
export function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-[500] flex flex-col bg-background',
        enter.fadeIn,
        'motion-safe:duration-700'
      )}
    >
      {/* 极淡中心光晕：缓慢铺开 */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_45%,oklch(0.55_0.08_172/0.08),transparent_70%)]',
          enter.base,
          'motion-safe:fade-in motion-safe:zoom-in-105 motion-safe:duration-[1400ms] motion-safe:ease-out'
        )}
        aria-hidden
      />

      <header className="relative flex shrink-0 justify-end px-5 py-5 md:px-8 md:py-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'text-sm font-medium text-muted-foreground hover:text-foreground',
            enter.base,
            enter.fadeDown,
            'motion-safe:delay-100'
          )}
          onClick={onDismiss}
        >
          跳过
        </Button>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-16 md:px-10">
        <div className="mx-auto w-full max-w-xl text-center md:max-w-2xl">
          <h1
            className={cn(
              'text-balance text-3xl font-bold leading-[1.2] tracking-tight text-foreground md:text-4xl lg:text-5xl',
              enter.base,
              enter.fadeUp,
              'motion-safe:delay-150'
            )}
          >
            别让灵感，止于收藏。
          </h1>

          <div className="mx-auto mt-6 space-y-3 md:mt-8">
            <p
              className={cn(
                'text-pretty text-base font-medium leading-relaxed text-foreground/85 md:text-lg md:leading-relaxed',
                enter.base,
                enter.fadeUp,
                'motion-safe:delay-300'
              )}
            >
              收藏从未停止，学习从未开始？
            </p>
            <p
              className={cn(
                'text-pretty text-base leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed',
                enter.base,
                enter.fadeUp,
                'motion-safe:delay-[420ms]'
              )}
            >
              我们帮你整合信息碎片、生成摘要大纲、回顾灵感时刻，让每一次启动都轻而易举。
            </p>
          </div>

          <Button
            type="button"
            size="lg"
            className={cn(
              'mt-10 h-12 rounded-xl px-10 text-base font-semibold shadow-md',
              enter.base,
              enter.zoomIn,
              'motion-safe:slide-in-from-bottom-3 motion-safe:delay-[560ms]',
              'motion-safe:transition-transform motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]'
            )}
            onClick={onDismiss}
          >
            即刻开始
          </Button>
        </div>
      </main>
    </div>
  )
}
