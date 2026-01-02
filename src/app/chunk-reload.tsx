// app/chunk-reload.tsx
'use client'

import { useEffect } from 'react'

export function ChunkReloadHandler() {
    useEffect(() => {
        if (typeof window === 'undefined') return

        const handleChunkError = (event: ErrorEvent) => {
            const isChunkError =
                event.message?.includes('Loading chunk') ||
                event.message?.includes('ChunkLoadError')

            if (isChunkError) {
                console.warn('🔄 Chunk load error detected. Reloading...')

                const reloadCount = Number(sessionStorage.getItem('reload_count') || '0')

                if (reloadCount < 2) {
                    sessionStorage.setItem('reload_count', String(reloadCount + 1))
                    window.location.reload()
                } else {
                    console.error('❌ Multiple reload attempts failed')
                    sessionStorage.removeItem('reload_count')
                }
            }
        }

        const handleRejection = (event: PromiseRejectionEvent) => {
            const errorMsg = String(event.reason?.message || event.reason || '')

            if (errorMsg.includes('Loading chunk') || errorMsg.includes('ChunkLoadError')) {
                console.warn('🔄 Chunk promise rejection. Reloading...')
                event.preventDefault()

                const reloadCount = Number(sessionStorage.getItem('reload_count') || '0')

                if (reloadCount < 2) {
                    sessionStorage.setItem('reload_count', String(reloadCount + 1))
                    window.location.reload()
                }
            }
        }

        // Reset counter after successful load
        const resetCounter = setTimeout(() => {
            sessionStorage.removeItem('reload_count')
        }, 3000)

        window.addEventListener('error', handleChunkError)
        window.addEventListener('unhandledrejection', handleRejection)

        return () => {
            clearTimeout(resetCounter)
            window.removeEventListener('error', handleChunkError)
            window.removeEventListener('unhandledrejection', handleRejection)
        }
    }, [])

    return null
}