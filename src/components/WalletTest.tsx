import React from 'react';
import ConnectWalletButton from './ConnectWalletButton';
import { useWallet } from '../hooks/useWallet';

const WalletTest: React.FC = () => {
  const { linkedAddress, isConnected, providerName, loading, error } = useWallet();

  return (
    <div className="wallet-test-container">
      <h2>Wallet Connection Test</h2>
      <p>This is a development test page for wallet connection functionality.</p>
      
      <div className="wallet-status">
        <h3>Current Wallet Status</h3>
        <div className="status-info">
          <p><strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}</p>
          {isConnected && (
            <>
              <p><strong>Address:</strong> {linkedAddress || 'N/A'}</p>
              <p><strong>Provider:</strong> {providerName || 'N/A'}</p>
            </>
          )}
          {loading && <p><strong>Status:</strong> Loading...</p>}
          {error && <p><strong>Error:</strong> {error}</p>}
        </div>
      </div>
      
      <ConnectWalletButton />
      
      <style>{`
        .wallet-test-container {
          max-width: 800px;
          margin: 2rem auto;
          padding: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
        }
        
        .wallet-status {
          margin-bottom: 2rem;
          padding: 1rem;
          background-color: #f7fafc;
          border-radius: 0.5rem;
        }
        
        .status-info p {
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
};

export default WalletTest;