import { supabase } from './supabaseClient';

/**
 * Service to handle wallet-related operations
 */
export class WalletService {
  /**
   * Update user's wallet address in the database
   * @param userId - The user's ID
   * @param walletAddress - The Hedera account ID
   * @returns Success status and any error message
   */
  static async updateUserWalletAddress(userId: string, walletAddress: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          wallet_address: walletAddress
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user wallet address:', error);
        return { success: false, error: error.message };
      }

      return { success: true, walletAddress };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's wallet address from the database
   * @param userId - The user's ID
   * @returns Wallet address or null if not found
   */
  static async getUserWalletAddress(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('wallet_address')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user wallet address:', error);
        return null;
      }

      return data.wallet_address;
    } catch (error) {
      console.error('Error fetching user wallet address:', error);
      return null;
    }
  }

  /**
   * Check if user has a wallet address
   * @param userId - The user's ID
   * @returns Boolean indicating if user has a wallet address
   */
  static async userHasWallet(userId: string) {
    const walletAddress = await this.getUserWalletAddress(userId);
    return !!walletAddress;
  }
}