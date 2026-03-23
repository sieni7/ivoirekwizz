import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<any>;
  signInAsGuest: () => void;
  verifyAttempts: number;
  generateSupportLink: (email: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IS_DEV = import.meta.env.VITE_DEV_MODE === 'true';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyAttempts, setVerifyAttempts] = useState(0);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  useEffect(() => {
    // 1. Initialisation : Essayer de récupérer la session réelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
      } else if (IS_DEV) {
        const savedUser = localStorage.getItem('guest_user');
        if (savedUser) setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    });

    // 2. Écouter les changements de session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
      } else if (!IS_DEV) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOtp = async (email: string) => {
    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) {
      throw new Error("Format d'email invalide.");
    }

    try {
      console.log(`Envoi OTP à: ${trimmedEmail}`);
      const { error } = await supabase.auth.signInWithOtp({ 
        email: trimmedEmail,
        options: {
          shouldCreateUser: true
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Erreur sendOtp:', error.message);
      throw error;
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    if (verifyAttempts >= 5) {
      throw new Error("Trop de tentatives. Veuillez renvoyer un nouveau code.");
    }

    try {
      console.log(`Tentative de vérification OTP pour: ${email} avec le code: ${token}`);
      const { data, error } = await supabase.auth.verifyOtp({ 
        email, 
        token, 
        type: 'email' 
      });
      
      if (error) {
        console.error('Erreur Supabase verifyOtp:', error);
        setVerifyAttempts(prev => prev + 1);
        throw error;
      }
      
      console.log('Vérification OTP réussie:', data);
      setVerifyAttempts(0);
      return data;
    } catch (error: any) {
      console.error('Catch verifyOtp:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (IS_DEV) {
        localStorage.removeItem('guest_user');
      }
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error: any) {
      console.error('Erreur déconnexion:', error.message);
    }
  };

  const signInAsGuest = () => {
    if (!IS_DEV) return;
    const guestUser = {
      id: 'guest-' + Math.random().toString(36).substr(2, 9),
      email: 'guest@ivoirekwizz.com',
      user_metadata: { full_name: 'Invité Développeur' },
      is_guest: true
    } as any;
    
    localStorage.setItem('guest_user', JSON.stringify(guestUser));
    setUser(guestUser);
  };

  const generateSupportLink = (email: string) => {
    const body = encodeURIComponent(`Bonjour,\n\nJe n'arrive pas à me connecter avec l'email : ${email}.\n\n(Précisez l'erreur ici...)`);
    return `https://wa.me/2250707070707?text=${body}`;
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    sendOtp,
    verifyOtp,
    signInAsGuest,
    verifyAttempts,
    generateSupportLink
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
