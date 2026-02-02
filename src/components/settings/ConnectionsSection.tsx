import { useState } from 'react';
import { Github } from 'lucide-react';
import { Button } from '../ui/Button';
import { AuthService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';

export function ConnectionsSection() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState<string | null>(null);

    const handleGoogleConnect = async () => {
        setLoading('google');
        try {
            await AuthService.linkGoogleAccount();
            // User will be redirected, handled by Supabase
        } catch (error: any) {
            console.error(error);
            if (error.message?.includes("provider is not enabled")) {
                showToast("Google Login is not enabled. Please enable it in Supabase Dashboard.", "error");
            } else {
                showToast(error.message || "Failed to initiate Google connection", "error");
            }
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
            <div>
                <h2 className="text-xl font-semibold mb-1">Connected Accounts</h2>
                <p className="text-sm text-muted-foreground">Integrate with your favorite apps and services.</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-xl opacity-60 pointer-events-none">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
                            <Github className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium">GitHub</p>
                            <p className="text-xs text-muted-foreground">Sync commits to heatmap (Coming Soon)</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm">Coming Soon</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white">
                            <span className="font-bold">G</span>
                        </div>
                        <div>
                            <p className="font-medium">Google Account</p>
                            <p className="text-xs text-muted-foreground">Link your Google account for easier login</p>
                        </div>
                    </div>
                    <Button
                        variant={loading === 'google' ? 'ghost' : 'outline'}
                        size="sm"
                        onClick={handleGoogleConnect}
                        disabled={!!loading}
                    >
                        {loading === 'google' ? 'Redirecting...' : 'Connect'}
                    </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20 opacity-60 pointer-events-none">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                            <span className="font-bold">f</span>
                        </div>
                        <div>
                            <p className="font-medium">Facebook</p>
                            <p className="text-xs text-muted-foreground">Find friends (Coming Soon)</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm">Coming Soon</Button>
                </div>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4 bg-yellow-500/10 p-2 rounded">
                Note: Google Sign-In must be enabled in your Supabase Project Dashboard under Authentication &gt; Providers.
            </p>
        </div>
    );
}
