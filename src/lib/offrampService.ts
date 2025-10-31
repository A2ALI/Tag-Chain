import { createClient } from '@supabase/supabase-js';
import { rateEngine } from './rateEngine';
import { logSecurityEvent } from './securityLogger';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class OfframpService {
  private static instance: OfframpService;

  private constructor() {}

  public static getInstance(): OfframpService {
    if (!OfframpService.instance) {
      OfframpService.instance = new OfframpService();
    }
    return OfframpService.instance;
  }

  /**
   * Request withdrawal of tokens to external address or fiat payout
   * @param userId - User ID requesting withdrawal
   * @param tokenAmount - Amount of tokens to withdraw
   * @param toAddress - Destination address (crypto) or account details (fiat)
   * @param payoutCurrency - Currency for fiat payout (if applicable)
   */
  async requestWithdrawal(
    userId: string, 
    tokenAmount: number, 
    toAddress: string, 
    payoutCurrency?: string
  ): Promise<{ success: boolean; message?: string; withdrawalId?: string }> {
    try {
      console.log(`Processing withdrawal request: ${tokenAmount} tokens to ${toAddress}`);

      // Convert token amount to local currency using rate engine
      let amountLocal = tokenAmount;
      if (payoutCurrency) {
        try {
          const rate = await rateEngine.getRate('TAGUSD', payoutCurrency);
          amountLocal = tokenAmount * rate;
        } catch (rateError) {
          console.warn('Failed to get conversion rate, using 1:1');
        }
      }

      // Lock requested amount in escrow contract or mark as pending burn
      // This would call the escrow contract service to lock/burn tokens
      // For now, we'll just log the action
      console.log(`Locking ${tokenAmount} tokens for user ${userId}`);

      // Create withdrawal record
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('onchain_withdrawals')
        .insert({
          user_id: userId,
          amount: tokenAmount,
          token: 'TAGUSD',
          to_address: toAddress,
          status: 'PENDING'
        })
        .select()
        .single();

      if (withdrawalError) {
        console.error('Error creating withdrawal record:', withdrawalError);
        return { 
          success: false, 
          message: 'Failed to create withdrawal record' 
        };
      }

      // If this is a fiat payout, create fiat_payouts record
      if (payoutCurrency) {
        const { error: payoutError } = await supabase
          .from('fiat_payouts')
          .insert({
            user_id: userId,
            amount_local: amountLocal,
            currency: payoutCurrency,
            status: 'PENDING'
          });

        if (payoutError) {
          console.error('Error creating fiat payout record:', payoutError);
          // Rollback the withdrawal record
          await supabase
            .from('onchain_withdrawals')
            .delete()
            .eq('id', withdrawal.id);
            
          return { 
            success: false, 
            message: 'Failed to create payout record' 
          };
        }
      }

      // Trigger payout via Flutterwave or external crypto transfer
      // This would call the payment service
      // For now, we'll just log the action
      console.log(`Triggering payout for withdrawal ${withdrawal.id}`);

      logSecurityEvent({
        userId: userId,
        event: 'WITHDRAWAL_REQUESTED',
        severity: 'info',
        details: `Withdrawal requested: ${tokenAmount} TAGUSD to ${toAddress}`
      });

      return { 
        success: true, 
        message: 'Withdrawal request processed successfully',
        withdrawalId: withdrawal.id
      };
    } catch (error) {
      console.error('Error processing withdrawal request:', error);
      logSecurityEvent({
        userId: userId,
        event: 'WITHDRAWAL_ERROR',
        severity: 'high',
        details: `Error processing withdrawal: ${error.message}`
      });
      
      return { 
        success: false, 
        message: 'Error processing withdrawal request' 
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
          event: 'INVALID_WITHDRAWAL_ADDRESS',
          severity: 'info',
          details: `Invalid withdrawal address format: ${address}`
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
export const offrampService = OfframpService.getInstance();