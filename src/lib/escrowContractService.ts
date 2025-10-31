import { Client, AccountId, PrivateKey, TokenMintTransaction, TokenBurnTransaction, TransactionReceipt, TransactionId } from '@hashgraph/sdk';
import { createClient } from '@supabase/supabase-js';
import { logSecurityEvent } from './securityLogger';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class EscrowContractService {
  private client: Client;
  private operatorId: AccountId;
  private operatorKey: PrivateKey;
  private token_id: string;

  constructor() {
    // Initialize Hedera client
    this.client = Client.forTestnet();
    
    // Set operator account
    this.operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
    this.operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!);
    this.client.setOperator(this.operatorId, this.operatorKey);
    
    // Set token ID
    this.token_id = process.env.VITE_TAGUSD_TOKEN_ID || '';
  }

  /**
   * Mint TagUSD for user after successful fiat deposit
   * @param userId - User ID
   * @param amountUSD - Amount in USD equivalent
   * @param evidence - Evidence of completed inbound event
   */
  async mintTagUSDForUser(userId: string, amountUSD: number, evidence: any): Promise<{ success: boolean; message?: string; tx_hash?: string }> {
    try {
      console.log(`Minting ${amountUSD} TAGUSD for user ${userId}`);

      // Verify evidence (inbound event completed)
      if (!evidence || evidence.status !== 'COMPLETED') {
        return { 
          success: false, 
          message: 'Invalid or incomplete evidence' 
        };
      }

      // Get user's wallet address
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('onchain_id')
        .eq('id', userId)
        .single();

      if (userError || !user || !user.onchain_id) {
        return { 
          success: false, 
          message: 'User not found or wallet not connected' 
        };
      }

      // Convert USD amount to token amount (1:1 for stablecoin)
      const tokenAmount = Math.floor(amountUSD * 100); // Assuming 2 decimal places

      // CALL: HTS mint with admin/operator signature
      const mintTx = new TokenMintTransaction()
        .setTokenId(this.token_id)
        .setAmount(tokenAmount)
        .freezeWith(this.client);

      const signTx = await mintTx.sign(this.operatorKey);
      const submitTx = await signTx.execute(this.client);
      const receipt = await submitTx.getReceipt(this.client);
      const txId = submitTx.transactionId.toString();

      if (receipt.status.toString() !== 'SUCCESS') {
        throw new Error(`Mint transaction failed with status: ${receipt.status}`);
      }

      // Record onchain_inbound_events with tx_hash
      const { error: updateError } = await supabase
        .from('onchain_inbound_events')
        .update({
          tx_hash: txId,
          status: 'MINTED'
        })
        .eq('id', evidence.id);

      if (updateError) {
        console.error('Error updating inbound event:', updateError);
        // Note: The mint transaction was successful, but we couldn't update the DB
        // This should be handled with a reconciliation process
      }

      logSecurityEvent({
        userId: userId,
        event: 'TAGUSD_MINTED',
        severity: 'info',
        details: `Minted ${tokenAmount} TAGUSD for user`,
        tx_hash: txId
      });

      return { 
        success: true, 
        message: 'Tokens minted successfully',
        tx_hash: txId
      };
    } catch (error) {
      console.error('Error minting TagUSD:', error);
      logSecurityEvent({
        userId: userId,
        event: 'MINT_ERROR',
        severity: 'high',
        details: `Error minting TagUSD: ${error.message}`
      });
      
      return { 
        success: false, 
        message: `Error minting tokens: ${error.message}` 
      };
    }
  }

  /**
   * Burn TagUSD for withdrawal
   * @param userId - User ID
   * @param amountUSD - Amount in USD equivalent
   * @param evidence - Evidence of withdrawal request
   */
  async burnTagUSDForWithdrawal(userId: string, amountUSD: number, evidence: any): Promise<{ success: boolean; message?: string; tx_hash?: string }> {
    try {
      console.log(`Burning ${amountUSD} TAGUSD for user ${userId}`);

      // Verify user balance & approval would happen here
      // For demo purposes, we'll skip this step

      // Convert USD amount to token amount (1:1 for stablecoin)
      const tokenAmount = Math.floor(amountUSD * 100); // Assuming 2 decimal places

      // CALL: HTS burn with admin/operator signature
      const burnTx = new TokenBurnTransaction()
        .setTokenId(this.token_id)
        .setAmount(tokenAmount)
        .freezeWith(this.client);

      const signTx = await burnTx.sign(this.operatorKey);
      const submitTx = await signTx.execute(this.client);
      const receipt = await submitTx.getReceipt(this.client);
      const txId = submitTx.transactionId.toString();

      if (receipt.status.toString() !== 'SUCCESS') {
        throw new Error(`Burn transaction failed with status: ${receipt.status}`);
      }

      // Record onchain_withdrawals with tx_hash
      const { error: updateError } = await supabase
        .from('onchain_withdrawals')
        .update({
          tx_hash: txId,
          status: 'BURNED'
        })
        .eq('id', evidence.id);

      if (updateError) {
        console.error('Error updating withdrawal record:', updateError);
        // Note: The burn transaction was successful, but we couldn't update the DB
        // This should be handled with a reconciliation process
      }

      logSecurityEvent({
        userId: userId,
        event: 'TAGUSD_BURNED',
        severity: 'info',
        details: `Burned ${tokenAmount} TAGUSD for user`,
        tx_hash: txId
      });

      return { 
        success: true, 
        message: 'Tokens burned successfully',
        tx_hash: txId
      };
    } catch (error) {
      console.error('Error burning TagUSD:', error);
      logSecurityEvent({
        userId: userId,
        event: 'BURN_ERROR',
        severity: 'high',
        details: `Error burning TagUSD: ${error.message}`
      });
      
      return { 
        success: false, 
        message: `Error burning tokens: ${error.message}` 
      };
    }
  }
}

// Export singleton instance
export const escrowContractService = new EscrowContractService();