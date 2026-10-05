import { Loader2 } from "lucide-react"

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Loader2 className="w-16 h-16 animate-spin" />
        <h2 className="text-xl font-bold mb-2">Reloading...</h2>
        <p className="text-muted-foreground">
          Please wait while the page reloads.
        </p>
    </div>
  );
}