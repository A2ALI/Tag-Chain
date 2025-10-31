import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  Shield, 
  MapPin, 
  Users, 
  FileCheck, 
  Wallet, 
  TrendingUp, 
  Tractor,
  Stethoscope,
  Building2,
  Truck,
  CheckCircle,
  QrCode,
  DollarSign,
  Globe,
  Award,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Page } from '../App';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
  onNavigateWithRole?: (role: any) => void;
}

export default function LandingPage({ onNavigate, onNavigateWithRole }: LandingPageProps) {
  const features = [
    {
      icon: QrCode,
      title: 'Traceability (RFID + QR)',
      description: 'Track every animal from birth to market with blockchain-verified records.'
    },
    {
      icon: Stethoscope,
      title: 'Verified Veterinarians',
      description: 'Licensed vets provide certified health records with digital signatures.'
    },
    {
      icon: Shield,
      title: 'Smart Contracts',
      description: 'Secure escrow payments that protect both buyers and sellers.'
    },
    {
      icon: DollarSign,
      title: 'Stablecoin Payments',
      description: 'Cross-border transactions with USDC, auto-converted to local currency.'
    },
    {
      icon: Award,
      title: 'Export & Halal Certification',
      description: 'NFT-based certificates for international trade and religious compliance.'
    },
    {
      icon: AlertTriangle,
      title: 'Early Warning System',
      description: 'Real-time alerts for disease outbreaks and weather threats.'
    }
  ];

  const roles = [
    {
      icon: Tractor,
      title: 'Farmer',
      description: 'Register your herd, list animals for sale, and earn from verified livestock.',
      color: 'bg-[#004643]'
    },
    {
      icon: Stethoscope,
      title: 'Veterinarian',
      description: 'Certify animal health, earn rewards, and build your professional reputation.',
      color: 'bg-[#2A9D8F]'
    },
    {
      icon: Building2,
      title: 'Abattoir',
      description: 'Purchase verified cattle, track processing, and request export certifications.',
      color: 'bg-[#F4A261]'
    },
    {
      icon: Users,
      title: 'Buyer',
      description: 'Browse certified livestock, negotiate prices, and buy with confidence.',
      color: 'bg-[#E76F51]'
    },
    {
      icon: Truck,
      title: 'Transporter',
      description: 'Accept delivery contracts, track shipments, and build customer ratings.',
      color: 'bg-[#264653]'
    },
    {
      icon: CheckCircle,
      title: 'Regulator',
      description: 'Approve certifications, monitor compliance, and ensure food safety.',
      color: 'bg-[#004643]'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="font-['Poppins'] font-semibold text-xl">Tag Chain</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => onNavigate('marketplace')}>Marketplace</Button>
            <Button variant="ghost" onClick={() => onNavigate('login')}>Login</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => onNavigate('signup')}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-['Poppins'] mb-6">
                Trust, Trace & Trade Africa's Cattle with Tag Chain
              </h1>
              <p className="text-xl mb-8 text-muted-foreground">
                Blockchain-powered livestock traceability and marketplace for Africa. 
                Built on Hedera for transparency, security, and cross-border trade.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => onNavigate('signup')}
                >
                  Get Started
                </Button>
                <Button size="lg" variant="outline">
                  Watch Demo
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl shadow-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1608671071793-db93efcf33df?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2071" 
                  alt="Cattle in field" 
                  className="w-full h-full object-cover aspect-video"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-['Poppins'] mb-4">Comprehensive Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build trust and transparency in livestock trade
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-6 bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="font-['Poppins']">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-['Poppins'] mb-4">Join as Your Role</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tag Chain serves every stakeholder in the livestock value chain
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="p-6 bg-card rounded-xl border text-center hover:shadow-lg transition-all cursor-pointer"
                onClick={() => onNavigate(role.page as Page)}
              >
                <Card className="h-full hover:shadow-lg transition-shadow group cursor-pointer">
                  <CardHeader>
                    <div className={`w-12 h-12 ${role.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <role.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="font-['Poppins']">{role.title}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigateWithRole) {
                          onNavigateWithRole(role.title.toLowerCase());
                        } else {
                          onNavigate('signup');
                        }
                      }}
                    >
                      Join as {role.title}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Early Warning System Teaser */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-['Poppins'] mb-4">Early Warning System</h2>
              <p className="text-muted-foreground mb-6">
                Stay ahead of disease outbreaks, weather threats, and market disruptions with 
                real-time alerts powered by AI and satellite data.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                  <div>
                    <p className="font-['Poppins'] font-medium">Disease Outbreak Alerts</p>
                    <p className="text-sm text-muted-foreground">Immediate notifications of livestock diseases in your region</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2" />
                  <div>
                    <p className="font-['Poppins'] font-medium">Weather Risk Warnings</p>
                    <p className="text-sm text-muted-foreground">Prepare for floods, droughts, and extreme conditions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                  <div>
                    <p className="font-['Poppins'] font-medium">Market Intelligence</p>
                    <p className="text-sm text-muted-foreground">Feed prices, demand trends, and trading opportunities</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-0">
              <CardContent className="p-8">
                <div className="relative aspect-square rounded-xl bg-card overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="w-32 h-32 text-muted-foreground/20" />
                  </div>
                  {/* Simulated alerts */}
                  {[
                    { color: 'bg-red-500', top: '20%', left: '30%' },
                    { color: 'bg-yellow-500', top: '60%', left: '50%' },
                    { color: 'bg-green-500', top: '40%', left: '70%' }
                  ].map((alert, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-4 h-4 ${alert.color} rounded-full`}
                      style={{ top: alert.top, left: alert.left }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6" />
                <span className="font-['Poppins'] font-semibold">Tag Chain</span>
              </div>
              <p className="text-sm opacity-90">
                Blockchain livestock traceability for Africa
              </p>
            </div>
            
            <div>
              <h4 className="font-['Poppins'] mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><button className="opacity-90 hover:opacity-100" onClick={() => onNavigate('marketplace')}>Marketplace</button></li>
                <li><button className="opacity-90 hover:opacity-100">About Us</button></li>
                <li><button className="opacity-90 hover:opacity-100">How It Works</button></li>
                <li><button className="opacity-90 hover:opacity-100">FAQs</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-['Poppins'] mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><button className="opacity-90 hover:opacity-100">Documentation</button></li>
                <li><button className="opacity-90 hover:opacity-100">API</button></li>
                <li><button className="opacity-90 hover:opacity-100">Support</button></li>
                <li><button className="opacity-90 hover:opacity-100">Blog</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-['Poppins'] mb-4">Contact</h4>
              <p className="text-sm opacity-90 mb-2">support@tagchain.africa</p>
              <div className="flex gap-3 mt-4">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 cursor-pointer">
                  <span className="text-xs">🐦</span>
                </div>
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 cursor-pointer">
                  <span className="text-xs">📘</span>
                </div>
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 cursor-pointer">
                  <span className="text-xs">💼</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs opacity-75">Powered by Hedera</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm opacity-75">
            <p>&copy; 2025 Tag Chain. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
