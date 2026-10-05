import { useEffect } from "react"
import { useThemeStore } from "@/store/theme.store"

interface Props {
  children: React.ReactNode
}

export function ThemeProvider({ children }: Props) {
  const applyTheme = useThemeStore((s) => s.applyTheme)
  const mode = useThemeStore((s) => s.mode)

  /**
   * Apply theme once on mount + rehydrate
   */
  useEffect(() => {
    applyTheme()
  }, [applyTheme])

  /**
   * Listen to system theme changes ONLY when:
   * mode = "system"
   */
  useEffect(() => {
    if (mode !== "system") return
    if (typeof window === "undefined") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = () => {
      applyTheme()
    }

    media.addEventListener("change", handleChange)

    return () => {
      media.removeEventListener("change", handleChange)
    }
  }, [mode, applyTheme])

  return <>{children}</>
}