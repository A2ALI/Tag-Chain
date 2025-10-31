import { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Wallet, ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { mintToken, burnToken } from '../lib/hederaTokenService';
import type { Page } from '../App';
import { useAuth } from '../hooks/useAuth';
import HederaVerificationBadge from './HederaVerificationBadge';

interface WalletPageProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'escrow' | 'released' | 'pending' | 'cancelled';
  created_at: string;
  description: string;
  type: 'Received' | 'Sent' | 'Pending';
  transaction_id?: string; // Hedera transaction ID
  hcs_tx_id?: string; // HCS transaction ID
  hashscan_link?: string; // HashScan link
}

export default function WalletPage({ onNavigate, onLogout }: WalletPageProps) {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0); // Will be updated from Supabase
  const [tokenId, setTokenId] = useState('0.0.7119909'); // TagUSD token ID from deployment
  
  useEffect(() => {
    // Only call fetch functions after confirming user?.id exists
    if (!user?.id) {
      console.log('No user ID found, skipping wallet data fetch');
      setLoading(false);
      return;
    }
    
    console.log('Supabase user:', user);
    console.log('Headers check:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Key found' : 'Key missing');
    
    fetchTransactions();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('wallet-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          console.log('New transaction:', payload);
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
          console.log('Updated transaction:', payload);
          fetchTransactions(); // Refresh transactions when one is updated
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchTransactions = async () => {
    // Only call fetch functions after confirming user?.id exists
    if (!user?.id) {
      console.log('No user ID found, skipping transactions fetch');
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch transactions from Supabase for current user
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform Supabase data to our Transaction interface
      const formattedTransactions: Transaction[] = data.map((txn: any) => ({
        id: txn.id,
        amount: txn.amount,
        currency: txn.currency || 'TUSD',
        status: txn.status,
        created_at: txn.created_at,
        description: `Transaction ${txn.id.substring(0, 8)}`,
        type: txn.status === 'released' ? 'Received' : 
              txn.status === 'escrow' ? 'Pending' : 'Sent',
        transaction_id: txn.hedera_transaction_id || undefined,
        hcs_tx_id: txn.hcs_tx_id || undefined,
        hashscan_link: txn.hedera_transaction_id 
          ? `https://hashscan.io/testnet/transaction/${txn.hedera_transaction_id}`
          : (txn.hcs_tx_id 
            ? `https://hashscan.io/testnet/transaction/${txn.hcs_tx_id}`
            : undefined)
      }));
      
      setTransactions(formattedTransactions);
      
      // Calculate balance from released transactions
      const releasedTransactions = formattedTransactions.filter(t => t.status === 'released');
      const totalBalance = releasedTransactions.reduce((sum, t) => sum + t.amount, 0);
      setBalance(totalBalance);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    // Only call fetch functions after confirming user?.id exists
    if (!user?.id) {
      console.log('No user ID found, skipping add funds');
      return;
    }
    
    try {
      // Mint new TagUSD tokens
      const transactionId = await mintToken(tokenId, 50000); // Mint 500.00 TUSD (with 2 decimals)
      
      // Create a transaction with escrow status in Supabase
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          buyer_id: user.id, // Use actual user ID
          seller_id: null,
          animal_id: null,
          amount: 500.00,
          currency: 'TUSD',
          status: 'released',
          hedera_transaction_id: transactionId,
          created_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      
      alert(`Funds added successfully! Transaction ID: ${transactionId}\nView on HashScan: https://hashscan.io/testnet/transaction/${transactionId}`);
      fetchTransactions(); // Refresh transactions
    } catch (err) {
      console.error('Error adding funds:', err);
      alert('Failed to add funds. Please try again.');
    }
  };

  const handleWithdrawFunds = async () => {
    // Only call fetch functions after confirming user?.id exists
    if (!user?.id) {
      console.log('No user ID found, skipping withdraw funds');
      return;
    }
    
    try {
      // For demo purposes, we'll burn 100 TUSD
      const amountToBurn = 10000; // 100.00 TUSD (with 2 decimals)
      const transactionId = await burnToken(tokenId, amountToBurn);
      
      // Store withdrawal transaction in Supabase
      const { error: insertError } = await supabase
        .from('transactions')
        .insert([
          {
            buyer_id: null,
            seller_id: user.id, // Use actual user ID
            animal_id: null,
            amount: 100.00,
            currency: 'TUSD',
            status: 'released',
            hedera_transaction_id: transactionId,
            created_at: new Date().toISOString()
          }
        ]);

      if (insertError) {
        throw new Error(insertError.message);
      }
      
      alert(`Funds withdrawn successfully! Transaction ID: ${transactionId}\nView on HashScan: https://hashscan.io/testnet/transaction/${transactionId}`);
      fetchTransactions(); // Refresh transactions
    } catch (err) {
      console.error('Error withdrawing funds:', err);
      alert('Failed to withdraw funds. Please try again.');
    }
  };

  const sidebarItems = [
    { icon: Wallet, label: 'Overview', active: activeView === 'overview', onClick: () => setActiveView('overview') },
    { icon: ArrowDown, label: 'Deposit', active: activeView === 'deposit', onClick: () => setActiveView('deposit') },
    { icon: ArrowUp, label: 'Withdraw', active: activeView === 'withdraw', onClick: () => setActiveView('withdraw') },
    { icon: RefreshCw, label: 'Transactions', active: activeView === 'transactions', onClick: () => setActiveView('transactions') }
  ];

  // Only call data fetches after confirming user?.id exists
  if (!user?.id) {
    console.log('No user ID found, returning null');
    return null;
  }

  // Add a loading fallback if wallet or user data is null
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading User Data</h2>
          <p className="text-gray-500">Please wait while we load your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      title="Wallet"
      onNavigate={onNavigate}
      onLogout={onLogout}
      walletBalance={`$${balance.toFixed(2)}`}
      notifications={[]}
    >
      <div className="p-6 space-y-6">
        {/* Wallet Overview */}
        {activeView === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>TagUSD Balance</CardDescription>
                  <CardTitle className="font-['Poppins']">${balance.toFixed(2)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Hedera Testnet Token
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>HBAR Balance</CardDescription>
                  <CardTitle className="font-['Poppins']">42.5 HBAR</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    ~$12.75 USD
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Pending Transactions</CardDescription>
                  <CardTitle className="font-['Poppins']">
                    {transactions.filter(t => t.status === 'escrow').length}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    ${transactions
                      .filter(t => t.status === 'escrow')
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins']">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button className="bg-primary hover:bg-primary/90" onClick={handleAddFunds}>
                  <Wallet className="w-4 h-4 mr-2" />
                  Add Funds
                </Button>
                <Button variant="outline" onClick={handleWithdrawFunds}>
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Withdraw Funds
                </Button>
                <Button variant="outline" onClick={() => setActiveView('deposit')}>
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Deposit
                </Button>
                <Button variant="outline" onClick={() => setActiveView('withdraw')}>
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins']">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Hedera Proof</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.slice(0, 3).map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{transaction.type}</TableCell>
                            <TableCell>
                              <div>
                                <div>{transaction.description}</div>
                                {transaction.transaction_id && (
                                  <a 
                                    href={transaction.hashscan_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:underline"
                                  >
                                    View on HashScan
                                  </a>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {transaction.type === 'Sent' ? '-' : '+'}
                              ${transaction.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  transaction.status === 'released' ? 'default' : 
                                  transaction.status === 'escrow' ? 'secondary' : 'outline'
                                }
                              >
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <HederaVerificationBadge transactionId={transaction.id} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Button 
                      variant="link" 
                      className="mt-4 p-0 h-auto"
                      onClick={() => setActiveView('transactions')}
                    >
                      View All Transactions
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins']">On/Off Ramp</CardTitle>
                <CardDescription>Connect to local payment providers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className="bg-muted/50 rounded-lg p-6 text-center cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => onNavigate('onramp')}
                  >
                    <div className="text-4xl mb-4">🏦</div>
                    <h3 className="font-['Poppins'] font-semibold text-lg mb-2">Buy TUSD</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Deposit NGN and buy TagUSD tokens
                    </p>
                    <Button variant="outline" className="w-full">
                      Buy TUSD
                    </Button>
                  </div>
                  
                  <div 
                    className="bg-muted/50 rounded-lg p-6 text-center cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => onNavigate('offramp')}
                  >
                    <div className="text-4xl mb-4">💸</div>
                    <h3 className="font-['Poppins'] font-semibold text-lg mb-2">Withdraw NGN</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Convert TUSD to NGN and withdraw to bank
                    </p>
                    <Button variant="outline" className="w-full">
                      Withdraw Funds
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Deposit View */}
        {activeView === 'deposit' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Deposit Funds</CardTitle>
              <CardDescription>Add funds to your Tag Chain wallet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-['Poppins'] font-semibold mb-2">Bank Transfer</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Deposit via bank transfer using Flutterwave
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => onNavigate('onramp')}>
                      Connect Bank
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-['Poppins'] font-semibold mb-2">Mobile Money</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Deposit via mobile money (MTN, Airtel, etc.)
                    </p>
                    <Button variant="outline" className="w-full">
                      Connect Mobile Money
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-['Poppins'] font-semibold mb-2">Crypto Deposit</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Send TUSD or HBAR to the wallet address below
                  </p>
                  <div className="bg-muted p-3 rounded-lg mb-3">
                    <p className="text-xs text-muted-foreground break-all">
                      0.0.1234567890123456789012345678901234567890
                    </p>
                  </div>
                  <Button variant="outline" className="w-full">
                    Copy Address
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => setActiveView('overview')}>
                  Back to Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Withdraw View */}
        {activeView === 'withdraw' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Withdraw Funds</CardTitle>
              <CardDescription>Transfer funds from your Tag Chain wallet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-['Poppins'] font-semibold mb-2">Bank Transfer</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Withdraw to your bank account via Flutterwave
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => onNavigate('offramp')}>
                      Connect Bank
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-['Poppins'] font-semibold mb-2">Mobile Money</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Withdraw to mobile money (MTN, Airtel, etc.)
                    </p>
                    <Button variant="outline" className="w-full">
                      Connect Mobile Money
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-['Poppins'] font-semibold mb-2">Crypto Withdrawal</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Amount</label>
                      <div className="flex gap-2 mt-1">
                        <input 
                          type="text" 
                          placeholder="0.00"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
                        />
                        <Button variant="outline">Max</Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Recipient Address</label>
                      <input 
                        type="text" 
                        placeholder="Enter HBAR or TUSD address"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                      />
                    </div>
                    
                    <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleWithdrawFunds}>
                      Withdraw
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => setActiveView('overview')}>
                  Back to Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions View */}
        {activeView === 'transactions' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Transaction History</CardTitle>
              <CardDescription>All wallet transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hedera Proof</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>
                          <div>
                            <div>{transaction.description}</div>
                            {transaction.transaction_id && (
                              <a 
                                href={transaction.hashscan_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline"
                              >
                                View on HashScan
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.type === 'Sent' ? '-' : '+'}
                          ${transaction.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              transaction.status === 'released' ? 'default' : 
                              transaction.status === 'escrow' ? 'secondary' : 'outline'
                            }
                          >
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <HederaVerificationBadge transactionId={transaction.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              <div className="flex gap-2 mt-6">
                <Button onClick={() => setActiveView('overview')}>
                  Back to Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}