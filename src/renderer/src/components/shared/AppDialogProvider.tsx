import { useCallback, useEffect, useRef, useState } from 'react'
import {
  IconAlertTriangle,
  IconCheckCircle,
  IconInfo,
  IconX,
  IconXCircle,
} from './Icons'

type DialogKind = 'alert' | 'confirm'
type DialogVariant = 'info' | 'success' | 'warning' | 'error'

interface DialogOptions {
  title?: string
  confirmText?: string
  cancelText?: string
  variant?: DialogVariant
}

interface DialogRequest extends DialogOptions {
  id: number
  kind: DialogKind
  message: string
  resolve?: (value: boolean) => void
}

interface DialogEventDetail extends DialogOptions {
  kind: DialogKind
  message: string
  resolve?: (value: boolean) => void
}

const DEFAULT_TITLE: Record<DialogVariant, string> = {
  info: 'Aviso',
  success: 'Listo',
  warning: 'Confirmar accion',
  error: 'Error',
}

const ICON_BY_VARIANT = {
  info: IconInfo,
  success: IconCheckCircle,
  warning: IconAlertTriangle,
  error: IconXCircle,
}

let nextId = 1

function normalizeMessage(message: unknown): string {
  if (message instanceof Error) return message.message
  if (typeof message === 'string') return message
  return String(message ?? '')
}

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<DialogRequest[]>([])
  const activeElementRef = useRef<HTMLElement | null>(null)
  const current = queue[0]

  const openDialog = useCallback((detail: DialogEventDetail) => {
    const variant = detail.variant ?? (detail.kind === 'confirm' ? 'warning' : 'info')
    setQueue(items => [
      ...items,
      {
        ...detail,
        id: nextId++,
        message: detail.message,
        variant,
        title: detail.title ?? DEFAULT_TITLE[variant],
        confirmText: detail.confirmText ?? 'Aceptar',
        cancelText: detail.cancelText ?? 'Cancelar',
      },
    ])
  }, [])

  useEffect(() => {
    const originalAlert = window.alert.bind(window)
    const originalConfirm = window.confirm.bind(window)

    window.alert = (message?: unknown): void => {
      window.dispatchEvent(new CustomEvent<DialogEventDetail>('app-dialog:open', {
        detail: { kind: 'alert', message: normalizeMessage(message), variant: 'info' },
      }))
    }

    window.confirm = (message?: string): boolean => {
      window.dispatchEvent(new CustomEvent<DialogEventDetail>('app-dialog:open', {
        detail: {
          kind: 'alert',
          message: normalizeMessage(message),
          title: 'Confirmacion bloqueada',
          variant: 'warning',
        },
      }))
      return false
    }

    window.appConfirm = (message: string, options?: DialogOptions): Promise<boolean> => {
      return new Promise(resolve => {
        window.dispatchEvent(new CustomEvent<DialogEventDetail>('app-dialog:open', {
          detail: { kind: 'confirm', message: normalizeMessage(message), resolve, ...options },
        }))
      })
    }

    const onOpen = (event: Event): void => {
      openDialog((event as CustomEvent<DialogEventDetail>).detail)
    }

    window.addEventListener('app-dialog:open', onOpen)

    return () => {
      window.alert = originalAlert
      window.confirm = originalConfirm
      delete window.appConfirm
      window.removeEventListener('app-dialog:open', onOpen)
    }
  }, [openDialog])

  useEffect(() => {
    if (!current) return
    activeElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  }, [current])

  const closeCurrent = useCallback((value: boolean) => {
    setQueue(items => {
      const [item, ...rest] = items
      item?.resolve?.(value)
      return rest
    })

    window.requestAnimationFrame(() => {
      const element = activeElementRef.current
      if (element && document.contains(element)) element.focus()
    })
  }, [])

  const handleBackdropClick = (): void => {
    if (current?.kind === 'confirm') closeCurrent(false)
    else closeCurrent(true)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeCurrent(current?.kind === 'confirm' ? false : true)
    }
  }

  const Icon = current ? ICON_BY_VARIANT[current.variant ?? 'info'] : IconInfo

  return (
    <>
      {children}
      {current && (
        <div
          className="modal-overlay app-dialog-overlay"
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
          role="presentation"
        >
          <div
            className="modal modal-sm app-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`app-dialog-title-${current.id}`}
            onClick={event => event.stopPropagation()}
          >
            <div className={`app-dialog-icon app-dialog-icon-${current.variant}`}>
              <Icon size={22} />
            </div>
            <div className="app-dialog-content">
              <div className="app-dialog-header">
                <h3 id={`app-dialog-title-${current.id}`} className="modal-title">
                  {current.title}
                </h3>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  type="button"
                  onClick={() => closeCurrent(current.kind === 'confirm' ? false : true)}
                  aria-label="Cerrar"
                >
                  <IconX size={16} />
                </button>
              </div>
              <p className="app-dialog-message">{current.message}</p>
              <div className="app-dialog-actions">
                {current.kind === 'confirm' && (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => closeCurrent(false)}
                  >
                    {current.cancelText}
                  </button>
                )}
                <button
                  className={`btn ${current.variant === 'error' ? 'btn-danger' : 'btn-primary'}`}
                  type="button"
                  autoFocus
                  onClick={() => closeCurrent(true)}
                >
                  {current.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
