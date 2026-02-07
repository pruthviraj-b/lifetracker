import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

export default function SessionDebug() {
    const [sessionInfo, setSessionInfo] = useState<any>(null);

    useEffect(() => {
        const checkSession = async () => {
            const { data, error } = await supabase.auth.getSession();
            setSessionInfo({
                hasSession: !!data.session,
                hasUser: !!data.session?.user,
                userId: data.session?.user?.id,
                userEmail: data.session?.user?.email,
                expiresAt: data.session?.expires_at,
                error: error?.message
            });
        };
        checkSession();
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>Session Debug</h1>
            <pre>{JSON.stringify(sessionInfo, null, 2)}</pre>

            <button onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
            }}>
                Force Logout
            </button>
        </div>
    );
}
