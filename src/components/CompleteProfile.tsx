import React, { useState, useEffect, useRef } from 'react';
import { Lock, User, Calendar, AtSign, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { LogoSm } from './Logo';
import { supabase } from '../supabaseClient';
import EngineeredButton from './EngineeredButton';

interface CompleteProfileProps {
  onSetupSuccess: (username: string, dob: string) => void;
  onLogout: () => void;
}

export default function CompleteProfile({ onSetupSuccess, onLogout }: CompleteProfileProps) {
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  
  const [dob, setDob] = useState('');
  const [dobError, setDobError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time username availability check with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!username) {
      setUsernameStatus('idle');
      setUsernameError(null);
      return;
    }

    // 1. Client-side pattern check (3-20 chars, lowercase letters/numbers/underscores only)
    if (username.length < 3 || username.length > 20) {
      setUsernameStatus('invalid');
      setUsernameError('Username must be between 3 and 20 characters.');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      setUsernameStatus('invalid');
      setUsernameError('Use lowercase letters, numbers, or underscores only.');
      return;
    }

    setUsernameStatus('checking');
    setUsernameError(null);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setUsernameStatus('taken');
          setUsernameError('This username is already in use.');
        } else {
          setUsernameStatus('available');
          setUsernameError(null);
        }
      } catch (err) {
        console.error('Failed to verify username availability:', err);
        // Fallback to idle to not block user, or keep checking
        setUsernameStatus('idle');
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setDobError(null);

    // 1. Client-side DOB check (Must be 13+)
    if (!dob) {
      setDobError('Date of birth is required.');
      return;
    }

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 13) {
      setDobError('You must be at least 13 years old.');
      return;
    }

    // 2. Validate current username check state
    if (usernameStatus === 'invalid') {
      return;
    }
    if (usernameStatus === 'taken') {
      setErrorMessage('This username is already in use');
      return;
    }
    if (!username) {
      setErrorMessage('Username is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get active authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw userError || new Error('No authenticated user session found.');
      }

      // Update the user's details and profile in one go
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username.trim().toLowerCase(),
          date_of_birth: dob,
          is_complete: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw new Error('Failed to save profile: ' + updateError.message);
      }

      // Confirm the update actually worked in the database before redirecting
      const { data: updatedProfile, error: verifyError } = await supabase
        .from('profiles')
        .select('is_complete')
        .eq('id', user.id)
        .single();

      if (verifyError) {
        throw new Error('Failed to verify profile completeness: ' + verifyError.message);
      }

      if (!updatedProfile?.is_complete) {
        throw new Error('Profile save failed. Please try again.');
      }

      // Sync Supabase user metadata with username and dob
      await supabase.auth.updateUser({
        data: {
          username: username,
          date_of_birth: dob
        }
      });

      // Call success handler
      onSetupSuccess(username, dob);
    } catch (err: any) {
      console.error('Profile complete error:', err);
      setErrorMessage(err.message || 'Something went wrong, try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0D0D0F] text-[#F1F1F1] font-sans flex flex-col items-center justify-center py-12 px-6 select-none relative">
      
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#8B5CF6]/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-[#2DD4BF]/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[420px] p-6 md:p-8 bg-[#141416] border border-[#2A2A2D] rounded-2xl shadow-2xl relative z-10">
        
        <div className="flex flex-col items-center text-center mb-8">
          <LogoSm className="w-10 h-10 mb-3 text-[#4F8EF7]" />
          <h2 className="text-xl font-bold tracking-tight text-[#F1F1F1]">Complete Your Profile</h2>
          <p className="text-xs text-[#8A8A90] mt-1">Just two more things to get started</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 rounded-lg bg-[#FB7185]/10 border border-[#FB7185]/20 text-xs text-[#FB7185] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Username Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="complete-username" className="text-xs font-sans font-medium text-[#8A8A90] tracking-wide">
              Username
            </label>
            <div className="relative flex items-center">
              <AtSign className="absolute left-3.5 w-4 h-4 text-[#4A4A52] pointer-events-none" />
              <input
                id="complete-username"
                type="text"
                required
                placeholder="choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                className="tempo-input w-full pl-10 pr-4 h-[44px] text-sm rounded-lg"
              />
            </div>
            
            {/* Real-time username verification indicators */}
            {usernameStatus === 'checking' && (
              <span className="text-[11px] text-[#8A8A90] px-0.5 mt-0.5">Checking availability...</span>
            )}
            {usernameStatus === 'available' && (
              <span className="text-[11px] text-[#34D399] px-0.5 mt-0.5 font-sans font-medium flex items-center gap-1">
                ✓ Available
              </span>
            )}
            {usernameStatus === 'taken' && (
              <span className="text-[11px] text-[#FB7185] px-0.5 mt-0.5 font-sans font-medium flex items-center gap-1">
                ✗ Already taken
              </span>
            )}
            {usernameError && (
              <span className="text-[11px] text-[#FB7185] px-0.5 mt-0.5 font-sans">
                {usernameError}
              </span>
            )}
          </div>

          {/* Date of Birth Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="complete-dob" className="text-xs font-sans font-medium text-[#8A8A90] tracking-wide">
              Date of Birth
            </label>
            <div className="relative flex items-center">
              <Calendar className="absolute left-3.5 w-4 h-4 text-[#4A4A52] pointer-events-none" />
              <input
                id="complete-dob"
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className={`tempo-input w-full pl-10 pr-4 h-[44px] text-sm rounded-lg ${dobError ? 'border-[#FB7185]/50' : ''}`}
                style={{ colorScheme: 'dark' }}
              />
            </div>
            {dobError && (
              <span className="text-[11px] text-[#FB7185] px-0.5 mt-0.5 font-sans">
                {dobError}
              </span>
            )}
          </div>

          {/* Complete Button */}
          <EngineeredButton
            id="complete-btn-submit"
            variant="primary"
            type="submit"
            disabled={isSubmitting || usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'invalid'}
            isLoading={isSubmitting}
            fullWidth
            showArrow={true}
          >
            Complete Setup
          </EngineeredButton>

          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-[#8A8A90] hover:text-[#F1F1F1] underline text-center cursor-pointer transition-colors mt-2"
          >
            Cancel and Sign Out
          </button>

        </form>

      </div>
    </div>
  );
}
