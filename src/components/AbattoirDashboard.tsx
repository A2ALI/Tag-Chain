import { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Factory,
  Package,
  Plus,
  CheckCircle,
  AlertCircle,
  Calendar,
  Eye,
  Beef
} from 'lucide-react';
import type { Page } from '../App';
import { useAuth } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

interface AbattoirDashboardProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function AbattoirDashboard({ onNavigate, onLogout }: AbattoirDashboardProps) {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('animals');
  const [animals, setAnimals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [abattoirs, setAbattoirs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    abattoir_id: '',
    animal_id: '',
    product_type: '',
    weight: '',
    price: '',
    currency: 'USDC',
    sale_date: new Date().toISOString().split('T')[0]
  });

  // Initialize Supabase client
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Fetch all data from Supabase directly
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        console.log('No user ID found, skipping data fetch');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch abattoir facilities
        try {
          const { data: abattoirsData, error: abattoirsError } = await supabase
            .from('abattoirs')
            .select('*')
            .order('name');
          
          if (abattoirsError) {
            console.error('Failed to fetch abattoirs:', abattoirsError);
            // Fallback to mock data if API fails
            setAbattoirs([
              { id: 1, name: 'Premium Beef Abattoir', location: 'Lagos', license_number: 'LGA-001', is_licensed_export: true },
              { id: 2, name: 'Quality Meat Processors', location: 'Abuja', license_number: 'FCT-002', is_licensed_export: false }
            ]);
          } else {
            setAbattoirs(abattoirsData || []);
          }
        } catch (err) {
          console.error('Error fetching abattoirs:', err);
          // Fallback to mock data if API fails
          setAbattoirs([
            { id: 1, name: 'Premium Beef Abattoir', location: 'Lagos', license_number: 'LGA-001', is_licensed_export: true },
            { id: 2, name: 'Quality Meat Processors', location: 'Abuja', license_number: 'FCT-002', is_licensed_export: false }
          ]);
        }
        
        // Fetch inbound animals ready for slaughter
        try {
          const { data: animalsData, error: animalsError } = await supabase
            .from('animals')
            .select('*')
            .eq('status', 'ready_for_slaughter')
            .order('created_at', { ascending: false });
          
          if (animalsError) {
            console.error('Failed to fetch animals:', animalsError);
            // Fallback to mock data if API fails
            setAnimals([
              { id: 1, tag_id: 'TC-001-NG', breed: 'Brahman', age: 3, weight: 650, vet_certified: true },
              { id: 2, tag_id: 'TC-002-NG', breed: 'Angus', age: 2, weight: 580, vet_certified: true },
              { id: 3, tag_id: 'TC-003-NG', breed: 'Hereford', age: 4, weight: 720, vet_certified: false }
            ]);
          } else {
            setAnimals(animalsData || []);
          }
        } catch (err) {
          console.error('Error fetching animals:', err);
          // Fallback to mock data if API fails
          setAnimals([
            { id: 1, tag_id: 'TC-001-NG', breed: 'Brahman', age: 3, weight: 650, vet_certified: true },
            { id: 2, tag_id: 'TC-002-NG', breed: 'Angus', age: 2, weight: 580, vet_certified: true },
            { id: 3, tag_id: 'TC-003-NG', breed: 'Hereford', age: 4, weight: 720, vet_certified: false }
          ]);
        }
        
