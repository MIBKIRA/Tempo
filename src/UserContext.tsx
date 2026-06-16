import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface UserContextType {
  userAvatarUrl: string;
  setUserAvatarUrl: (url: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  refreshUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>('');
  const [userName, setUserName] = useState<string>('Adrian Vance');
  const [userEmail, setUserEmail] = useState<string>('ryuk9079@gmail.com');

  const refreshUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email || 'ryuk9079@gmail.com');
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserName(profile.full_name || profile.username || 'Adrian Vance');
          setUserAvatarUrl(profile.avatar_url || '');
        }
      }
    } catch (e) {
      console.error("User context refresh profile error:", e);
    }
  };

  useEffect(() => {
    refreshUserProfile();
    
    // Listen for custom event trigger to sync across tabs/components
    const handleUpdate = () => {
      refreshUserProfile();
    };
    window.addEventListener('tempo-profile-updated', handleUpdate);
    return () => {
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
