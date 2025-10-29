import React from 'react';
import { useWallet } from '../hooks/useWallet';

const ConnectWalletButton: React.FC = () => {
  const {
    linkedAddress,
    isConnected,
    providerName,
    loading,
    error,
    connect,
    disconnect,
    maskAddress
  } = useWallet();

  const handleConnect = async (provider: 'hashpack' | 'blade' | 'walletconnect') => {
    const result = await connect(provider);
    if (!result.success) {
      console.error('Failed to connect:', result.error);
    }
  };

  const handleDisconnect = async () => {
    const result = await disconnect();
    if (!result.success) {
      console.error('Failed to disconnect:', result.error);
    }
  };

  // Generate HashScan link
  const getHashScanLink = (address: string | null) => {
    if (!address) return '#';
    return `https://hashscan.io/testnet/account/${address}`;
  };

  return (
    <div className="wallet-connect-container">
      <div className="wallet-section">
        <h3>Wallet Connection</h3>
        
        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}
        
        {isConnected ? (
          <div className="wallet-connected">
            <div className="wallet-info">
              <span className="wallet-address">
                Connected: {maskAddress(linkedAddress)} 
                <a 
                  href={getHashScanLink(linkedAddress)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hashscan-link"
                >
                  (View on HashScan)
                </a>
              </span>
              <span className="wallet-provider">
                Provider: {providerName}
              </span>
            </div>
            <button 
              onClick={handleDisconnect}
              disabled={loading}
              className="disconnect-button"
            >
              {loading ? 'Disconnecting...' : 'Disconnect Wallet'}
            </button>
          </div>
        ) : (
          <div className="wallet-disconnected">
            <p>No wallet connected</p>
            <div className="connect-buttons">
              <button 
                onClick={() => handleConnect('hashpack')}
                disabled={loading}
                className="connect-button hashpack"
              >
                {loading ? 'Connecting...' : 'Connect HashPack'}
              </button>
              <button 
                onClick={() => handleConnect('blade')}
                disabled={loading}
                className="connect-button blade"
              >
                {loading ? 'Connecting...' : 'Connect Blade'}
              </button>
              <button 
                onClick={() => handleConnect('walletconnect')}
                disabled={loading}
                className="connect-button walletconnect"
              >
                {loading ? 'Connecting...' : 'Connect WalletConnect'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .wallet-connect-container {
          padding: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        
        .wallet-section h3 {
          margin-top: 0;
          color: #1a202c;
        }
        
        .error-message {
          color: #e53e3e;
          background-color: #fed7d7;
          padding: 0.5rem;
          border-radius: 0.25rem;
          margin-bottom: 1rem;
        }
        
        .wallet-connected {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .wallet-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .wallet-address {
          font-weight: 500;
        }
        
        .hashscan-link {
          margin-left: 0.5rem;
          color: #4299e1;
          text-decoration: none;
          font-size: 0.875rem;
        }
        
        .hashscan-link:hover {
          text-decoration: underline;
        }
        
        .wallet-provider {
          font-size: 0.875rem;
          color: #718096;
        }
        
        .disconnect-button {
          padding: 0.5rem 1rem;
          background-color: #e53e3e;
          color: white;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-weight: 500;
        }
        
        .disconnect-button:hover:not(:disabled) {
          background-color: #c53030;
        }
        
        .disconnect-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .wallet-disconnected {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .connect-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .connect-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-weight: 500;
          color: white;
        }
        
        .connect-button:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        .connect-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .hashpack {
          background-color: #8b5cf6;
        }
        
        .blade {
          background-color: #0ea5e9;
        }
        
        .walletconnect {
          background-color: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default ConnectWalletButton;