import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Shield, Tractor, Stethoscope, Building2, Users, Truck, CheckCircle as CheckCircleIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import type { Page, UserRole } from '../App';

interface SignupPageProps {
  onNavigate: (page: Page) => void;
  onComplete: (role: UserRole) => void;
  initialRole?: UserRole;
}

export default function SignupPage({ onNavigate, onComplete, initialRole }: SignupPageProps) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>(initialRole || 'farmer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    country: 'nigeria',
    phone: '',
    kycDocument: null as File | null,
    walletType: 'hashpack'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();

  const roles = [
    { value: 'farmer', label: 'Farmer', icon: Tractor, description: 'Register and sell livestock' },
    { value: 'veterinarian', label: 'Veterinarian', icon: Stethoscope, description: 'Certify animal health' },
    { value: 'abattoir', label: 'Abattoir', icon: Building2, description: 'Process and certify meat' },
    { value: 'buyer', label: 'Buyer', icon: Users, description: 'Purchase livestock' },
    { value: 'transporter', label: 'Transporter', icon: Truck, description: 'Transport livestock' },
    { value: 'regulator', label: 'Regulator', icon: CheckCircleIcon, description: 'Certify and regulate' }
  ];

  const progress = (step / 5) * 100;

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    if (step === 5) {
      // Sign up with useAuth hook
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await signUp(formData.email, formData.password, {
          full_name: formData.name,
          role: role,
          country: formData.country,
          phone: formData.phone
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        onComplete(role);
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" onClick={() => onNavigate('landing')}>
          ← Back to Home
        </Button>
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="font-['Poppins']">Create Your Account</CardTitle>
          <CardDescription>Step {step} of 5</CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}
          
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Choose Role */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-['Poppins'] mb-4">Choose Your Role</h3>
                  <RadioGroup value={role || 'farmer'} onValueChange={(value) => setRole(value as UserRole)}>
                    <div className="grid md:grid-cols-2 gap-4">
                      {roles.map((r) => (
                        <div key={r.value} className="relative">
                          <RadioGroupItem
                            value={r.value}
                            id={r.value}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={r.value}
                            className="flex flex-col items-start gap-3 rounded-xl border-2 border-muted bg-card p-4 hover:bg-accent cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                          >
                            <r.icon className="w-8 h-8 text-primary" />
                            <div>
                              <p className="font-['Poppins'] font-medium">{r.label}</p>
                              <p className="text-sm text-muted-foreground">{r.description}</p>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-['Poppins'] mb-4">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-input-background"
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-input-background"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-input-background"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Location & Phone */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-['Poppins'] mb-4">Location & Phone</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                    <SelectTrigger id="country" className="bg-input-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nigeria">Nigeria</SelectItem>
                      <SelectItem value="kenya">Kenya</SelectItem>
                      <SelectItem value="uganda">Uganda</SelectItem>
                      <SelectItem value="ghana">Ghana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-input-background"
                    placeholder="+234 801 234 5678"
                  />
                </div>
              </div>
            )}

            {/* Step 4: KYC Verification */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="font-['Poppins'] mb-4">KYC Verification</h3>
                <p className="text-sm text-muted-foreground">
                  Please upload a government-issued ID for verification. This helps us maintain trust in the ecosystem.
                </p>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="kyc-document"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => setFormData({ ...formData, kycDocument: e.target.files?.[0] || null })}
                    />
                    <label htmlFor="kyc-document" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <p className="font-medium">Upload Document</p>
                        <p className="text-sm text-muted-foreground">
                          {formData.kycDocument ? formData.kycDocument.name : 'PNG, JPG, PDF up to 10MB'}
                        </p>
                      </div>
                    </label>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    By uploading, you agree to our KYC verification process. Documents are securely stored and only used for verification purposes.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Wallet Setup */}
            {step === 5 && (
              <div className="space-y-4">
                <h3 className="font-['Poppins'] mb-4">Wallet Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to receive payments and participate in the blockchain ecosystem.
                </p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        formData.walletType === 'hashpack' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted hover:border-accent'
                      }`}
                      onClick={() => setFormData({ ...formData, walletType: 'hashpack' })}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">H</span>
                        </div>
                        <div>
                          <p className="font-['Poppins'] font-medium">HashPack</p>
                          <p className="text-xs text-muted-foreground">Recommended for Hedera</p>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                        formData.walletType === 'metamask' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted hover:border-accent'
                      }`}
                      onClick={() => setFormData({ ...formData, walletType: 'metamask' })}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-400 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">M</span>
                        </div>
                        <div>
                          <p className="font-['Poppins'] font-medium">MetaMask</p>
                          <p className="text-xs text-muted-foreground">Multi-chain support</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-['Poppins'] font-medium mb-2">Why connect a wallet?</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Receive payments in TUSD tokens</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Participate in escrow transactions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span>•</span>
                        <span>Access blockchain-verified certificates</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button 
                variant="outline" 
                onClick={handleBack}
                disabled={step === 1}
              >
                Back
              </Button>
              
              <Button 
                onClick={handleComplete}
                disabled={loading}
              >
                {loading ? (
                  'Processing...'
                ) : step === 5 ? (
                  'Complete Signup'
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}