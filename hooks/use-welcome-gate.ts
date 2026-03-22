'use client'

import { useEffect, useState, useCallback } from 'react'

/** 与引导无关：清除后可再次看到开始页。控制台：`localStorage.removeItem('buluohui-welcome-dismissed')` */
export const WELCOME_DISMISSED_STORAGE_KEY = 'buluohui-welcome-dismissed'

const STORAGE_KEY = WELCOME_DISMISSED_STORAGE_KEY

export type WelcomeGateState = 'loading' | 'show' | 'hidden'

/**
 * 首次进入展示开始页；「即刻开始」或「跳过」后写入 localStorage，之后不再展示。
 */
export function useWelcomeGate(): {
  state: WelcomeGateState
  dismiss: () => void
} {
  const [state, setState] = useState<WelcomeGateState>('loading')

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY) === '1'
      setState(dismissed ? 'hidden' : 'show')
    } catch {
      setState('show')
    }
  }, [])

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    setState('hidden')
  }, [])

  return { state, dismiss }
}
