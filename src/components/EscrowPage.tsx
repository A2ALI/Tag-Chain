import { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'framer-motion';
import type { Page } from '../App';
import { createEscrowRecord, releaseEscrow, disputeEscrow, listenToEscrowEvents } from '../lib/hederaEscrowService';
import { useAuth } from '../hooks/useAuth';
import HederaVerificationBadge from './HederaVerificationBadge';

interface EscrowTransaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  animal_id: string;
  amount: number;
  currency: string;
  status: 'pending_escrow' | 'released' | 'cancelled' | 'disputed';
  created_at: string;
  contract_hash?: string;
  escrow_expiry?: string;
  buyer_name?: string;
  seller_name?: string;
  animal_tag?: string;
  hedera_transaction_id?: string;
  hcs_tx_id?: string;
  hashscan_link?: string;
}

interface EscrowPageProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function EscrowPage({ onNavigate, onLogout }: EscrowPageProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    fetchTransactions();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('escrow-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          console.log('New escrow transaction:', payload);
          fetchTransactions(); // Refresh transactions when new one is added
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          console.log('Updated escrow transaction:', payload);
          fetchTransactions(); // Refresh transactions when one is updated
        }
      )
      .subscribe();

    // Start listening for escrow events
    listenToEscrowEvents((message) => {
      console.log("Received escrow event:", message);
      // Refresh transactions when we receive an event
      fetchTransactions();
    });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch transactions from Supabase for current user
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .in('status', ['pending_escrow', 'released', 'disputed']);
      
      if (error) throw error;
      
      // For demo purposes, we'll enhance the data with mock names
      const enhancedTransactions = data.map((transaction: any) => ({
        ...transaction,
        buyer_name: transaction.buyer_id === user.id ? 'You' : 'Another Buyer',
        seller_name: transaction.seller_id === user.id ? 'You' : 'Another Seller',
        animal_tag: transaction.animal_id || 'TC-001-NG',
        hashscan_link: transaction.hedera_transaction_id 
          ? `https://hashscan.io/testnet/transaction/${transaction.hedera_transaction_id}`
          : (transaction.hcs_tx_id 
            ? `https://hashscan.io/testnet/transaction/${transaction.hcs_tx_id}`
            : undefined)
      }));
      
      setTransactions(enhancedTransactions);
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseFunds = async (transactionId: string) => {
    if (!user) return;
    
    try {
      // Find the transaction in our local state
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) {
        alert('Transaction not found');
        return;
      }
      
      // Release funds through Hedera escrow service
      const txId = await releaseEscrow(
        transactionId,
        transaction.seller_id,
        transaction.amount
      );
      
      // Update local state
      setTransactions(transactions.map(t => 
        t.id === transactionId ? {...t, status: 'released'} : t
      ));
      
      alert(`Funds released for transaction ${transactionId}\nView on HashScan: https://hashscan.io/testnet/transaction/${txId}`);
    } catch (err) {
      console.error('Error releasing funds:', err);
      alert('Failed to release funds: ' + (err as Error).message);
    }
  };

  const handleRaiseDispute = async (transactionId: string) => {
    if (!user) return;
    
    try {
      // Raise dispute through Hedera escrow service
      const txId = await disputeEscrow(transactionId, "User raised dispute");
      
      // Update local state
      setTransactions(transactions.map(t => 
        t.id === transactionId ? {...t, status: 'disputed'} : t
      ));
      
      alert(`Dispute raised for transaction ${transactionId}\nView on HashScan: https://hashscan.io/testnet/transaction/${txId}`);
    } catch (err) {
      console.error('Error raising dispute:', err);
      alert('Failed to raise dispute: ' + (err as Error).message);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'released': return 'default';
      case 'pending_escrow': return 'secondary';
      case 'disputed': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout
      sidebarItems={[]}
      title="Escrow Management"
      onNavigate={onNavigate}
      onLogout={onLogout}
      walletBalance="$1,245.00"
      notifications={[]}
    >
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-['Poppins']">Active Escrow Transactions</CardTitle>
            <CardDescription>Manage funds held in smart contract escrow</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                {error}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Animal ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Hedera Proof</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction: any) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.buyer_name}
                      </TableCell>
                      <TableCell>
                        {transaction.seller_name}
                      </TableCell>
                      <TableCell>
                        {transaction.animal_tag}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${transaction.amount.toFixed(2)} {transaction.currency}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(transaction.status)}>
                          {transaction.status === 'pending_escrow' ? 'Pending' : 
                           transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <HederaVerificationBadge transactionId={transaction.id} />
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedTransaction(transaction)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="font-['Poppins']">
                                Transaction Details
                              </DialogTitle>
                            </DialogHeader>
                            {selectedTransaction && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <span className="font-medium">Transaction ID:</span>
                                  <span>{selectedTransaction.id}</span>
                                  
                                  <span className="font-medium">Buyer:</span>
                                  <span>{selectedTransaction.buyer_name}</span>
                                  
                                  <span className="font-medium">Seller:</span>
                                  <span>{selectedTransaction.seller_name}</span>
                                  
                                  <span className="font-medium">Animal ID:</span>
                                  <span>{selectedTransaction.animal_tag}</span>
                                  
                                  <span className="font-medium">Amount:</span>
                                  <span>${selectedTransaction.amount.toFixed(2)} {selectedTransaction.currency}</span>
                                  
                                  <span className="font-medium">Status:</span>
                                  <span>
                                    <Badge variant={getStatusVariant(selectedTransaction.status)}>
                                      {selectedTransaction.status === 'pending_escrow' ? 'Pending' : 
                                       selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                                    </Badge>
                                  </span>
                                  
                                  <span className="font-medium">Hedera Proof:</span>
                                  <span>
                                    <HederaVerificationBadge transactionId={selectedTransaction.id} />
                                  </span>
                                  
                                  <span className="font-medium">Created:</span>
                                  <span>{new Date(selectedTransaction.created_at).toLocaleDateString()}</span>
                                  
                                  {selectedTransaction.contract_hash && (
                                    <>
                                      <span className="font-medium">Contract Hash:</span>
                                      <span className="font-mono text-xs">{selectedTransaction.contract_hash}</span>
                                    </>
                                  )}
                                  
                                  {selectedTransaction.escrow_expiry && (
                                    <>
                                      <span className="font-medium">Expiry:</span>
                                      <span>{new Date(selectedTransaction.escrow_expiry).toLocaleDateString()}</span>
                                    </>
                                  )}
                                  
                                  {(selectedTransaction.hedera_transaction_id || selectedTransaction.hcs_tx_id) && (
                                    <>
                                      <span className="font-medium">Hedera Tx ID:</span>
                                      <span className="font-mono text-xs">
                                        <a 
                                          href={`https://hashscan.io/testnet/transaction/${selectedTransaction.hedera_transaction_id || selectedTransaction.hcs_tx_id}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500 hover:underline"
                                        >
                                          {(selectedTransaction.hedera_transaction_id || selectedTransaction.hcs_tx_id)?.substring(0, 16)}...
                                        </a>
                                      </span>
                                    </>
                                  )}
                                </div>
                                
                                {selectedTransaction.status === 'pending_escrow' && (
                                  <div className="flex gap-2 pt-4">
                                    <Button 
                                      className="flex-1"
                                      onClick={() => handleReleaseFunds(selectedTransaction.id)}
                                    >
                                      Release Funds
                                    </Button>
                                    <Button 
                                      variant="destructive"
                                      className="flex-1"
                                      onClick={() => handleRaiseDispute(selectedTransaction.id)}
                                    >
                                      Raise Dispute
                                    </Button>
                                  </div>
                                )}
                                
                                {selectedTransaction.status === 'released' && (
                                  <div className="pt-4">
                                    <Badge variant="default" className="w-full justify-center">
                                      Funds Released
                                    </Badge>
                                  </div>
                                )}
                                
                                {selectedTransaction.status === 'disputed' && (
                                  <div className="pt-4">
                                    <Badge variant="destructive" className="w-full justify-center">
                                      Disputed
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Escrow Value</CardDescription>
              <CardTitle className="font-['Poppins']">
                ${transactions
                  .filter(t => t.status === 'pending_escrow')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {transactions.filter(t => t.status === 'pending_escrow').length} active transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Releases</CardDescription>
              <CardTitle className="font-['Poppins']">
                {transactions.filter(t => t.status === 'pending_escrow').length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Disputes</CardDescription>
              <CardTitle className="font-['Poppins']">
                {transactions.filter(t => t.status === 'disputed').length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Requires resolution
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}