import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabaseClient';

// Dynamically import HashConnect only when needed to avoid issues in SSR
let HashConnect: any = null;
let BladeSDK: any = null;

// Initialize HashConnect SDK
const initHashConnect = async () => {
  if (!HashConnect) {
    try {
      const hashconnectModule = await import('hashconnect');
      HashConnect = hashconnectModule.HashConnect;
    } catch (error) {
      console.error('Failed to load HashConnect SDK:', error);
      throw new Error('HashPack wallet is not available');
    }
  }
  return HashConnect;
};

// Initialize Blade SDK
const initBlade = async () => {
  if (!BladeSDK) {
    try {
      const bladeModule = await import('@bladelabs/blade-web3.js');
      BladeSDK = bladeModule.Blade;
    } catch (error) {
      console.error('Failed to load Blade SDK:', error);
      throw new Error('Blade wallet is not available');
    }
  }
  return BladeSDK;
};

export const useWallet = () => {
  const { user } = useAuth();
  const [linkedAddress, setLinkedAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [providerName, setProviderName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has a linked wallet on mount
  useEffect(() => {
    if (user?.id) {
      console.log('Supabase user:', user);
      console.log('Headers check:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Key found' : 'Key missing');
      fetchLinkedWallet();
    }
  }, [user]);

  // Fetch linked wallet from backend
  const fetchLinkedWallet = async () => {
    // Only call fetch functions after confirming user?.id exists
    if (!user?.id) {
      console.log('No user ID found, skipping wallet fetch');
      return;
    }
    
    try {
      // Fetch user data directly from Supabase
      const { data: userData, error } = await supabase
        .from('users')
        .select('wallet_address, wallet_type')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Failed to fetch linked wallet:', error);
        return;
      }
      
      try {
        
        if (userData && userData.wallet_address) {
          setLinkedAddress(userData.wallet_address);
          setProviderName(userData.wallet_type || null);
          setIsConnected(true);
        } else {
          setLinkedAddress(null);
          setProviderName(null);
          setIsConnected(false);
        }
      } catch (jsonError) {
        console.error('Error parsing linked wallet JSON:', jsonError);
        setError('Failed to parse wallet information');
      }
    } catch (err) {
      console.error('Error fetching linked wallet:', err);
      setError('Failed to fetch wallet information');
    }
  };

  // Connect wallet
  const connect = async (provider: 'hashpack' | 'blade' | 'walletconnect') => {
    // Only call fetch functions after confirming user?.id exists
    if (!user?.id) {
      console.log('No user ID found, skipping wallet connect');
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let account: string | null = null;

      // Feature flag check
      if (process.env.FEATURE_WALLET_CONNECT !== 'true') {
        throw new Error('Wallet connect feature is not enabled');
      }

      // Connect based on provider
      switch (provider) {
        case 'hashpack':
          // Use real HashConnect SDK
          try {
            const HashConnectClass = await initHashConnect();
            const hashconnect = new HashConnectClass();
            
            // Initialize HashConnect
            await hashconnect.init({
              name: process.env.HASHCONNECT_APP_METADATA_NAME || 'TagChain',
              description: process.env.HASHCONNECT_APP_METADATA_DESCRIPTION || 'TagChain Web DApp',
              url: process.env.HASHCONNECT_APP_METADATA_URL || 'https://tagchain.app',
              icon: process.env.HASHCONNECT_APP_METADATA_ICON || 'https://tagchain.app/icon.png'
            });
            
            // Connect to wallet
            const accounts = await hashconnect.connect();
            if (accounts && accounts.length > 0) {
              account = accounts[0];
            }
          } catch (hashpackError) {
            console.error('Error connecting with HashPack:', hashpackError);
            throw new Error('Failed to connect with HashPack wallet');
          }
          break;
          
        case 'blade':
          // Use real Blade SDK
          try {
            const BladeClass = await initBlade();
            const blade = new BladeClass();
            
            // Initialize Blade
            await blade.init();
            
            // Connect to wallet
            const bladeResult = await blade.connect();
            if (bladeResult && bladeResult.accounts && bladeResult.accounts.length > 0) {
              account = bladeResult.accounts[0];
            }
          } catch (bladeError) {
            console.error('Error connecting with Blade:', bladeError);
            throw new Error('Failed to connect with Blade wallet');
          }
          break;
          
        case 'walletconnect':
          // WalletConnect implementation would go here
          throw new Error('WalletConnect not yet implemented');
          
        default:
          throw new Error('Invalid provider');
      }

      if (!account) {
        throw new Error('Failed to connect wallet');
      }

      // Validate account format
      const hederaAccountRegex = /^0\.0\.\d+$/;
      if (!hederaAccountRegex.test(account)) {
        throw new Error('Invalid account format');
      }

      // Update user wallet information in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          wallet_address: account,
          wallet_type: provider
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to link wallet:', updateError);
        throw new Error('Failed to link wallet');
      }

      // Update state
      setLinkedAddress(account);
      setProviderName(provider);
      setIsConnected(true);

      // Store in localStorage for persistence
      localStorage.setItem('wallet-connected', 'true');
      localStorage.setItem('wallet-provider', provider);
      localStorage.setItem('wallet-address', account);

      return { success: true, account };
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    // Only call fetch functions after confirming user?.id exists
    if (!user?.id) {
      console.log('No user ID found, skipping wallet disconnect');
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update user wallet information in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          wallet_address: null,
          wallet_type: null
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to disconnect wallet:', updateError);
        throw new Error('Failed to disconnect wallet');
      }

      // Update state
      setLinkedAddress(null);
      setProviderName(null);
      setIsConnected(false);

      // Remove from localStorage
      localStorage.removeItem('wallet-connected');
      localStorage.removeItem('wallet-provider');
      localStorage.removeItem('wallet-address');

      return { success: true };
    } catch (err: any) {
      console.error('Error disconnecting wallet:', err);
      setError(err.message || 'Failed to disconnect wallet');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Mask wallet address for display
  const maskAddress = (address: string | null) => {
    if (!address) return '';
    if (address.length <= 8) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return {
    linkedAddress,
    isConnected,
    providerName,
    loading,
    error,
    connect,
    disconnect,
    fetchLinkedWallet,
    maskAddress
  };
};