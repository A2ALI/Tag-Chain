// Simulated smart contract utilities for Tag Chain escrow system

export interface EscrowContract {
  id: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  expiryDate: string; // ISO date string
  createdAt: string; // ISO date string
  status: 'active' | 'released' | 'disputed' | 'expired';
  contractHash: string; // SHA256 hash of contract terms
}

/**
 * Create a simulated escrow contract
 * @param buyerId - ID of the buyer
 * @param sellerId - ID of the seller
 * @param amount - Amount in USDC
 * @param expiryDays - Number of days until contract expires
 * @returns EscrowContract object
 */
export function createEscrowContract(
  buyerId: string,
  sellerId: string,
  amount: number,
  expiryDays: number = 7
): EscrowContract {
  const createdAt = new Date().toISOString();
  const expiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
  
  // Generate a simple hash of the contract terms
  const contractData = `${buyerId}-${sellerId}-${amount}-${createdAt}`;
  const contractHash = btoa(contractData).substring(0, 64); // Simple base64 encoding for demo
  
  return {
    id: `escrow_${Date.now()}`,
    buyerId,
    sellerId,
    amount,
    currency: 'USDC',
    expiryDate,
    createdAt,
    status: 'active',
    contractHash
  };
}

/**
 * Release funds from escrow
 * @param contract - The escrow contract
 * @param userId - ID of user attempting to release funds
 * @param userRole - Role of user attempting to release funds
 * @returns Updated contract or null if unauthorized
 */
export function releaseFunds(
  contract: EscrowContract,
  userId: string,
  userRole: string
): EscrowContract | null {
  // Check if contract is still active
  if (contract.status !== 'active') {
    console.error('Contract is not active');
    return null;
  }
  
  // Check if user is authorized to release funds
  // Admins and buyers can release funds
  const isAuthorized = userRole === 'admin' || userId === contract.buyerId;
  
  if (!isAuthorized) {
    console.error('User not authorized to release funds');
    return null;
  }
  
  // Check if contract has expired
  if (new Date() > new Date(contract.expiryDate)) {
    console.error('Contract has expired');
    return null;
  }
  
  // Update contract status
  return {
    ...contract,
    status: 'released'
  };
}

/**
 * Raise a dispute on the escrow contract
 * @param contract - The escrow contract
 * @param userId - ID of user raising dispute
 * @returns Updated contract or null if unauthorized
 */
export function raiseDispute(
  contract: EscrowContract,
  userId: string
): EscrowContract | null {
  // Check if contract is still active
  if (contract.status !== 'active') {
    console.error('Contract is not active');
    return null;
  }
  
  // Both buyer and seller can raise disputes
  const isAuthorized = userId === contract.buyerId || userId === contract.sellerId;
  
  if (!isAuthorized) {
    console.error('User not authorized to raise dispute');
    return null;
  }
  
  // Update contract status
  return {
    ...contract,
    status: 'disputed'
  };
}

/**
 * Check if contract has expired
 * @param contract - The escrow contract
 * @returns boolean indicating if contract has expired
 */
export function isContractExpired(contract: EscrowContract): boolean {
  return new Date() > new Date(contract.expiryDate) && contract.status === 'active';
}

/**
 * Expire a contract
 * @param contract - The escrow contract
 * @returns Updated contract
 */
export function expireContract(contract: EscrowContract): EscrowContract {
  return {
    ...contract,
    status: 'expired'
  };
}

export default {
  createEscrowContract,
  releaseFunds,
  raiseDispute,
  isContractExpired,
  expireContract
};