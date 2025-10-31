import { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';
import { Clock, Gavel, DollarSign, MapPin } from 'lucide-react';
import type { Page } from '../App';

interface Auction {
  id: string;
  animal_id: string;
  animal_breed: string;
  animal_weight: string;
  starting_price: number;
  current_bid: number;
  bid_count: number;
  end_time: string;
  location: string;
  farmer: string;
  farmer_id: string;
  image: string;
  certifications: string[];
}

interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  bidder_name: string;
  amount: number;
  timestamp: string;
}

interface AuctionsPageProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function AuctionsPage({ onNavigate, onLogout }: AuctionsPageProps) {
  const [auctions, setAuctions] = useState<Auction[]>([
    {
      id: 'auction_1',
      animal_id: 'TC-020-NG',
      animal_breed: 'White Fulani',
      animal_weight: '420kg',
      starting_price: 800,
      current_bid: 850,
      bid_count: 3,
      end_time: '2025-10-25T14:30:00Z',
      location: 'Kaduna, Nigeria',
      farmer: 'John Farmer',
      farmer_id: 'farmer_123',
      image: 'cattle',
      certifications: ['Health Verified', 'Halal Ready']
    },
    {
      id: 'auction_2',
      animal_id: 'TC-021-NG',
      animal_breed: 'Sokoto Gudali',
      animal_weight: '380kg',
      starting_price: 700,
      current_bid: 720,
      bid_count: 5,
      end_time: '2025-10-24T16:45:00Z',
      location: 'Kano, Nigeria',
      farmer: 'Aisha Mohammed',
      farmer_id: 'farmer_456',
      image: 'cattle',
      certifications: ['Health Verified', 'Export Ready']
    },
    {
      id: 'auction_3',
      animal_id: 'TC-022-NG',
      animal_breed: 'Red Bororo',
      animal_weight: '450kg',
      starting_price: 900,
      current_bid: 950,
      bid_count: 7,
      end_time: '2025-10-26T10:15:00Z',
      location: 'Plateau, Nigeria',
      farmer: 'Ibrahim Musa',
      farmer_id: 'farmer_789',
      image: 'cattle',
      certifications: ['Health Verified', 'Premium Grade']
    }
  ]);
  
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bids, setBids] = useState<Bid[]>([
    {
      id: 'bid_1',
      auction_id: 'auction_1',
      bidder_id: 'buyer_1',
      bidder_name: 'Premium Abattoir Ltd',
      amount: 850,
      timestamp: '2025-10-23T14:30:00Z'
    },
    {
      id: 'bid_2',
      auction_id: 'auction_1',
      bidder_id: 'buyer_2',
      bidder_name: 'Kano Livestock Co.',
      amount: 830,
      timestamp: '2025-10-23T14:15:00Z'
    },
    {
      id: 'bid_3',
      auction_id: 'auction_1',
      bidder_id: 'buyer_3',
      bidder_name: 'Abuja Supermarket',
      amount: 810,
      timestamp: '2025-10-23T14:00:00Z'
    }
  ]);

  const handlePlaceBid = () => {
    if (!selectedAuction || !bidAmount) return;
    
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= selectedAuction.current_bid) {
      alert(`Bid must be higher than current bid of $${selectedAuction.current_bid}`);
      return;
    }
    
    // Create new bid
    const newBid: Bid = {
      id: `bid_${Date.now()}`,
      auction_id: selectedAuction.id,
      bidder_id: 'current_user', // Would be actual user ID
      bidder_name: 'Current User', // Would be actual user name
      amount: amount,
      timestamp: new Date().toISOString()
    };
    
    // Update bids
    setBids([newBid, ...bids]);
    
    // Update auction
    setAuctions(auctions.map(auction => 
      auction.id === selectedAuction.id 
        ? { ...auction, current_bid: amount, bid_count: auction.bid_count + 1 } 
        : auction
    ));
    
    // Update selected auction
    if (selectedAuction) {
      setSelectedAuction({ ...selectedAuction, current_bid: amount, bid_count: selectedAuction.bid_count + 1 });
    }
    
    setBidAmount('');
    alert('Bid placed successfully!');
  };

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Ended';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <DashboardLayout
      sidebarItems={[]}
      title="Live Auctions"
      onNavigate={onNavigate}
      onLogout={onLogout}
      walletBalance="$1,245.00"
      notifications={[]}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Poppins'] text-2xl font-bold">Live Auctions</h1>
            <p className="text-muted-foreground">Bid on premium livestock from verified farmers</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Clock className="w-4 h-4 mr-2" />
              Ending Soon
            </Button>
            <Button variant="outline">
              <DollarSign className="w-4 h-4 mr-2" />
              Highest Bids
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction: any, index: number) => (
            <motion.div
              key={auction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
                <div className="text-6xl">🐄</div>
                <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  {getTimeRemaining(auction.end_time)}
                </Badge>
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-['Poppins']">{auction.animal_id}</CardTitle>
                    <CardDescription>{auction.animal_breed} • {auction.animal_weight}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    {auction.certifications.map((cert: any) => (
                      <div 
                        key={cert} 
                        className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center" 
                        title={cert}
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Bid</p>
                    <p className="font-['Poppins'] text-xl">${auction.current_bid}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Starting Price</p>
                    <p className="font-['Poppins']">${auction.starting_price}</p>
                  </div>
                </div>

                <div className="p-2 bg-accent/10 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">{auction.bid_count}</span> bids
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{auction.location}</span>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => setSelectedAuction(auction)}
                    >
                      <Gavel className="w-4 h-4 mr-2" />
                      Place Bid
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-['Poppins']">
                        Place Bid on {selectedAuction?.animal_id}
                      </DialogTitle>
                    </DialogHeader>
                    {selectedAuction && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label>Current Highest Bid</Label>
                            <p className="font-['Poppins'] text-lg">${selectedAuction.current_bid}</p>
                          </div>
                          <div>
                            <Label>Your Bid</Label>
                            <div className="flex gap-2">
                              <span className="flex items-center">$</span>
                              <Input
                                type="number"
                                placeholder="Enter your bid"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                min={selectedAuction.current_bid + 10}
                                className="bg-input-background"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-3">
                          <h4 className="font-['Poppins'] text-sm font-medium mb-2">Recent Bids</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {bids
                              .filter(bid => bid.auction_id === selectedAuction.id)
                              .slice(0, 3)
                              .map((bid: any) => (
                                <div key={bid.id} className="flex justify-between text-sm">
                                  <span>{bid.bidder_name}</span>
                                  <span className="font-['Poppins']">${bid.amount}</span>
                                </div>
                              ))}
                            {bids.filter(bid => bid.auction_id === selectedAuction.id).length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-2">
                                No bids yet. Be the first!
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedAuction(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            className="flex-1 bg-primary hover:bg-primary/90"
                            onClick={handlePlaceBid}
                            disabled={!bidAmount || parseFloat(bidAmount) <= selectedAuction.current_bid}
                          >
                            Place Bid
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-['Poppins']">How Auctions Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="font-['Poppins'] font-semibold mb-1">Place Bid</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your bid amount higher than the current highest bid
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="font-['Poppins'] font-semibold mb-1">Win Auction</h3>
                <p className="text-sm text-muted-foreground">
                  Highest bidder when auction ends wins the livestock
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="font-['Poppins'] font-semibold mb-1">Secure Transfer</h3>
                <p className="text-sm text-muted-foreground">
                  Funds held in escrow until delivery confirmation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}