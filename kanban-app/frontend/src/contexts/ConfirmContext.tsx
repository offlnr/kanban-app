import { createContext, useContext, useState, useRef, type ReactNode } from 'react'

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn>(null!)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { visible: boolean }) | null>(null)
  const resolveRef = useRef<(value: boolean) => void>(null!)

  const confirm: ConfirmFn = (options) => {
    const opts = typeof options === 'string' ? { message: options } : options
    setState({ ...opts, visible: true })
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }

  const respond = (value: boolean) => {
    setState(null)
    resolveRef.current?.(value)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {state?.visible && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/40"
          onClick={() => respond(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className={`w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4 ${state.danger ? 'bg-red-100' : 'bg-amber-100'}`}>
              <span className={`text-xl ${state.danger ? 'text-red-600' : 'text-amber-600'}`}>
                {state.danger ? '🗑' : '⚠'}
              </span>
            </div>

            {state.title && (
              <h3 className="text-center font-semibold text-gray-900 mb-1">{state.title}</h3>
            )}
            <p className="text-center text-sm text-gray-500 mb-6">{state.message}</p>

            <div className="flex gap-3">
              <button
                onClick={() => respond(false)}
                className="flex-1 border border-gray-200 text-gray-700 font-medium rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => respond(true)}
                className={`flex-1 text-white font-medium rounded-xl py-2.5 text-sm transition-colors ${
                  state.danger
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {state.confirmLabel ?? (state.danger ? 'Eliminar' : 'Confirmar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => useContext(ConfirmContext)
