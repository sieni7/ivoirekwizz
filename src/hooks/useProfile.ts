import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

const IS_DEV = import.meta.env.VITE_DEV_MODE === 'true';

export interface Profile {
  id: string; // id est à la fois PK et FK vers auth.users
  nom: string;
  prenom: string;
  age: number;
  niveau: string;
  concours_cible: string;
  created_at?: string;
  updated_at?: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (IS_DEV && user.id.startsWith('guest-')) {
        const localProfile = localStorage.getItem('guest_profile');
        if (localProfile) {
          setProfile(JSON.parse(localProfile));
        }
      } else {
        fetchProfile(user.id);
      }
    } else {
      setProfile(null);
    }
  }, [user]);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) setProfile(data);
    } catch (error: any) {
      if (IS_DEV) console.error('Erreur fetchProfile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const validateProfile = (data: Profile) => {
    if (data.nom.trim().length < 2 || data.prenom.trim().length < 2) {
      throw new Error("Le nom et le prénom doivent contenir au moins 2 caractères.");
    }
    if (data.age < 15 || data.age > 60) {
      throw new Error("L'âge doit être compris entre 15 et 60 ans.");
    }
  };

  const upsertProfile = async (profileData: Profile) => {
    try {
      setLoading(true);
      validateProfile(profileData);

      if (IS_DEV && profileData.id.startsWith('guest-')) {
        return new Promise((resolve) => {
          setTimeout(() => {
            localStorage.setItem('guest_profile', JSON.stringify(profileData));
            setProfile(profileData);
            setLoading(false);
            resolve(profileData);
          }, 1000);
        });
      }

      const payload = {
        id: profileData.id,
        nom: profileData.nom.trim(),
        prenom: profileData.prenom.trim(),
        age: profileData.age,
        niveau: profileData.niveau,
        concours_cible: profileData.concours_cible
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) throw error;
      if (data) setProfile(data);
      return data;
    } catch (error: any) {
      if (IS_DEV) console.error('Erreur upsertProfile:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, fetchProfile, upsertProfile };
}
