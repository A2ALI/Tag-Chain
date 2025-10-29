/**
 * Transaction tracer utility for Hedera transactions
 */

/**
 * Generate a HashScan URL for a transaction hash
 * @param txHash - The transaction hash
 * @param network - The Hedera network (default: 'testnet')
 * @returns The HashScan URL
 */
export function getHashScanUrl(txHash: string, network: string = 'testnet'): string {
  if (!txHash) return '';
  
  // Validate transaction hash format
  const validTxHash = txHash.replace(/^0x/, ''); // Remove 0x prefix if present
  
  return `https://hashscan.io/${network}/transaction/${validTxHash}`;
}

/**
 * Generate a HashScan URL for an account ID
 * @param accountId - The account ID
 * @param network - The Hedera network (default: 'testnet')
 * @returns The HashScan URL
 */
export function getAccountHashScanUrl(accountId: string, network: string = 'testnet'): string {
  if (!accountId) return '';
  
  // Validate account ID format (0.0.x)
  const hederaAccountRegex = /^0\.0\.\d+$/;
  if (!hederaAccountRegex.test(accountId)) {
    console.warn('Invalid Hedera account ID format:', accountId);
    return '';
  }
  
  return `https://hashscan.io/${network}/account/${accountId}`;
}

/**
 * Generate a Mirror Node API URL for a transaction
 * @param txHash - The transaction hash
 * @param network - The Hedera network (default: 'testnet')
 * @returns The Mirror Node API URL
 */
export function getMirrorNodeTxUrl(txHash: string, network: string = 'testnet'): string {
  if (!txHash) return '';
  
  const baseUrl = network === 'mainnet' 
    ? 'https://mainnet.mirrornode.hedera.com'
    : 'https://testnet.mirrornode.hedera.com';
    
  const validTxHash = txHash.replace(/^0x/, ''); // Remove 0x prefix if present
  
  return `${baseUrl}/api/v1/transactions/${validTxHash}`;
}

/**
 * Generate a Mirror Node API URL for an account
 * @param accountId - The account ID
 * @param network - The Hedera network (default: 'testnet')
 * @returns The Mirror Node API URL
 */
export function getMirrorNodeAccountUrl(accountId: string, network: string = 'testnet'): string {
  if (!accountId) return '';
  
  // Validate account ID format (0.0.x)
  const hederaAccountRegex = /^0\.0\.\d+$/;
  if (!hederaAccountRegex.test(accountId)) {
    console.warn('Invalid Hedera account ID format:', accountId);
    return '';
  }
  
  const baseUrl = network === 'mainnet' 
    ? 'https://mainnet.mirrornode.hedera.com'
    : 'https://testnet.mirrornode.hedera.com';
    
  return `${baseUrl}/api/v1/accounts/${accountId}`;
}

/**
 * Verify a transaction by checking if it exists in Mirror Node
 * @param txHash - The transaction hash
 * @param network - The Hedera network (default: 'testnet')
 * @returns Verification result with proof URL and details
 */
export async function verifyTx(txHash: string, network: string = 'testnet'): Promise<{
  ok: boolean;
  proofUrl?: string;
  details?: any;
  error?: string;
}> {
  try {
    if (!txHash) {
      return { ok: false, error: 'Transaction hash is required' };
    }
    
    const mirrorNodeUrl = getMirrorNodeTxUrl(txHash, network);
    
    const response = await fetch(mirrorNodeUrl);
    
    if (!response.ok) {
      if (response.status === 404) {
        return { 
          ok: false, 
          error: 'Transaction not found',
          proofUrl: getHashScanUrl(txHash, network)
        };
      }
      throw new Error(`Mirror Node API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if transaction data exists
    if (!data || !data.transactions || data.transactions.length === 0) {
      return { 
        ok: false, 
        error: 'Transaction not found in Mirror Node',
        proofUrl: getHashScanUrl(txHash, network)
      };
    }
    
    // Return verification result
    return {
      ok: true,
      proofUrl: getHashScanUrl(txHash, network),
      details: data.transactions[0]
    };
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return { 
      ok: false, 
      error: error.message,
      proofUrl: getHashScanUrl(txHash, network)
    };
  }
}

/**
 * Mask a wallet address for display (show first 6 and last 4 characters)
 * @param address - The wallet address
 * @returns The masked address
 */
export function maskAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Validate a Hedera account ID format
 * @param accountId - The account ID to validate
 * @returns Whether the account ID is valid
 */
export function isValidHederaAccountId(accountId: string): boolean {
  if (!accountId) return false;
  const hederaAccountRegex = /^0\.0\.\d+$/;
  return hederaAccountRegex.test(accountId);
}