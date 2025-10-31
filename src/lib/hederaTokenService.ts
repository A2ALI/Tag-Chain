/// <reference types="vite/client" />

/**
 * Create a new fungible token (TagUSD) on Hedera
 * @returns Promise<string> - The token ID of the newly created token
 */
export async function createToken(): Promise<string> {
  // Skip token creation if FEATURE_ONCHAIN is not enabled
  if (import.meta.env.FEATURE_ONCHAIN !== 'true') {
    console.log('FEATURE_ONCHAIN is disabled, skipping token creation');
    // Return a mock token ID for development
    return '0.0.0000000';
  }
  
  try {
    // Call server-side function to create token
    const response = await fetch('/.netlify/functions/api/tokens/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenName: "TagUSD",
        tokenSymbol: "TUSD",
        decimals: 2,
        initialSupply: 0
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create token');
    }

    const result = await response.json();
    return result.tokenId;
  } catch (error) {
    console.error("Error creating token:", error);
    throw error;
  }
}

/**
 * Mint new tokens
 * @param tokenId - The ID of the token to mint
 * @param amount - The amount of tokens to mint
 * @returns Promise<string> - The transaction ID
 */
export async function mintToken(tokenId: string, amount: number): Promise<string> {
  // Skip token minting if FEATURE_ONCHAIN is not enabled
  if (import.meta.env.FEATURE_ONCHAIN !== 'true') {
    console.log('FEATURE_ONCHAIN is disabled, skipping token minting');
    // Return a mock transaction ID for development
    return '0.0.0000000@0000000000';
  }
  
  try {
    // Call server-side function to mint tokens
    const response = await fetch('/.netlify/functions/api/tokens/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenId,
        amount
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to mint tokens');
    }

    const result = await response.json();
    return result.txId;
  } catch (error) {
    console.error("Error minting tokens:", error);
    throw error;
  }
}

/**
 * Burn tokens
 * @param tokenId - The ID of the token to burn
 * @param amount - The amount of tokens to burn
 * @returns Promise<string> - The transaction ID
 */
export async function burnToken(tokenId: string, amount: number): Promise<string> {
  // Skip token burning if FEATURE_ONCHAIN is not enabled
  if (import.meta.env.FEATURE_ONCHAIN !== 'true') {
    console.log('FEATURE_ONCHAIN is disabled, skipping token burning');
    // Return a mock transaction ID for development
    return '0.0.0000000@0000000000';
  }
  
  try {
    // Call server-side function to burn tokens
    const response = await fetch('/.netlify/functions/api/tokens/burn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenId,
        amount
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to burn tokens');
    }

    const result = await response.json();
    return result.txId;
  } catch (error) {
    console.error("Error burning tokens:", error);
    throw error;
  }
}

/**
 * Transfer tokens between accounts
 * @param tokenId - The ID of the token to transfer
 * @param toAccountId - The account ID to transfer tokens to
 * @param amount - The amount of tokens to transfer
 * @returns Promise<string> - The transaction ID
 */
export async function transferToken(tokenId: string, toAccountId: string, amount: number): Promise<string> {
  // Skip token transfer if FEATURE_ONCHAIN is not enabled
  if (import.meta.env.FEATURE_ONCHAIN !== 'true') {
    console.log('FEATURE_ONCHAIN is disabled, skipping token transfer');
    // Return a mock transaction ID for development
    return '0.0.0000000@0000000000';
  }
  
  try {
    // Call server-side function to transfer tokens
    const response = await fetch('/.netlify/functions/api/tokens/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenId,
        toAccountId,
        amount
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to transfer tokens');
    }

    const result = await response.json();
    return result.txId;
  } catch (error) {
    console.error("Error transferring tokens:", error);
    throw error;
  }
}

/**
 * Associate an account with a token
 * @param accountId - The account ID to associate with the token
 * @param tokenId - The token ID to associate with the account
 * @returns Promise<string> - The transaction ID
 */
export async function associateToken(accountId: string, tokenId: string): Promise<string> {
  // Skip token association if FEATURE_ONCHAIN is not enabled
  if (import.meta.env.FEATURE_ONCHAIN !== 'true') {
    console.log('FEATURE_ONCHAIN is disabled, skipping token association');
    // Return a mock transaction ID for development
    return '0.0.0000000@0000000000';
  }
  
  try {
    // Call server-side function to associate token
    const response = await fetch('/.netlify/functions/api/tokens/associate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
        tokenId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to associate token');
    }

    const result = await response.json();
    return result.txId;
  } catch (error) {
    console.error("Error associating token:", error);
    throw error;
  }
}

/**
 * Safely transfer TagUSD tokens with association handling
 * @param sender - The account ID to transfer from
 * @param receiver - The account ID to transfer to
 * @param amount - The amount of tokens to transfer
 * @returns Promise<string> - The transaction ID
 */
export async function safeTransferTagUSD(sender: string, receiver: string, amount: number): Promise<string> {
  // Skip safe transfer if FEATURE_ONCHAIN is not enabled
  if (import.meta.env.FEATURE_ONCHAIN !== 'true') {
    console.log('FEATURE_ONCHAIN is disabled, skipping safe token transfer');
    // Return a mock transaction ID for development
    return '0.0.0000000@0000000000';
  }
  
  try {
    const tokenId = import.meta.env.VITE_TAGUSD_TOKEN_ID;
    
    // First, check if receiver is associated with the token
    // In a real implementation, you would check this via Hedera queries
    // For now, we'll attempt the transfer and handle association errors
    
    try {
      // Attempt direct transfer via server-side function
      const response = await fetch('/.netlify/functions/api/tokens/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId,
          amount,
          sender,
          receiver
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transfer tokens');
      }

      const result = await response.json();
      return result.txId;
    } catch (transferError: any) {
      // If transfer fails, check if it's due to token association
      if (transferError.message.includes('TOKEN_NOT_ASSOCIATED')) {
        console.log(`Receiver ${receiver} not associated with token ${tokenId}, associating...`);
        
        // Associate receiver with token via server-side function
        const assocResponse = await fetch('/.netlify/functions/api/tokens/associate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId: receiver,
            tokenId
          }),
        });

        if (!assocResponse.ok) {
          const errorData = await assocResponse.json();
          throw new Error(errorData.error || 'Failed to associate token');
        }
        
        // Retry transfer
        const retryResponse = await fetch('/.netlify/functions/api/tokens/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokenId,
            amount,
            sender,
            receiver
          }),
        });

        if (!retryResponse.ok) {
          const errorData = await retryResponse.json();
          throw new Error(errorData.error || 'Failed to transfer tokens after association');
        }

        const retryResult = await retryResponse.json();
        return retryResult.txId;
      } else {
        // Re-throw if it's a different error
        throw transferError;
      }
    }
  } catch (error) {
    console.error("Error in safeTransferTagUSD:", error);
    throw error;
  }
}