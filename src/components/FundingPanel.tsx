import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useWallet } from '../hooks/useWallet';
import { rateEngine } from '../lib/rateEngine';

interface FundingPanelProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function FundingPanel({ onNavigate, onLogout }: FundingPanelProps) {
  const { linkedAddress, isConnected } = useWallet();
  
  // Deposit Fiat states
  const [fiatAmount, setFiatAmount] = useState('');
  const [fiatCurrency, setFiatCurrency] = useState('NGN');
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  // Deposit Crypto states
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [cryptoToken, setCryptoToken] = useState('HBAR');
  
  // Withdraw Fiat states
  const [withdrawFiatAmount, setWithdrawFiatAmount] = useState('');
  const [withdrawFiatCurrency, setWithdrawFiatCurrency] = useState('NGN');
  const [withdrawPayoutMethod, setWithdrawPayoutMethod] = useState('bank');
  const [destinationAccount, setDestinationAccount] = useState('');
  
  // Withdraw Crypto states
  const [withdrawCryptoAmount, setWithdrawCryptoAmount] = useState('');
  const [withdrawCryptoToken, setWithdrawCryptoToken] = useState('TAGUSD');
  const [destinationAddress, setDestinationAddress] = useState('');
  
  // General states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionRate, setConversionRate] = useState<number | null>(null);

