import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Terminal } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Critical System Failure:', error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-red-500 font-mono p-8 flex flex-col items-center justify-center selection:bg-red-900 selection:text-white">
                    <div className="max-w-3xl w-full border-2 border-red-900 bg-red-950/10 p-12 relative overflow-hidden">
                        {/* Scanline Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />

                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4 border-b-2 border-red-900 pb-6">
                                <AlertTriangle className="w-12 h-12 animate-pulse" />
                                <div>
                                    <h1 className="text-4xl font-black uppercase tracking-tighter gl-text">System_Failure</h1>
                                    <p className="text-xs uppercase tracking-[0.5em] opacity-70">Critical Runtime Exception</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm uppercase tracking-wider opacity-60">
                                    <Terminal className="w-4 h-4" />
                                    <span>Error_Log_Output</span>
                                </div>
                                <div className="bg-black/50 p-6 border border-red-900/50 rounded text-sm overflow-auto max-h-[40vh]">
                                    <p className="font-bold mb-4">{this.state.error?.toString()}</p>
                                    <pre className="text-xs opacity-60 whitespace-pre-wrap">
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </div>
                            </div>

                            <div className="pt-8 flex gap-6">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="bg-red-600 text-black font-black uppercase tracking-widest px-8 py-4 hover:bg-red-500 transition-colors flex items-center gap-2"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    Reboot_System
                                </button>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="border border-red-900 text-red-500 font-bold uppercase tracking-widest px-8 py-4 hover:bg-red-950/50 transition-colors"
                                >
                                    Emergency_Exit
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-[10px] uppercase tracking-[0.3em] opacity-40">
                        Error_Code: 0xCRASH_PROTOCOL // Contact_Admin
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
