import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Shield, 
  Search, 
  Filter, 
  Grid3x3, 
  List, 
  Award, 
  Clock,
  MapPin,
  DollarSign,
  CheckCircle,
  FileText,
  Gavel,
  LogOut,
  Menu,
  ArrowLeft,
  Check
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import type { Page, UserRole } from '../App';
import { Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

interface MarketplacePageProps {
  onNavigate: (page: Page) => void;
  userRole: UserRole;
  onLogout: () => void;
}

interface MarketplaceListing {
  id: string;
  animal_id: number;
  seller_id: string;
  price: number;
  currency: string;
  description: string;
  created_at: string;
  status: string;
  animals?: {
    id: number;
    tag_number: string;
    breed: string;
    age: number;
    weight: number;
    image_cid: string;
    vet_certified?: boolean;
    export_certified?: boolean;
    halal_certified?: boolean;
  };
  users?: {
    id: string;
    full_name: string;
  };
}

export default function MarketplacePage({ onNavigate, userRole, onLogout }: MarketplacePageProps) {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certificationFilter, setCertificationFilter] = useState({
    vetCertified: true,
    exportCertified: false,
    halalCertified: false
  });

  // Initialize Supabase client with proper configuration
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  // Fetch live marketplace listings directly from Supabase
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('marketplace_listings')
          .select(`
            *,
            animals(*),
            users(full_name)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Failed to fetch marketplace listings:', error);
          throw new Error(error.message || 'Failed to fetch marketplace listings');
        }
        
        // Filter listings based on certification requirements
        let filteredListings = data || [];
        
        // Only show vet certified animals by default
        if (certificationFilter.vetCertified) {
          filteredListings = filteredListings.filter((listing: any) => 
            listing.animals?.vet_certified === true
          );
        }
        
        // Additional filters for export/halal certified
        if (certificationFilter.exportCertified) {
          filteredListings = filteredListings.filter((listing: any) => 
            listing.animals?.export_certified === true
          );
        }
        
        if (certificationFilter.halalCertified) {
          filteredListings = filteredListings.filter((listing: any) => 
            listing.animals?.halal_certified === true
          );
        }
        
        setListings(filteredListings);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching marketplace listings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch marketplace listings');
        setLoading(false);
      }
    };
    
    fetchListings();
  }, [certificationFilter, supabase]);

  const handleGoBack = () => {
    // Navigate back to the user's dashboard based on their role
    switch (userRole) {
      case 'farmer':
        onNavigate('farmer-dashboard');
        break;
      case 'veterinarian':
        onNavigate('vet-dashboard');
        break;
      case 'abattoir':
        onNavigate('abattoir-dashboard');
        break;
      case 'transporter':
        onNavigate('transporter-dashboard');
        break;
      case 'regulator':
        onNavigate('regulator-dashboard');
        break;
      case 'admin':
        onNavigate('admin-dashboard');
        break;
      case 'buyer':
        // Buyers don't have a specific dashboard, so go to landing
        onNavigate('landing');
        break;
      default:
        // Fallback to farmer dashboard as default
        onNavigate('farmer-dashboard');
        break;
    }
  };

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-['Poppins'] mb-4">Filters</h3>
      </div>

      <div className="space-y-2">
        <Label>Country / Region</Label>
        <Select>
          <SelectTrigger className="bg-input-background">
            <SelectValue placeholder="All regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            <SelectItem value="nigeria">Nigeria</SelectItem>
            <SelectItem value="kenya">Kenya</SelectItem>
            <SelectItem value="ghana">Ghana</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Breed</Label>
        <Select>
          <SelectTrigger className="bg-input-background">
            <SelectValue placeholder="All breeds" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All breeds</SelectItem>
            <SelectItem value="fulani">White Fulani</SelectItem>
            <SelectItem value="gudali">Sokoto Gudali</SelectItem>
            <SelectItem value="bororo">Red Bororo</SelectItem>
            <SelectItem value="keteku">Keteku</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Certification</Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              className="rounded" 
              checked={certificationFilter.vetCertified}
              onChange={(e) => setCertificationFilter({...certificationFilter, vetCertified: e.target.checked})}
            />
            <span className="text-sm">Health Verified</span>
            {certificationFilter.vetCertified && <Check className="w-4 h-4 text-green-500" />}
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              className="rounded" 
              checked={certificationFilter.exportCertified}
              onChange={(e) => setCertificationFilter({...certificationFilter, exportCertified: e.target.checked})}
            />
            <span className="text-sm">Export Ready</span>
            {certificationFilter.exportCertified && <Check className="w-4 h-4 text-green-500" />}
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              className="rounded" 
              checked={certificationFilter.halalCertified}
              onChange={(e) => setCertificationFilter({...certificationFilter, halalCertified: e.target.checked})}
            />
            <span className="text-sm">Halal Ready</span>
            {certificationFilter.halalCertified && <Check className="w-4 h-4 text-green-500" />}
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Price Range (USDC)</Label>
        <div className="space-y-3">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={2000}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Listing Type</Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" defaultChecked />
            <span className="text-sm">Buy Now</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">Auction</span>
          </label>
        </div>
      </div>

      <Button className="w-full bg-primary hover:bg-primary/90">
        Apply Filters
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handleGoBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-3xl font-['Poppins'] font-bold">Marketplace</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setViewMode('grid')}>
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setViewMode('list')}>
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p>Loading listings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handleGoBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-3xl font-['Poppins'] font-bold">Marketplace</h1>
            </div>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-500">Error: {error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-['Poppins'] font-bold">Marketplace</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setViewMode('grid')}>
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setViewMode('list')}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-4">
                <FilterSidebar />
              </CardContent>
            </Card>
          </div>

          {/* Mobile Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden fixed bottom-4 right-4 z-10 rounded-full w-14 h-14 shadow-lg">
                <Filter className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <FilterSidebar />
            </SheetContent>
          </Sheet>

          {/* Listings */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">
                Showing {listings.length} certified livestock
              </p>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">All listings vet-certified</span>
              </div>
            </div>

            {listings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-['Poppins'] text-lg font-medium mb-2">No Listings Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No livestock available matching your certification filters.
                  </p>
                  <Button onClick={() => setCertificationFilter({
                    vetCertified: true,
                    exportCertified: false,
                    halalCertified: false
                  })}>
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      {listing.animals?.image_cid ? (
                        <img 
                          src={`https://ipfs.io/ipfs/${listing.animals.image_cid}`} 
                          alt={listing.animals.tag_number}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-muted flex items-center justify-center">
                          <FileText className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {listing.animals?.vet_certified && (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Vet
                          </Badge>
                        )}
                        {listing.animals?.export_certified && (
                          <Badge variant="default" className="bg-blue-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Export
                          </Badge>
                        )}
                        {listing.animals?.halal_certified && (
                          <Badge variant="default" className="bg-purple-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Halal
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-['Poppins'] font-medium">{listing.animals?.tag_number}</h3>
                        <span className="font-['Poppins'] font-bold text-lg">
                          {listing.price} {listing.currency}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {listing.animals?.breed}, {listing.animals?.age} years old
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Weight: {listing.animals?.weight} kg
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {listing.users?.full_name}
                        </span>
                        <Button size="sm" onClick={() => setSelectedAnimal(listing)}>
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <Card key={listing.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {listing.animals?.image_cid ? (
                          <img 
                            src={`https://ipfs.io/ipfs/${listing.animals.image_cid}`} 
                            alt={listing.animals.tag_number}
                            className="w-24 h-24 object-cover rounded"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-muted flex items-center justify-center rounded">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-['Poppins'] font-medium">{listing.animals?.tag_number}</h3>
                              <p className="text-sm text-muted-foreground">
                                {listing.animals?.breed}, {listing.animals?.age} years old
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Weight: {listing.animals?.weight} kg
                              </p>
                            </div>
                            <span className="font-['Poppins'] font-bold text-lg">
                              {listing.price} {listing.currency}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            {listing.animals?.vet_certified && (
                              <Badge variant="default" className="bg-green-500 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Vet Certified
                              </Badge>
                            )}
                            {listing.animals?.export_certified && (
                              <Badge variant="default" className="bg-blue-500 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Export Certified
                              </Badge>
                            )}
                            {listing.animals?.halal_certified && (
                              <Badge variant="default" className="bg-purple-500 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Halal Certified
                              </Badge>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Seller: {listing.users?.full_name}
                            </span>
                            <Button size="sm" onClick={() => setSelectedAnimal(listing)}>
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animal Detail Dialog */}
      {selectedAnimal && (
        <Dialog open={!!selectedAnimal} onOpenChange={() => setSelectedAnimal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-['Poppins']">{selectedAnimal.animals?.tag_number}</DialogTitle>
              <DialogDescription>
                {selectedAnimal.animals?.breed}, {selectedAnimal.animals?.age} years old
              </DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-6">
              {selectedAnimal.animals?.image_cid ? (
                <img 
                  src={`https://ipfs.io/ipfs/${selectedAnimal.animals.image_cid}`} 
                  alt={selectedAnimal.animals.tag_number}
                  className="w-full h-64 object-cover rounded"
                />
              ) : (
                <div className="w-full h-64 bg-muted flex items-center justify-center rounded">
                  <FileText className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-['Poppins'] font-medium mb-2">Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Weight:</span>
                      <span>{selectedAnimal.animals?.weight} kg</span>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-['Poppins'] font-bold">{selectedAnimal.price} {selectedAnimal.currency}</span>
                      <span className="text-muted-foreground">Seller:</span>
                      <span>{selectedAnimal.users?.full_name}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-['Poppins'] font-medium mb-2">Certifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAnimal.animals?.vet_certified && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Vet Certified
                        </Badge>
                      )}
                      {selectedAnimal.animals?.export_certified && (
                        <Badge variant="default" className="bg-blue-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Export Certified
                        </Badge>
                      )}
                      {selectedAnimal.animals?.halal_certified && (
                        <Badge variant="default" className="bg-purple-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Halal Certified
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedAnimal.description}
                    </p>
                    <Button className="w-full">
                      <Gavel className="w-4 h-4 mr-2" />
                      Place Bid
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}