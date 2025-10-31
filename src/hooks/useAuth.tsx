import { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User as SupabaseUser } from '@supabase/auth-js';

// Define types
interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string;
  country: string;
  currency: string;
  wallet_address: string;
  on_chain_id: string;
  created_at: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<any>;
  // Add wallet connection functions to auth context
  connectWallet: (walletAddress: string) => Promise<any>;
}

// Create Supabase client with proper configuration
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('Headers check:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Key found' : 'Key missing');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (session?.user) {
          console.log('Supabase user:', session.user);
          // Fetch additional user data from our users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (!userError && userData) {
            setUser(userData as AppUser);
          } else {
            // Fallback to session user data with type conversion
            const convertedUser: AppUser = {
              id: session.user.id,
              email: session.user.email || '',
              full_name: '',
              role: '',
              phone: '',
              country: '',
              currency: 'USD',
              wallet_address: '',
              on_chain_id: '',
              created_at: new Date().toISOString()
            };
            setUser(convertedUser);
          }
        }
        else {
          const { data: userData, error: userError } = await supabase.auth.getUser()
          if (userError) throw userError
          if (userData?.user) {
            console.log('Supabase session user:', userData.user);
            // Fetch additional user data from our users table
            const { data: dbUserData, error: dbUserError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userData.user.id)
              .single();
              
            if (!dbUserError && dbUserData) {
              setUser(dbUserData as AppUser);
            } else {
              // Fallback to auth user data with type conversion
              const convertedUser: AppUser = {
                id: userData.user.id,
                email: userData.user.email || '',
                full_name: '',
                role: '',
                phone: '',
                country: '',
                currency: 'USD',
                wallet_address: '',
                on_chain_id: '',
                created_at: new Date().toISOString()
              };
              setUser(convertedUser);
            }
          }
          else throw new Error('No active session found')
        }
      } catch (err: any) {
        console.error('Error fetching user:', err.message || err)
        setUser(null);
      } finally {
        setLoading(false)
      }
    }

    loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        console.log('Auth state changed, user:', session.user);
        // Fetch additional user data from our users table
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: userData, error: userError }) => {
            if (!userError && userData) {
              setUser(userData as AppUser);
            } else {
              // Fallback to session user data with type conversion
              const convertedUser: AppUser = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: '',
                role: '',
                phone: '',
                country: '',
                currency: 'USD',
                wallet_address: '',
                on_chain_id: '',
                created_at: new Date().toISOString()
              };
              setUser(convertedUser);
            }
          });
      }
      else setUser(null)
      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });

    if (data?.user && !error) {
      // Insert user into users table
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            phone: userData.phone,
            country: userData.country,
            currency: userData.currency || 'USD'
            // wallet_address will be added when user connects wallet
            // on_chain_id will be generated when user connects to blockchain
          }
        ]);

      if (insertError) {
        console.error('Error inserting user:', insertError);
      }
    }

    return { data, error };
  };

  // Connect wallet to user account
  const connectWallet = async (walletAddress: string) => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      // Update user with wallet address
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          wallet_address: walletAddress
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user with wallet address:', updateError);
        return { success: false, error: updateError.message };
      }

      // Update local user state
      setUser({
        ...user,
        wallet_address: walletAddress
      });

      return { success: true, walletAddress };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    signUp,
    connectWallet
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}