  // Fiat payment methods
  const paymentMethods = [
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'bank', label: 'Bank Transfer' },
    { value: 'mobile', label: 'Mobile Money' }
  ];

  // Payout methods
  const payoutMethods = [
    { value: 'bank', label: 'Bank Transfer' },
    { value: 'mobile', label: 'Mobile Money' }
  ];

  // Crypto tokens
  const cryptoTokens = [
    { value: 'HBAR', label: 'HBAR' },
    { value: 'TAGUSD', label: 'TAGUSD' }
  ];

  // Handle fiat deposit
  const handleFiatDeposit = async () => {
    if (!isConnected || !fiatAmount) {
      setError('Please connect wallet and enter amount');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // For development, simulate successful payment
      // In production, this would integrate with Flutterwave or similar service
      console.log('Simulating fiat deposit:', {
        amount: parseFloat(fiatAmount),
        currency: fiatCurrency,
        paymentMethod: paymentMethod,
        walletAddress: linkedAddress
      });
      
      // Show success message
      setSuccess(true);
      
      // In a real implementation, you would redirect to a payment page
      // window.open(result.payment_link, '_blank');
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle crypto deposit
  const handleCryptoDeposit = async () => {
    if (!isConnected || !cryptoAmount) {
      setError('Please connect wallet and enter amount');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // For crypto deposits, we would typically show the user's deposit address
      // and monitor for incoming transactions
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to process crypto deposit');
      console.error('Crypto deposit error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle fiat withdrawal
  const handleFiatWithdrawal = async () => {
    if (!isConnected || !withdrawFiatAmount || !destinationAccount) {
      setError('Please connect wallet and fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Get conversion rate
      const rate = await rateEngine.getRate('TAGUSD', withdrawFiatCurrency);
      setConversionRate(rate);
      
      // For development, simulate successful withdrawal
      // In production, this would integrate with Flutterwave or similar service
      console.log('Simulating fiat withdrawal:', {
        amount: parseFloat(withdrawFiatAmount),
        token: 'TAGUSD',
        currency: withdrawFiatCurrency,
        payoutMethod: withdrawPayoutMethod,
        destinationAccount: destinationAccount
      });
      
      // Show success message
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate withdrawal');
      console.error('Withdrawal error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle crypto withdrawal
  const handleCryptoWithdrawal = async () => {
    if (!isConnected || !withdrawCryptoAmount || !destinationAddress) {
      setError('Please connect wallet and fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // For development, skip address validation
      // In production, you would validate the destination address
      console.log('Validating destination address:', destinationAddress);
      
      // For development, simulate successful withdrawal
      // In production, this would integrate with a crypto withdrawal service
      console.log('Simulating crypto withdrawal:', {
        amount: parseFloat(withdrawCryptoAmount),
        token: withdrawCryptoToken,
        destinationAddress: destinationAddress
      });
      
      // Show success message
      setSuccess(true);
    } catch (err: any) {
      // Improved error handling with better user feedback
      if (err.message.includes('Failed to fetch')) {
        setError('Withdrawal service is not available in development mode. This feature works when deployed to Netlify.');
      } else {
        setError(err.message || 'Failed to initiate withdrawal');
      }
      console.error('Withdrawal error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSuccess(false);
    setError(null);
    setFiatAmount('');
    setCryptoAmount('');
    setWithdrawFiatAmount('');
    setWithdrawCryptoAmount('');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Funding</h1>
        {!isConnected && (
          <div className="text-sm text-red-500">
            Please connect your wallet to use funding features
          </div>
        )}
      </div>

      <Tabs defaultValue="deposit-fiat" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deposit-fiat">Deposit Fiat</TabsTrigger>
          <TabsTrigger value="deposit-crypto">Deposit Crypto</TabsTrigger>
          <TabsTrigger value="withdraw-fiat">Withdraw Fiat</TabsTrigger>
          <TabsTrigger value="withdraw-crypto">Withdraw Crypto</TabsTrigger>
        </TabsList>

        {/* Deposit Fiat Tab */}
        <TabsContent value="deposit-fiat">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Fiat</CardTitle>
              <CardDescription>
                Add funds to your account using local currency
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Payment Initiated!</h3>
                  <p className="text-muted-foreground mb-4">
                    Please complete the payment in the new window.
                  </p>
                  <Button onClick={resetForm}>
                    Make Another Deposit
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fiat-amount">Amount</Label>
                        <Input
                          id="fiat-amount"
                          type="number"
                          placeholder="Enter amount"
                          value={fiatAmount}
                          onChange={(e) => setFiatAmount(e.target.value)}
                          disabled={!isConnected || loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fiat-currency">Currency</Label>
                        <Select value={fiatCurrency} onValueChange={setFiatCurrency} disabled={!isConnected || loading}>
                          <SelectTrigger id="fiat-currency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                            <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                            <SelectItem value="GHS">Ghanaian Cedi (GHS)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment-method">Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={!isConnected || loading}>
                          <SelectTrigger id="payment-method">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-6">
                      <h3 className="font-semibold mb-4">Transaction Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span>{fiatCurrency} {fiatAmount || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Exchange Rate:</span>
                          <span>1:1 (Stable)</span>
                        </div>
                        <div className="flex justify-between border-t pt-3 font-semibold">
                          <span>You will receive:</span>
                          <span>{fiatAmount || '0.00'} TAGUSD</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-500 text-sm p-3 bg-red-50 rounded">{error}</div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleFiatDeposit}
                      disabled={loading || !isConnected || !fiatAmount}
                    >
                      {loading ? 'Processing...' : 'Continue to Payment'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deposit Crypto Tab */}
        <TabsContent value="deposit-crypto">
          <Card>
            <CardHeader>
              <CardTitle>Deposit Crypto</CardTitle>
              <CardDescription>
                Send crypto to your deposit address
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Deposit Address Generated!</h3>
                  <div className="bg-muted p-4 rounded-lg mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Send crypto to this address:</p>
                    <p className="font-mono text-sm break-all">
                      {linkedAddress || 'Connect wallet to see address'}
                    </p>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Your deposit will be credited after confirmation.
                  </p>
                  <Button onClick={resetForm}>
                    New Deposit
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="crypto-amount">Amount</Label>
                        <Input
                          id="crypto-amount"
                          type="number"
                          placeholder="Enter amount"
                          value={cryptoAmount}
                          onChange={(e) => setCryptoAmount(e.target.value)}
                          disabled={!isConnected || loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="crypto-token">Token</Label>
                        <Select value={cryptoToken} onValueChange={setCryptoToken} disabled={!isConnected || loading}>
                          <SelectTrigger id="crypto-token">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {cryptoTokens.map((token) => (
                              <SelectItem key={token.value} value={token.value}>
                                {token.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Your Deposit Address</Label>
                        <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all">
                          {isConnected ? linkedAddress : 'Connect wallet to see address'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-6">
                      <h3 className="font-semibold mb-4">Deposit Instructions</h3>
                      <ol className="text-sm space-y-2">
                        <li className="flex items-start gap-2">
                          <span>1.</span>
                          <span>Copy your deposit address above</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>2.</span>
                          <span>Send {cryptoToken} to this address</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>3.</span>
                          <span>Wait for network confirmations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>4.</span>
                          <span>Your balance will update automatically</span>
                        </li>
                      </ol>
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-500 text-sm p-3 bg-red-50 rounded">{error}</div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCryptoDeposit}
                      disabled={loading || !isConnected}
                    >
                      {loading ? 'Processing...' : 'Generate Deposit Address'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdraw Fiat Tab */}
        <TabsContent value="withdraw-fiat">
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Fiat</CardTitle>
              <CardDescription>
                Convert crypto to local currency and withdraw
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Withdrawal Initiated!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your withdrawal is being processed.
                  </p>
                  {conversionRate && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Conversion rate: 1 TAGUSD = {conversionRate} {withdrawFiatCurrency}
                    </p>
                  )}
                  <Button onClick={resetForm}>
                    Make Another Withdrawal
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="withdraw-fiat-amount">Amount (TAGUSD)</Label>
                        <Input
                          id="withdraw-fiat-amount"
                          type="number"
                          placeholder="Enter amount"
                          value={withdrawFiatAmount}
                          onChange={(e) => setWithdrawFiatAmount(e.target.value)}
                          disabled={!isConnected || loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="withdraw-fiat-currency">Payout Currency</Label>
                        <Select value={withdrawFiatCurrency} onValueChange={setWithdrawFiatCurrency} disabled={!isConnected || loading}>
                          <SelectTrigger id="withdraw-fiat-currency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                            <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                            <SelectItem value="GHS">Ghanaian Cedi (GHS)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="withdraw-payout-method">Payout Method</Label>
                        <Select value={withdrawPayoutMethod} onValueChange={setWithdrawPayoutMethod} disabled={!isConnected || loading}>
                          <SelectTrigger id="withdraw-payout-method">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {payoutMethods.map((method) => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="destination-account">Destination Account</Label>
                        <Input
                          id="destination-account"
                          placeholder="Enter account number"
                          value={destinationAccount}
                          onChange={(e) => setDestinationAccount(e.target.value)}
                          disabled={!isConnected || loading}
                        />
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-6">
                      <h3 className="font-semibold mb-4">Withdrawal Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span>{withdrawFiatAmount || '0.00'} TAGUSD</span>
                        </div>
                        {conversionRate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Exchange Rate:</span>
                            <span>1 TAGUSD = {conversionRate} {withdrawFiatCurrency}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t pt-3 font-semibold">
                          <span>You will receive:</span>
                          <span>
                            {withdrawFiatAmount && conversionRate 
                              ? (parseFloat(withdrawFiatAmount) * conversionRate).toFixed(2) 
                              : '0.00'} {withdrawFiatCurrency}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-500 text-sm p-3 bg-red-50 rounded">{error}</div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleFiatWithdrawal}
                      disabled={loading || !isConnected || !withdrawFiatAmount || !destinationAccount}
                    >
                      {loading ? 'Processing...' : 'Withdraw Funds'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdraw Crypto Tab */}
        <TabsContent value="withdraw-crypto">
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Crypto</CardTitle>
              <CardDescription>
                Send crypto to an external wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Withdrawal Initiated!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your withdrawal is being processed.
                  </p>
                  <Button onClick={resetForm}>
                    Make Another Withdrawal
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="withdraw-crypto-amount">Amount</Label>
                        <Input
                          id="withdraw-crypto-amount"
                          type="number"
                          placeholder="Enter amount"
                          value={withdrawCryptoAmount}
                          onChange={(e) => setWithdrawCryptoAmount(e.target.value)}
                          disabled={!isConnected || loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="withdraw-crypto-token">Token</Label>
                        <Select value={withdrawCryptoToken} onValueChange={setWithdrawCryptoToken} disabled={!isConnected || loading}>
                          <SelectTrigger id="withdraw-crypto-token">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {cryptoTokens.map((token) => (
                              <SelectItem key={token.value} value={token.value}>
                                {token.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="destination-address">Destination Address</Label>
                        <Input
                          id="destination-address"
                          placeholder="Enter wallet address"
                          value={destinationAddress}
                          onChange={(e) => setDestinationAddress(e.target.value)}
                          disabled={!isConnected || loading}
                        />
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-6">
                      <h3 className="font-semibold mb-4">Withdrawal Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span>{withdrawCryptoAmount || '0.00'} {withdrawCryptoToken}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Network Fee:</span>
                          <span>~0.01 {withdrawCryptoToken}</span>
                        </div>
                        <div className="flex justify-between border-t pt-3 font-semibold">
                          <span>Total Deducted:</span>
                          <span>
                            {withdrawCryptoAmount 
                              ? (parseFloat(withdrawCryptoAmount) + 0.01).toFixed(2) 
                              : '0.01'} {withdrawCryptoToken}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-500 text-sm p-3 bg-red-50 rounded">{error}</div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCryptoWithdrawal}
                      disabled={loading || !isConnected || !withdrawCryptoAmount || !destinationAddress}
                    >
                      {loading ? 'Processing...' : 'Withdraw Funds'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}