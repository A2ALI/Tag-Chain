import { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supabase } from '../lib/supabaseClient';
import { mintToken } from '../lib/hederaTokenService';
import type { Page } from '../App';
import PaymentModal from './PaymentModal';

interface OnrampPageProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function OnrampPage({ onNavigate, onLogout }: OnrampPageProps) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const tokenId = '0.0.7119909'; // TagUSD token ID from deployment

  const banks = [
    { value: 'access', label: 'Access Bank' },
    { value: 'gtbank', label: 'GTBank' },
    { value: 'zenith', label: 'Zenith Bank' },
    { value: 'firstbank', label: 'First Bank' },
    { value: 'uba', label: 'UBA' }
  ];

  const handlePurchase = async () => {
    if (!amount || !bank || !accountNumber) {
      setError('Please fill in all fields');
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    setShowPaymentModal(false);
    setLoading(true);
    setError(null);
    
    try {
      // Calculate equivalent TUSD amount (assuming 1500 NGN = 1 USD = 1 TUSD)
      const tusdAmount = parseFloat(amount) / 1500;
      const amountInSmallestUnit = Math.round(tusdAmount * 100); // Convert to smallest unit (cents)
      
      // Mint new TagUSD tokens
      const hederaTransactionId = await mintToken(tokenId, amountInSmallestUnit);
      
      // Store transaction in Supabase with Hedera transaction ID
      const { error: insertError } = await supabase
        .from('transactions')
        .insert([
          {
            buyer_id: 'current_user_id', // Would be actual user ID in real app
            seller_id: null,
            animal_id: null,
            amount: tusdAmount,
            currency: 'TUSD',
            status: 'released',
            hedera_transaction_id: hederaTransactionId, // Store Hedera transaction ID
            created_at: new Date().toISOString()
          }
        ]);

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSuccess(true);
      setAmount('');
      setBank('');
      setAccountNumber('');
      
      // Show success message with HashScan link
      alert(`Purchase successful! Transaction ID: ${hederaTransactionId}\nView on HashScan: https://hashscan.io/testnet/transaction/${hederaTransactionId}`);
    } catch (err) {
      setError('Failed to process payment. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const usdcAmount = amount ? (parseFloat(amount) / 1500).toFixed(2) : '0.00';

  return (
    <DashboardLayout
      sidebarItems={[]}
      title="Buy TUSD"
      onNavigate={onNavigate}
      onLogout={onLogout}
      walletBalance="$1,245.00"
      notifications={[]}
    >
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-['Poppins']">Buy TUSD</CardTitle>
            <CardDescription>Purchase TUSD tokens using Nigerian Naira</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="font-['Poppins'] text-xl font-semibold mb-2">Purchase Successful!</h3>
                <p className="text-muted-foreground mb-4">
                  {usdcAmount} TUSD has been added to your wallet.
                </p>
                <Button onClick={() => setSuccess(false)}>
                  Make Another Purchase
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount in NGN</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount in NGN"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-input-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger id="currency" className="bg-input-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bank">Select Bank</Label>
                      <Select value={bank} onValueChange={setBank}>
                        <SelectTrigger id="bank" className="bg-input-background">
                          <SelectValue placeholder="Select your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {banks.map((bank) => (
                            <SelectItem key={bank.value} value={bank.value}>
                              {bank.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account">Account Number</Label>
                      <Input
                        id="account"
                        placeholder="Enter your account number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="bg-input-background"
                      />
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-6">
                    <h3 className="font-['Poppins'] font-semibold mb-4">Transaction Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span>₦{amount || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Exchange Rate:</span>
                        <span>₦1,500 = 1 TUSD</span>
                      </div>
                      <div className="flex justify-between border-t pt-3 font-semibold">
                        <span>You will receive:</span>
                        <span className="font-['Poppins']">{usdcAmount} TUSD</span>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-background rounded-lg">
                      <h4 className="font-['Poppins'] font-medium mb-2">How it works</h4>
                      <ol className="text-sm space-y-1">
                        <li className="flex items-start gap-2">
                          <span>1.</span>
                          <span>Enter amount and bank details</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>2.</span>
                          <span>Complete payment via Flutterwave</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>3.</span>
                          <span>Receive TUSD in your wallet</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onNavigate('wallet' as Page)}>
                    Back to Wallet
                  </Button>
                  <Button 
                    onClick={handlePurchase}
                    disabled={loading || !amount || !bank || !accountNumber}
                  >
                    {loading ? 'Processing...' : 'Continue to Payment'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={parseFloat(amount) || 0}
          currency={currency}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </DashboardLayout>
  );
}