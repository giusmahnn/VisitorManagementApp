import { Moon, Palette, Sun } from "lucide-react";
import { useThemeStore, type Mode, type Theme } from "@/store/theme.store";

const themes: { value: Theme; label: string; color: string }[] = [
    { value: "slate", label: "Slate", color: "bg-slate-900" },
    { value: "teal", label: "Teal", color: "bg-teal-600" },
    { value: "violet", label: "Violet", color: "bg-violet-600" },
    { value: "glass", label: "Glass", color: "bg-cyan-500" },
];

export function ThemeControl() {
    const theme = useThemeStore((state) => state.theme);
    const mode = useThemeStore((state) => state.mode);
    const setTheme = useThemeStore((state) => state.setTheme);
    const setMode = useThemeStore((state) => state.setMode);

    return (
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1" aria-label="Theme settings">
            <Palette className="mx-1 size-4 text-muted-foreground" aria-hidden="true" />
            {themes.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    title={`${option.label} theme`}
                    aria-label={`${option.label} theme`}
                    aria-pressed={theme === option.value}
                    className={`size-5 rounded-full ${option.color} ring-offset-2 transition ${theme === option.value ? "ring-2 ring-primary" : "opacity-55 hover:opacity-100"}`}
                    onClick={() => setTheme(option.value)}
                />
            ))}
            <button
                type="button"
                title={mode === "dark" ? "Use light mode" : "Use dark mode"}
                aria-label={mode === "dark" ? "Use light mode" : "Use dark mode"}
                className="ml-1 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            >
                {mode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
        </div>
    );
}