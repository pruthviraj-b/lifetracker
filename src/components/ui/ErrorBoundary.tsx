import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleReset = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center p-8 text-center font-mono">
                    <div className="bg-red-900/10 p-6 rounded-full border-2 border-red-500 mb-6 animate-pulse">
                        <AlertCircle className="w-12 h-12" />
                    </div>
                    <h1 className="text-3xl font-black uppercase mb-4 tracking-tighter">
                        CRITICAL_SYSTEM_FAILURE
                    </h1>
                    <p className="text-sm bg-red-900/20 p-4 rounded border border-red-500/30 max-w-md break-all">
                        {this.state.error?.message || "Unknown error occurred"}
                    </p>
                    <div className="mt-8 flex gap-4">
                        <button
                            onClick={this.handleReload}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-black font-bold uppercase hover:bg-white transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" /> REBOOT SYSTEM
                        </button>
                        <button
                            onClick={this.handleReset}
                            className="px-6 py-3 border border-red-500 text-red-500 font-bold uppercase hover:bg-red-900/20 transition-colors"
                        >
                            HARD RESET
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
