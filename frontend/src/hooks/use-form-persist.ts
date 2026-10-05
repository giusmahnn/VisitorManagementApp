import { useEffect, useRef } from "react"
import type { UseFormReturn, FieldValues, DefaultValues } from "react-hook-form"

interface UseFormPersistOptions<T extends FieldValues> {
  storageKey: string
  form: UseFormReturn<T>
  exclude?: (keyof T)[]
  debounceMs?: number
}

export function useFormPersist<T extends FieldValues>({
  storageKey,
  form,
  exclude = [],
  debounceMs = 300,
}: UseFormPersistOptions<T>) {
  const { watch, reset, getValues } = form

  const hydrated = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const excludeRef = useRef<(keyof T)[]>(exclude)

  // keep latest exclude without re-triggering effects
  useEffect(() => {
    excludeRef.current = exclude
  }, [exclude])

  // ── Restore on mount ──────────────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem(storageKey)
    if (!raw) {
      hydrated.current = true
      return
    }

    try {
      const saved = JSON.parse(raw) as Partial<T>

      // remove excluded fields
      excludeRef.current.forEach((key) => {
        delete (saved as Record<string, unknown>)[key as string]
      })

      const current = getValues()

      const isSame =
        JSON.stringify(current ?? {}) === JSON.stringify(saved ?? {})

      if (!isSame) {
        reset(saved as DefaultValues<T>, {
          keepDirty: true,
        })
      }
    } catch {
      localStorage.removeItem(storageKey)
    } finally {
      hydrated.current = true
    }
  }, [storageKey, reset, getValues])

  // ── Persist on change (debounced) ─────────────────────────
  useEffect(() => {
    const subscription = watch((values) => {
      if (!hydrated.current) return

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        try {
          const toSave = { ...(values as Record<string, unknown>) }

          // remove excluded fields
          excludeRef.current.forEach((key) => {
            delete toSave[key as string]
          })

          // remove undefined values
          Object.keys(toSave).forEach((key) => {
            if (toSave[key] === undefined) {
              delete toSave[key]
            }
          })

          localStorage.setItem(storageKey, JSON.stringify(toSave))
        } catch {
          // ignore storage errors
        }
      }, debounceMs)
    })

    return () => {
      subscription.unsubscribe()
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [storageKey, watch, debounceMs])

  // ── Clear storage ─────────────────────────────────────────
  const clear = () => {
    localStorage.removeItem(storageKey)
    reset({} as DefaultValues<T>)
    hydrated.current = false
  }

  return { clear }
}