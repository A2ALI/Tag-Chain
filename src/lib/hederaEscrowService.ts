import { v4 as uuidv4 } from "uuid";
import { supabase } from "./supabaseClient";
import { safeTransferTagUSD } from "./hederaTokenService";
import { submitHCSMessage } from "./hederaClient";

const topicId = import.meta.env.VITE_HEDERA_TOPIC_ESCROW!;

// Create escrow record and submit HCS message
export async function createEscrowRecord(transactionId: string, buyerId: string, sellerId: string, amount: number) {
  try {
    // Create HCS message for escrow creation
    const message = {
      type: "escrow.create",
      version: "1.0",
      escrow_id: `escrow-${uuidv4()}`,
      transaction_id: transactionId,
      buyer_on_chain_id: `TAGCHAIN:USER:${buyerId}`,
      seller_on_chain_id: `TAGCHAIN:USER:${sellerId}`,
      amount: amount.toString(),
      currency: "TAGUSD",
      status: "initiated",
      timestamp: new Date().toISOString()
    };

    // Submit message to HCS topic and update database
    const txId = await submitHCSMessage(
      topicId,
      message,
      'transactions',
      transactionId
    );

    console.log(`Escrow record created and HCS message submitted: ${txId}`);
    return txId;
  } catch (error) {
    console.error("Error creating escrow record:", error);
    throw error;
  }
}

// Fund escrow (simulate minting or transferring tokens to escrow)
export async function fundEscrow(transactionId: string, amount: number, method: 'mint' | 'transfer' = 'transfer', sourceAccount?: string) {
  try {
    // For server-side implementation, we'll need to call the server-side escrow functions
    // For now, we'll simulate the funding by calling the server-side function
    
    // Create HCS message for escrow funding
    const message = {
      type: "escrow.funded",
      version: "1.0",
      transaction_id: transactionId,
      amount: amount.toString(),
      currency: "TAGUSD",
      timestamp: new Date().toISOString()
    };

    // Submit message to HCS topic and update database
    const txId = await submitHCSMessage(
      topicId,
      message,
      'transactions',
      transactionId
    );

    // Update transaction status in database
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ 
        escrow_status: "funded",
        updated_at: new Date().toISOString()
      })
      .eq("id", transactionId);

    if (updateError) {
      throw new Error(`Failed to update transaction status: ${updateError.message}`);
    }

    console.log(`Escrow funded and HCS message submitted: ${txId}`);
    return txId;
  } catch (error) {
    console.error("Error funding escrow:", error);
    throw error;
  }
}

// Release escrow (transfer tokens from escrow to seller)
export async function releaseEscrow(transactionId: string, sellerId: string, amount: number) {
  try {
    // For server-side implementation, we'll need to call the server-side escrow functions
    // For now, we'll simulate the release by calling the server-side function
    
    // Create HCS message for escrow release
    const message = {
      type: "escrow.release",
      version: "1.0",
      transaction_id: transactionId,
      seller_id: sellerId,
      amount: amount.toString(),
      currency: "TAGUSD",
      timestamp: new Date().toISOString()
    };

    // Submit message to HCS topic and update database
    const txId = await submitHCSMessage(
      topicId,
      message,
      'transactions',
      transactionId
    );

    // Update transaction status in database
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ 
        escrow_status: "released",
        updated_at: new Date().toISOString()
      })
      .eq("id", transactionId);

    if (updateError) {
      throw new Error(`Failed to update transaction status: ${updateError.message}`);
    }

    console.log(`Escrow released and HCS message submitted: ${txId}`);
    return txId;
  } catch (error) {
    console.error("Error releasing escrow:", error);
    throw error;
  }
}

// Dispute escrow
export async function disputeEscrow(transactionId: string, reason: string) {
  try {
    // Create HCS message for escrow dispute
    const message = {
      type: "escrow.dispute",
      version: "1.0",
      transaction_id: transactionId,
      reason: reason,
      timestamp: new Date().toISOString()
    };

    // Submit message to HCS topic and update database
    const txId = await submitHCSMessage(
      topicId,
      message,
      'transactions',
      transactionId
    );

    // Update transaction status in database
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ 
        escrow_status: "disputed",
        updated_at: new Date().toISOString()
      })
      .eq("id", transactionId);

    if (updateError) {
      throw new Error(`Failed to update transaction status: ${updateError.message}`);
    }

    console.log(`Escrow disputed and HCS message submitted: ${txId}`);
    return txId;
  } catch (error) {
    console.error("Error disputing escrow:", error);
    throw error;
  }
}

// Get escrow details
export async function getEscrowDetails(escrowId: string) {
  try {
    // In a real implementation, this would call the server-side function to get escrow details
    console.log(`Getting details for escrow: ${escrowId}`);
    
    // For now, we'll return mock data
    return {
      escrowId,
      status: "active",
      amount: 100,
      currency: "TAGUSD",
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting escrow details:", error);
    throw error;
  }
}

// Listen to escrow events (placeholder for now)
export function listenToEscrowEvents(callback: (message: any) => void) {
  // In a real implementation, this would subscribe to HCS topic messages
  console.log("Listening to escrow events");
  
  // For now, we'll just return a cleanup function
  return () => {
    console.log("Stopped listening to escrow events");
  };
}