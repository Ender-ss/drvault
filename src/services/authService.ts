import { supabase } from '../lib/supabase'

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export const authService = {
  getCurrentUser(): User | null {
    // Note: In a real app with Supabase, we usually use supabase.auth.getUser() 
    // but to keep it simple with existing code structure:
    const session = localStorage.getItem('supabase.auth.token');
    if (!session) return null;
    
    // We'll let the AuthContext handle the actual user fetching from session
    return null; 
  },

  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    if (!data.user) throw new Error('Falha ao fazer login.')

    return {
      id: data.user.id,
      name: data.user.user_metadata.name || data.user.email?.split('@')[0] || 'Usuário',
      email: data.user.email || '',
    }
  },

  async register(name: string, email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (error) throw error
    if (!data.user) throw new Error('Falha ao criar conta.')

    return {
      id: data.user.id,
      name: data.user.user_metadata.name || name,
      email: data.user.email || '',
    }
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
};
