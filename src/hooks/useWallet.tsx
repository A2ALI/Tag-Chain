import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

// Mock HashConnect for now - we'll replace this with the actual implementation
const mockHashConnect = {
  init: async () => {
    console.log('Initializing HashConnect (mock)');
    return {
      pairingString: 'mock-pairing-string',
      hc: { topic: 'mock-topic' }
    };
  },
  connect: async (pairingString: string) => {
    console.log('Connecting with HashConnect (mock)');
    return ['0.0.1234567']; // Mock account ID
  }
};

// Mock Blade SDK for now - we'll replace this with the actual implementation
const mockBlade = {
  init: async () => {
    console.log('Initializing Blade (mock)');
    return true;
  },
  connect: async () => {
    console.log('Connecting with Blade (mock)');
    return { accounts: ['0.0.2345678'] }; // Mock account ID
  }
};

// Mock WalletConnect for now - we'll replace this with the actual implementation
const mockWalletConnect = {
  init: async () => {
    console.log('Initializing WalletConnect (mock)');
    return {
      uri: 'mock-uri',
      connector: { connected: true }
    };
  },
  connect: async () => {
    console.log('Connecting with WalletConnect (mock)');
    return ['0.0.3456789']; // Mock account ID
  }
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
    if (user) {
      fetchLinkedWallet();
    }
  }, [user]);

  // Fetch linked wallet from backend
  const fetchLinkedWallet = async () => {
    try {
      const response = await fetch('/api/wallet/get-linked-wallet', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.linked) {
        setLinkedAddress(data.wallet.onchain_address);
        setProviderName(data.wallet.wallet_type);
        setIsConnected(true);
      } else {
        setLinkedAddress(null);
        setProviderName(null);
        setIsConnected(false);
      }
    } catch (err) {
      console.error('Error fetching linked wallet:', err);
      setError('Failed to fetch wallet information');
    }
  };

  // Connect wallet
  const connect = async (provider: 'hashpack' | 'blade' | 'walletconnect') => {
    if (!user) {
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
          // In a real implementation, we would use the actual HashConnect SDK
          // const hashconnect = await mockHashConnect.init();
          // const accounts = await mockHashConnect.connect(hashconnect.pairingString);
          // account = accounts[0];
          
          // For now, using mock
          account = '0.0.1234567';
          break;
          
        case 'blade':
          // In a real implementation, we would use the actual Blade SDK
          // await mockBlade.init();
          // const bladeResult = await mockBlade.connect();
          // account = bladeResult.accounts[0];
          
          // For now, using mock
          account = '0.0.2345678';
          break;
          
        case 'walletconnect':
          // In a real implementation, we would use the actual WalletConnect SDK
          // const wc = await mockWalletConnect.init();
          // const accounts = await mockWalletConnect.connect();
          // account = accounts[0];
          
          // For now, using mock
          account = '0.0.3456789';
          break;
          
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

      // Call backend API to link wallet
      const response = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          provider,
          account
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to link wallet');
      }

      // Update state
      setLinkedAddress(data.user.onchain_address);
      setProviderName(data.user.wallet_type);
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
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call backend API to unlink wallet
      const response = await fetch('/api/wallet/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to unlink wallet');
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