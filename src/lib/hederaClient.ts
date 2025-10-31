/// <reference types="vite/client" />
import { supabase } from "./supabaseClient";

/**
 * Client-side Hedera helpers.
 * NOTE: Do NOT instantiate Hedera SDK or use private keys in client code.
 * Server-side Netlify function '/.netlify/functions/api/hcs/submit-message'
 * should perform all on-chain operations using server-only env vars.
 */

// Use VITE_* env var for feature flag (ensure .env has VITE_FEATURE_ONCHAIN)
const FEATURE_ONCHAIN = import.meta.env.VITE_FEATURE_ONCHAIN === 'true';

/**
 * Submit a consensus message to a topic via serverless function and update DB.
 * Client MUST NOT hold private keys or talk to Hedera directly.
 */
export async function submitHCSMessage(
  topicId: string,
  payload: any,
  table: string,
  rowId: string
): Promise<string> {
  if (!FEATURE_ONCHAIN) {
    console.log('FEATURE_ONCHAIN is disabled, skipping HCS submission');

    if (table === 'transactions') {
      const { error: logError } = await supabase
        .from('escrow_logs')
        .insert([
          {
            transaction_id: rowId,
            message: payload.type,
            topic_id: topicId,
            created_at: new Date().toISOString(),
          },
        ]);

      if (logError) console.error('Error inserting escrow log:', logError);
    }
    return '';
  }

  try {
    const response = await fetch('/.netlify/functions/api/hcs/submit-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId, payload, table, rowId }),
    });

    if (!response.ok) {
      // be defensive: try to read json, fallback to text
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        const text = await response.text();
        throw new Error(text || 'Failed to submit HCS message');
      }
      throw new Error(errorData?.error || 'Failed to submit HCS message');
    }

    const result = await response.json();

    // Update DB row with tx id
    const { error: updateError } = await supabase
      .from(table)
      .update({ hcs_tx_id: result.txId })
      .eq('id', rowId);

    if (updateError) {
      console.error(`Error updating ${table} with hcs_tx_id:`, updateError);
    }

    // Insert or update logs as needed
    if (table === 'transactions') {
      const { error: logError } = await supabase
        .from('escrow_logs')
        .insert([
          {
            transaction_id: rowId,
            message: payload.type,
            topic_id: topicId,
            hcs_tx_id: result.txId,
            created_at: new Date().toISOString(),
          },
        ]);
      if (logError) console.error('Error inserting escrow log:', logError);
    } else if (table === 'certificates') {
      const { error: certErr } = await supabase
        .from('certificates')
        .update({ hcs_tx_id: result.txId })
        .eq('id', rowId);
      if (certErr) console.error('Error updating certificate with hcs_tx_id:', certErr);
    }

    return result.txId;
  } catch (error) {
    console.error('Error in submitHCSMessage:', error);
    throw error;
  }
}

/**
 * Helpers that fetch data and call submitHCSMessage
 * (these remain client-side since they only use Supabase + server submit endpoint)
 */
export async function recordAnimalRegistration(animalId: string): Promise<string> {
  try {
    const { data: animal, error } = await supabase
      .from('animals')
      .select('*')
      .eq('id', animalId)
      .single();

    if (error || !animal) {
      throw new Error(`Error fetching animal: ${error?.message ?? 'not found'}`);
    }

    const payload = {
      type: 'animal.registered',
      version: '1.0',
      animal_id: animalId,
      animal_on_chain_id: animal.animal_on_chain_id,
      tag_number: animal.tag_number,
      farmer_id: animal.farmer_id,
      breed: animal.breed,
      registered_at: animal.registered_at,
      timestamp: new Date().toISOString(),
    };

    // topic id must be provided via VITE_ env var (client-side safe values only)
    const topicId = import.meta.env.VITE_HEDERA_TOPIC_ANIMALS;
    return await submitHCSMessage(topicId, payload, 'animals', animalId);
  } catch (error) {
    console.error('Error recording animal registration:', error);
    throw error;
  }
}

export async function recordCertificateIssued(certId: string): Promise<string> {
  try {
    const { data: cert, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certId)
      .single();

    if (error || !cert) {
      throw new Error(`Error fetching certificate: ${error?.message ?? 'not found'}`);
    }

    const payload = {
      type: 'certificate.issued',
      version: '1.0',
      certificate_id: certId,
      animal_id: cert.animal_id,
      vet_id: cert.vet_id,
      certifier_id: cert.certifier_id,
      certificate_type: cert.certificate_type,
      certificate_hash: cert.certificate_hash,
      issued_at: cert.issued_at,
      timestamp: new Date().toISOString(),
    };

    const topicId = import.meta.env.VITE_HEDERA_TOPIC_CERTS;
    return await submitHCSMessage(topicId, payload, 'certificates', certId);
  } catch (error) {
    console.error('Error recording certificate issuance:', error);
    throw error;
  }
}

// Remove client-side Hedera SDK usage — server must manage Hedera SDK / private keys.
// export a placeholder to keep API shape (do not expose any private-key-backed client)
export const client = undefined;