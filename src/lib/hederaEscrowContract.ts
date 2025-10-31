/// <reference types="vite/client" />

/**
 * Deploy the escrow smart contract to Hedera
 * @returns Promise<string> - The contract ID
 */
export async function deployEscrowContract(): Promise<string> {
  // Skip escrow contract deployment if FEATURE_ONCHAIN is not enabled
  if (import.meta.env.FEATURE_ONCHAIN !== 'true') {
    console.log('FEATURE_ONCHAIN is disabled, skipping escrow contract deployment');
    // Return a mock contract ID for development
    return '0.0.0000000';
  }
  
  try {
    // Call server-side function to deploy escrow contract
    const response = await fetch('/.netlify/functions/api/escrow/deploy-contract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractName: "Tag Chain Escrow"
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to deploy escrow contract');
    }

    const result = await response.json();
    return result.contractId;
  } catch (error) {
    console.error("Error deploying escrow contract:", error);
    throw error;
  }
}

/**
 * Send payment to escrow
 * @param buyerAccountId - The account ID of the buyer
 * @param sellerAccountId - The account ID of the seller
 * @param amount - The amount to escrow
 * @returns Promise<string> - The transaction ID
 */
export async function sendEscrowPayment(buyerAccountId: string, sellerAccountId: string, amount: number): Promise<string> {
  // Skip escrow payment if FEATURE_ONCHAIN is not enabled
  if (import.meta.env.FEATURE_ONCHAIN !== 'true') {
    console.log('FEATURE_ONCHAIN is disabled, skipping escrow payment');
    // Return a mock transaction ID for development
    return '0.0.0000000@0000000000';
  }
  
  try {
    // Call server-side function to send escrow payment
    const response = await fetch('/.netlify/functions/api/escrow/send-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buyerAccountId,
        sellerAccountId,
        amount
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send escrow payment');
    }

    const result = await response.json();
    return result.txId;
  } catch (error) {
    console.error("Error sending escrow payment:", error);
    throw error;
  }
}

/**
 * Release escrow payment to seller
 * @param escrowId - The ID of the escrow transaction
 * @returns Promise<string> - The transaction ID
 */
export async function releaseEscrowPayment(escrowId: string): Promise<string> {
  // Skip escrow payment release if FEATURE_ONCHAIN is not enabled
  if (import.meta.env.FEATURE_ONCHAIN !== 'true') {
    console.log('FEATURE_ONCHAIN is disabled, skipping escrow payment release');
    // Return a mock transaction ID for development
    return '0.0.0000000@0000000000';
  }
  
  try {
    // Call server-side function to release escrow payment
    const response = await fetch('/.netlify/functions/api/escrow/release-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        escrowId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to release escrow payment');
    }

    const result = await response.json();
    return result.txId;
  } catch (error) {
    console.error("Error releasing escrow payment:", error);
    throw error;
  }
}

/**
 * Get escrow details
 * @param escrowId - The ID of the escrow transaction
 * @returns Promise<any> - The escrow details
 */
export async function getEscrowDetails(escrowId: string): Promise<any> {
  // Skip escrow details retrieval if FEATURE_ONCHAIN is not enabled
  if (import.meta.env.FEATURE_ONCHAIN !== 'true') {
    console.log('FEATURE_ONCHAIN is disabled, skipping escrow details retrieval');
    // Return mock escrow details for development
    return {
      id: escrowId,
      status: 'completed',
      amount: 100,
      currency: 'TUSD',
      buyer: '0.0.0000001',
      seller: '0.0.0000002',
      created_at: new Date().toISOString()
    };
  }
  
  try {
    // Call server-side function to get escrow details
    const response = await fetch('/.netlify/functions/api/escrow/get-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        escrowId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get escrow details');
    }

    const result = await response.json();
    return result.details;
  } catch (error) {
    console.error("Error getting escrow details:", error);
    throw error;
  }
}