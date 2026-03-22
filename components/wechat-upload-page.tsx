'use client'

/**
 * 展示微信上传引导图（public/wechat-upload-guide.png）
 */
export function WechatUploadPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border/60 bg-background p-4 shadow-[var(--shadow-card)] md:p-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- 用户提供的静态说明图 */}
        <img
          src="/wechat-upload-guide.png"
          alt="微信上传：扫码绑定微信服务号，发送消息即可同步至网页端笔记"
          className="mx-auto block h-auto w-full max-w-5xl object-contain"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  )
}