        // Fetch processed products
        try {
          const { data: productsData, error: productsError } = await supabase
            .from('processed_products')
            .select('*')
            .order('sale_date', { ascending: false });
          
          if (productsError) {
            console.error('Failed to fetch products:', productsError);
            // Fallback to mock data if API fails
            setProducts([
              { id: 1, product_type: 'Beef Cuts', weight: 420, price: 2100, currency: 'USDC', sale_date: '2025-10-20' },
              { id: 2, product_type: 'Hides', weight: 45, price: 225, currency: 'USDC', sale_date: '2025-10-20' }
            ]);
          } else {
            setProducts(productsData || []);
          }
        } catch (err) {
          console.error('Error fetching products:', err);
          // Fallback to mock data if API fails
          setProducts([
            { id: 1, product_type: 'Beef Cuts', weight: 420, price: 2100, currency: 'USDC', sale_date: '2025-10-20' },
            { id: 2, product_type: 'Hides', weight: 45, price: 225, currency: 'USDC', sale_date: '2025-10-20' }
          ]);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, supabase]);

  const sidebarItems = [
    { icon: Factory, label: 'Facilities', active: activeView === 'facilities', onClick: () => setActiveView('facilities') },
    { icon: Beef, label: 'Inbound Animals', active: activeView === 'animals', onClick: () => setActiveView('animals') },
    { icon: Package, label: 'Products', active: activeView === 'products', onClick: () => setActiveView('products') },
    { icon: Plus, label: 'Add Product', active: activeView === 'add', onClick: () => setActiveView('add') }
  ];

  const handleAddProduct = async () => {
    try {
      // Verify vet certification before adding product
      const { data: certificationData, error: certificationError } = await supabase
        .from('vet_records')
        .select('is_certified')
        .eq('animal_id', newProduct.animal_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (certificationError || !certificationData?.is_certified) {
        alert('Animal must be vet-certified before processing');
        return;
      }
      
      // Insert the new product
      const { data: productData, error: productError } = await supabase
        .from('processed_products')
        .insert([{
          abattoir_id: parseInt(newProduct.abattoir_id),
          animal_id: parseInt(newProduct.animal_id),
          product_type: newProduct.product_type,
          weight: parseFloat(newProduct.weight),
          price: parseFloat(newProduct.price),
          currency: newProduct.currency,
          sale_date: newProduct.sale_date
        }])
        .select()
        .single();
      
      if (productError) {
        console.error('Failed to add product:', productError);
        return;
      }
      
      // Refresh products
      const { data: productsData, error: productsError } = await supabase
        .from('processed_products')
        .select('*')
        .order('sale_date', { ascending: false });
      
      if (!productsError) {
        setProducts(productsData || []);
      }
      
      setShowAddProductDialog(false);
      setNewProduct({
        abattoir_id: '',
        animal_id: '',
        product_type: '',
        weight: '',
        price: '',
        currency: 'USDC',
        sale_date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  const verifyCertification = async (animalId: string) => {
    try {
      const { data: certificationData, error: certificationError } = await supabase
        .from('vet_records')
        .select(`
          is_certified,
          record_type,
          created_at
        `)
        .eq('animal_id', animalId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (certificationError) {
        console.error('Failed to verify certification:', certificationError);
        return;
      }
      
      alert(`Certification Status:\nCertified: ${certificationData.is_certified}\nLatest Record: ${certificationData.record_type || 'None'}`);
    } catch (err) {
      console.error('Error verifying certification:', err);
    }
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      title="Abattoir Dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      walletBalance="$12,450.00"
      notifications={[]}
    >
      <div className="p-6 space-y-6">
        {/* Facilities */}
        {activeView === 'facilities' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Abattoir Facilities</CardTitle>
              <CardDescription>Registered abattoir facilities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Export Certified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {abattoirs.map((abattoir) => (
                    <TableRow key={abattoir.id}>
                      <TableCell className="font-medium">{abattoir.name}</TableCell>
                      <TableCell>{abattoir.location}</TableCell>
                      <TableCell>{abattoir.license_number}</TableCell>
                      <TableCell>
                        {abattoir.is_licensed_export ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Inbound Animals */}
        {activeView === 'animals' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Inbound Animals</CardTitle>
              <CardDescription>Animals ready for processing</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag Number</TableHead>
                    <TableHead>Breed</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>Certification</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {animals.map((animal) => (
                    <TableRow key={animal.id}>
                      <TableCell className="font-medium">{animal.tag_id}</TableCell>
                      <TableCell>{animal.breed}</TableCell>
                      <TableCell>{animal.age} years</TableCell>
                      <TableCell>{animal.weight}</TableCell>
                      <TableCell>
                        {animal.vet_certified ? (
                          <Badge variant="default">Certified</Badge>
                        ) : (
                          <Badge variant="destructive">Not Certified</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => verifyCertification(animal.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify
                          </Button>
                          <Button variant="outline" size="sm" disabled={!animal.vet_certified}>
                            <Beef className="w-4 h-4 mr-2" />
                            Process
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Products */}
        {activeView === 'products' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Processed Products</CardTitle>
              <CardDescription>Products ready for sale</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Type</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Sale Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.product_type}</TableCell>
                      <TableCell>{product.weight}</TableCell>
                      <TableCell>{product.price}</TableCell>
                      <TableCell>{product.currency}</TableCell>
                      <TableCell>{product.sale_date}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Add Product */}
        {activeView === 'add' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Add Processed Product</CardTitle>
              <CardDescription>Register a new processed product for sale</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="abattoir">Abattoir</Label>
                    <Select 
                      value={newProduct.abattoir_id} 
                      onValueChange={(value) => setNewProduct({...newProduct, abattoir_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select abattoir" />
                      </SelectTrigger>
                      <SelectContent>
                        {abattoirs.map((abattoir) => (
                          <SelectItem key={abattoir.id} value={abattoir.id.toString()}>
                            {abattoir.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="animal">Animal</Label>
                    <Select 
                      value={newProduct.animal_id} 
                      onValueChange={(value) => setNewProduct({...newProduct, animal_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select animal" />
                      </SelectTrigger>
                      <SelectContent>
                        {animals.map((animal) => (
                          <SelectItem key={animal.id} value={animal.id.toString()}>
                            {animal.tag_id} - {animal.breed}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="product-type">Product Type</Label>
                    <Select 
                      value={newProduct.product_type} 
                      onValueChange={(value) => setNewProduct({...newProduct, product_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beef_cuts">Beef Cuts</SelectItem>
                        <SelectItem value="hides">Hides</SelectItem>
                        <SelectItem value="offal">Offal</SelectItem>
                        <SelectItem value="bones">Bones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={newProduct.weight}
                      onChange={(e) => setNewProduct({...newProduct, weight: e.target.value})}
                      placeholder="Enter weight"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      placeholder="Enter price"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={newProduct.currency} 
                      onValueChange={(value) => setNewProduct({...newProduct, currency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="HBAR">HBAR</SelectItem>
                        <SelectItem value="NGN">NGN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="sale-date">Sale Date</Label>
                  <Input
                    id="sale-date"
                    type="date"
                    value={newProduct.sale_date}
                    onChange={(e) => setNewProduct({...newProduct, sale_date: e.target.value})}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleAddProduct}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}