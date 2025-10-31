import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface EscrowStatus {
  id: string;
  status: string;
  escrow_status: string;
  hcs_tx_id: string | null;
  updated_at: string;
}

export function useEscrowStatus(transactionId: string) {
  const [status, setStatus] = useState<EscrowStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) return;

    const fetchStatus = async () => {
      try {
        setLoading(true);
        
        // Fetch current status
        const { data, error } = await supabase
          .from('transactions')
          .select('id, status, escrow_status, hcs_tx_id, updated_at')
          .eq('id', transactionId)
          .single();

        if (error) throw error;
        
        setStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch escrow status');
      } finally {
        setLoading(false);
      }
    };

    // Fetch initial status
    fetchStatus();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('escrow-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `id=eq.${transactionId}`
        },
        (payload) => {
          setStatus(payload.new as EscrowStatus);
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [transactionId]);

  return { status, loading, error };
}