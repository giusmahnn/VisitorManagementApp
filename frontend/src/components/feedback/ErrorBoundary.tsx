import { Component, type ReactNode } from 'react';
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"


interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="flex flex-col items-center justify-center p-4">
                    <AlertTriangle className="w-16 h-16 text-red-500 mb-2" />
                    <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground mb-4">
                        An error occurred while rendering the component.
                    </p>
                    <Button onClick={this.handleRetry}>
                        Try Again
                    </Button>
                </div>
            );
        }
        return this.props.children;
    }
}