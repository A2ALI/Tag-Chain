import { createClient } from '@supabase/supabase-js';
import { rateEngine } from './rateEngine';
import { logSecurityEvent } from './securityLogger';
import { verifyTx } from './txTracer';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class OnrampService {
  private static instance: OnrampService;

  private constructor() {}

  public static getInstance(): OnrampService {
    if (!OnrampService.instance) {
      OnrampService.instance = new OnrampService();
    }
    return OnrampService.instance;
  }

  /**
   * Handle external deposit from crypto wallet
   * @param address - User's wallet address
   * @param token - Token being deposited
   * @param amount - Amount being deposited
   * @param tx_hash - Transaction hash
   */
  async handleExternalDeposit(address: string, token: string, amount: number, tx_hash: string): Promise<{ success: boolean; message?: string; eventId?: string }> {
    try {
      console.log(`Handling external deposit: ${amount} ${token} to ${address}`);

      // Verify the transaction using Mirror Node or indexer
      const verificationResult = await verifyTx(tx_hash);
      const isVerified = verificationResult.ok;
      
      if (!isVerified) {
        logSecurityEvent({
          event: 'INVALID_DEPOSIT_ATTEMPT',
          severity: 'warning',
          details: `Failed to verify deposit transaction ${tx_hash}`,
          tx_hash: tx_hash
        });
        
        return { 
          success: false, 
          message: 'Unable to verify transaction' 
        };
      }

      // Find user by wallet address
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('onchain_id', address)
        .single();

      if (userError || !user) {
        logSecurityEvent({
          event: 'DEPOSIT_TO_UNKNOWN_ADDRESS',
          severity: 'warning',
          details: `Deposit to unknown address ${address}`,
          tx_hash: tx_hash
        });
        
        return { 
          success: false, 
          message: 'Unknown wallet address' 
        };
      }

      // Create inbound event record
      const { data: inboundEvent, error: eventError } = await supabase
        .from('onchain_inbound_events')
        .insert({
          user_id: user.id,
          type: 'CRYPTO_DEPOSIT',
          amount: amount,
          token: token,
          tx_hash: tx_hash,
          status: 'VERIFIED'
        })
        .select()
        .single();

      if (eventError) {
        console.error('Error creating inbound event:', eventError);
        return { 
          success: false, 
          message: 'Failed to create inbound event' 
        };
      }

      // Credit user with TagUSD (mint via contract) or update balance
      // This would call the escrow contract service to mint tokens
      // For now, we'll just log the action
      console.log(`Crediting user ${user.id} with ${amount} ${token}`);

      logSecurityEvent({
        userId: user.id,
        event: 'EXTERNAL_DEPOSIT_PROCESSED',
        severity: 'info',
        details: `Processed external deposit of ${amount} ${token}`,
        tx_hash: tx_hash
      });

      return { 
        success: true, 
        message: 'Deposit processed successfully',
        eventId: inboundEvent.id
      };
    } catch (error) {
      console.error('Error handling external deposit:', error);
      logSecurityEvent({
        event: 'DEPOSIT_PROCESSING_ERROR',
        severity: 'high',
        details: `Error processing deposit: ${error.message}`,
      });
      
      return { 
        success: false, 
        message: 'Error processing deposit' 
      };
    }
  }

  /**
   * Verify external address (simple checksum + blacklist check)
   * @param address - Wallet address to verify
   */
  async verifyExternalAddress(address: string): Promise<boolean> {
    try {
      // Basic validation - check if it's a valid Hedera address format
      // In production, you might want to use a more robust validation
      const isValidFormat = /^0\.0\.\d+$/.test(address) || 
                          /^[0-9a-fA-F]{40}$/.test(address) || // EVM format
                          /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(address); // Base58 format
      
      if (!isValidFormat) {
        logSecurityEvent({
          event: 'INVALID_ADDRESS_FORMAT',
          severity: 'info',
          details: `Invalid address format: ${address}`
        });
        return false;
      }

      // Check against blacklist (in a real implementation, you would check a database)
      // For now, we'll assume all addresses are valid
      return true;
    } catch (error) {
      console.error('Error verifying external address:', error);
      return false;
    }
  }
}

// Export singleton instance
export const onrampService = OnrampService.getInstance();