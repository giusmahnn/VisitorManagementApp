import AppRouter from "./router"
import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "./providers/theme-provider"

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ThemeProvider>
  )
}