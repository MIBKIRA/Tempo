import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface UserContextType {
  userAvatarUrl: string;
  setUserAvatarUrl: (url: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  userUsername: string;
  setUserUsername: (username: string) => void;
  userBio: string;
  setUserBio: (bio: string) => void;
  refreshUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>('');
  const [userName, setUserName] = useState<string>('Adrian Vance');
  const [userEmail, setUserEmail] = useState<string>('ryuk9079@gmail.com');
  const [userUsername, setUserUsername] = useState<string>('');
  const [userBio, setUserBio] = useState<string>('');

  const refreshUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email || 'ryuk9079@gmail.com');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserName(profile.full_name || profile.username || 'Adrian Vance');
          setUserAvatarUrl(profile.avatar_url || '');
          setUserUsername(profile.username || '');
        }

        // Fetch bio from user metadata as fallback if any
        if (session.user.user_metadata?.bio) {
          setUserBio(session.user.user_metadata.bio);
        }
      }
    } catch (e) {
      console.error("User context refresh profile error:", e);
    }
  };

  useEffect(() => {
    refreshUserProfile();

    // Set up auth state change listener to pull profiles immediately
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || 'ryuk9079@gmail.com');
        
        // Fetch or re-fetch profile on sign-in, initial session, or user update
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, username, avatar_url')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              setUserName(profile.full_name || profile.username || 'Adrian Vance');
              setUserAvatarUrl(profile.avatar_url || '');
              setUserUsername(profile.username || '');
            }
            if (session.user.user_metadata?.bio) {
              setUserBio(session.user.user_metadata.bio);
            }
          } catch (err) {
            console.error("Error fetching user profile in auth change subscription:", err);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        // Reset to initial clean state on sign out
        setUserAvatarUrl('');
        setUserName('Adrian Vance');
        setUserEmail('ryuk9079@gmail.com');
        setUserUsername('');
        setUserBio('');
      } else {
        // Fallback for any other events where session might be cleared
        setUserAvatarUrl('');
        setUserName('Adrian Vance');
        setUserEmail('ryuk9079@gmail.com');
        setUserUsername('');
        setUserBio('');
      }
    });
    
    // Listen for custom event trigger to sync across tabs/components
    const handleUpdate = () => {
      refreshUserProfile();
    };
    window.addEventListener('tempo-profile-updated', handleUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('tempo-profile-updated', handleUpdate);
    };
  }, []);

  return (
    <UserContext.Provider value={{
      userAvatarUrl,
      setUserAvatarUrl,
      userName,
      setUserName,
      userEmail,
      setUserEmail,
      userUsername,
      setUserUsername,
      userBio,
      setUserBio,
      refreshUserProfile
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
