import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  onSuccess: (transactionId: string) => void;
}

export default function PaymentModal({ isOpen, onClose, amount, currency, onSuccess }: PaymentModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flutterwaveLoaded, setFlutterwaveLoaded] = useState(false);

  // Load Flutterwave script
  useEffect(() => {
    if (isOpen && !flutterwaveLoaded) {
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      script.onload = () => setFlutterwaveLoaded(true);
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [isOpen, flutterwaveLoaded]);

  const handlePayment = async () => {
    if (!user || !flutterwaveLoaded) return;

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, you would initialize the Flutterwave payment here
      // For now, we'll simulate the payment flow
      
      // Generate a unique transaction reference
      const txRef = `TAGCHAIN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Create transaction record directly in Supabase
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          buyer_id: user.id,
          amount: amount,
          currency: currency,
          escrow_tx: txRef,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message || 'Failed to create transaction');
      }
      
      const transactionData = data;

      // Initialize Flutterwave payment
      // @ts-ignore
      const flutterwave = window.FlutterwaveCheckout({
        public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: txRef,
        amount: amount,
        currency: currency,
        payment_options: 'card,mobilemoney,ussd',
        customer: {
          email: user.email,
          phone_number: user.phone,
          name: user.full_name,
        },
        callback: function (data: any) {
          // Payment successful
          if (data.status === 'successful') {
            onSuccess(data.transaction_id);
          } else {
            setError('Payment was not completed successfully');
          }
        },
        onclose: function() {
          // Modal closed
          setLoading(false);
        },
        customizations: {
          title: 'Tag Chain Payment',
          description: `Payment for ${currency} ${amount}`,
          logo: 'https://tagchain.com/logo.png',
        },
      });

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-['Poppins']">Complete Payment</CardTitle>
          <CardDescription>Pay with Flutterwave</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-['Poppins'] text-lg font-semibold">{currency} {amount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <div className="text-2xl">💳</div>
                  <span className="text-xs">Card</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <div className="text-2xl">📱</div>
                  <span className="text-xs">Mobile Money</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <div className="text-2xl">🏦</div>
                  <span className="text-xs">Bank Transfer</span>
                </Button>
              </div>
            </div>
            
            <div className="pt-4 flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handlePayment} 
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={loading || !flutterwaveLoaded}
              >
                {loading ? 'Processing...' : 'Pay Now'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}