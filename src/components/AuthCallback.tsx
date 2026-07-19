import React, { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LogoSm } from './Logo';

interface AuthCallbackProps {
  onComplete: (isComplete: boolean) => void;
}

export default function AuthCallback({ onComplete }: AuthCallbackProps) {
  useEffect(() => {
    async function handleSessionCheck() {
      try {
        // Wait another 1.2s to guarantee active URL fragment tokens process properly 
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          throw sessionError || new Error("No valid authenticated session");
        }

        // Fetch user profile complete flag
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_complete, provider')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        const needsProfileCompletion = profile?.provider === 'google' && profile?.is_complete === false;
        const isComplete = !needsProfileCompletion;

        if (window.opener) {
          // If in a popup, send status to the parent window and close self
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', isComplete, email: session.user.email, name: session.user.user_metadata?.full_name || session.user.user_metadata?.username || 'Adrian Vance' }, '*');
          window.close();
        } else {
          onComplete(isComplete);
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE' }, '*');
          window.close();
        } else {
          onComplete(true); // Default fallback
        }
      }
    }

    const timer = setTimeout(() => {
      handleSessionCheck();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen w-full bg-[#0D0D0F] flex flex-col items-center justify-center p-6 select-none relative">
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s infinite linear;
        }
      `}</style>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--tempo-accent-blue)]/5 rounded-full filter blur-[80px] pointer-events-none" />
      <LogoSm className="w-12 h-12 mb-4 animate-pulse text-[var(--tempo-accent-blue)]" />
      <h2 className="text-sm font-semibold text-[#F1F1F1] tracking-wide">Syncing Authentication</h2>
      <p className="text-xs text-[#8A8A90] mt-1.5">Establishing secure workspace session...</p>
      <div className="mt-6 w-24 h-1 rounded-full bg-[#1C1C1F] overflow-hidden relative">
        <div className="h-full bg-gradient-to-r from-[var(--tempo-accent-blue)] to-[var(--tempo-accent-purple)] w-full animate-loading-bar absolute inset-0" />
      </div>
    </div>
  );
}
