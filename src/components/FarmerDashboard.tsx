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
  LayoutDashboard,
  Package2,
  Plus,
  ShoppingCart,
  TrendingUp,
  Wallet,
  Bell,
  Settings,
  Eye,
  MapPin,
  DollarSign,
  FileText,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Page } from '../App';
import ErrorBoundary from './ErrorBoundary';
import { useAuth } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

interface FarmerDashboardProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function FarmerDashboard({ onNavigate, onLogout }: FarmerDashboardProps) {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);
  const [showAddAnimalDialog, setShowAddAnimalDialog] = useState(false);
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthStats, setHealthStats] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Add Animal form state
  const [newAnimal, setNewAnimal] = useState({
    tag_id: '',
    breed: '',
    sex: '',
    dob: '',
    gps_lat: '',
    gps_lng: '',
    notes: ''
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

  // Helper function to get color for health status
  const getColorForHealthStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return '#10B981'; // green
      case 'ill': return '#EF4444'; // red
      case 'recovering': return '#F59E0B'; // amber
      case 'quarantined': return '#8B5CF6'; // violet
      default: return '#6B7280'; // gray
    }
  };

  // Fetch all data from Supabase directly
  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      // Only call fetch functions after confirming user?.id exists
      if (!user?.id) {
        console.log('No user ID found, skipping data fetch');
        setLoading(false);
        return null;
      }
      
      console.log('Supabase user:', user);
      console.log('Headers check:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Key found' : 'Key missing');
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch animals directly from Supabase with proper error handling
        try {
          const { data: animalsData, error: animalsError } = await supabase
            .from('animals')
            .select('*')
            .eq('farmer_id', user.id)
            .order('registered_at', { ascending: false })
            .limit(200);
          
          if (animalsError) {
            console.error('Failed to fetch animals:', animalsError);
          } else if (!cancelled) {
            setAnimals(animalsData || []);
          }
        } catch (err) {
          console.error('Error fetching animals:', err);
        }
        
        // Fetch health stats by grouping animals by health status
        try {
          const { data: animalsData, error: healthError } = await supabase
            .from('animals')
            .select('health_status')
            .eq('farmer_id', user.id);
          
          if (healthError) {
            console.error('Failed to fetch health stats:', healthError);
          } else if (!cancelled) {
            // Group animals by health status
            const healthCounts: { [key: string]: number } = {};
            animalsData.forEach((animal: any) => {
              const status = animal.health_status || 'unknown';
              healthCounts[status] = (healthCounts[status] || 0) + 1;
            });

            // Format the data for the frontend
            const healthStatsData = Object.keys(healthCounts).map(healthStatus => ({
              name: healthStatus,
              value: healthCounts[healthStatus],
              color: getColorForHealthStatus(healthStatus)
            }));
            
            setHealthStats(healthStatsData);
          }
        } catch (err) {
          console.error('Error fetching health stats:', err);
        }
        
        // Fetch profit data (using mock data for now as in the original function)
        try {
          if (!cancelled) {
            const profitData = [
              { month: 'Jan', revenue: 4500, expenses: 2000 },
              { month: 'Feb', revenue: 3800, expenses: 1800 },
              { month: 'Mar', revenue: 5200, expenses: 2200 },
              { month: 'Apr', revenue: 4900, expenses: 2100 },
              { month: 'May', revenue: 5600, expenses: 2300 },
              { month: 'Jun', revenue: 6100, expenses: 2500 }
            ];
            setProfitData(profitData);
          }
        } catch (err) {
          console.error('Error setting profit data:', err);
        }
        
        // Fetch alerts from EWS
        try {
          const { data: alertsData, error: alertsError } = await supabase
            .from('ews_alerts')
            .select(`
              *,
              farms (id, name, gps_lat, gps_lng)
            `)
            .order('created_at', { ascending: false })
            .limit(100);
          
          if (alertsError) {
            console.error('Failed to fetch alerts:', alertsError);
            // Use mock data if there's an error
            const mockAlerts = [
              { 
                id: '1', 
                type: 'Disease', 
                title: 'Lumpy Skin Disease Outbreak', 
                location: 'Kaduna State', 
                severity: 'High', 
                timestamp: '2 hours ago',
                description: 'Confirmed cases in 3 farms. Immediate vaccination recommended.',
                acknowledged: false
              },
              { 
                id: '2', 
                type: 'Weather', 
                title: 'Severe Drought Warning', 
                location: 'Kano State', 
                severity: 'Medium', 
                timestamp: '5 hours ago',
                description: 'Water scarcity affecting grazing lands. Plan alternative arrangements.',
                acknowledged: true
              },
              { 
                id: '3', 
                type: 'Market', 
                title: 'Price Surge Alert', 
                location: 'Abuja Market', 
                severity: 'Low', 
                timestamp: '1 day ago',
                description: 'Cattle prices up 15% due to seasonal demand.',
                acknowledged: false
              }
            ];
            
            if (!cancelled) {
              setAlerts(mockAlerts);
            }
          } else if (!cancelled) {
            setAlerts(alertsData || []);
          }
        } catch (err) {
          console.error('Error fetching alerts:', err);
        }
        
        // Fetch notifications with fallback to mock data
        try {
          // First try to fetch from notifications table
          const { data: notificationsData, error: notificationsError } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (notificationsError) {
            console.error('Failed to fetch notifications:', notificationsError);
            // Use mock data if there's an error
            const mockNotifications = [
              { id: '1', title: 'System Update', message: 'Platform maintenance scheduled for tonight', time: '2 hours ago', read: false },
              { id: '2', title: 'New Feature', message: 'Check out the new analytics dashboard', time: '1 day ago', read: false }
            ];
            
            if (!cancelled) {
              setNotifications(mockNotifications);
            }
          } else if (!cancelled) {
            // Format the data for the frontend
            const formattedNotifications = notificationsData.map((notification: any) => ({
              id: notification.id,
              title: notification.title,
              message: notification.message,
              time: notification.created_at ? new Date(notification.created_at).toLocaleString() : 'Unknown time',
              read: notification.read || false
            }));
            
            setNotifications(formattedNotifications);
          }
        } catch (err) {
          console.error('Error in fetchData:', err);
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
          }
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  // Add better console logging
  if (!user?.id) {
    console.log('No user ID found, returning null');
    return null;
  }

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Overview', active: activeView === 'overview', onClick: () => setActiveView('overview') },
    { icon: Package2, label: 'My Herd', active: activeView === 'herd', onClick: () => setActiveView('herd') },
    { icon: Plus, label: 'Add Animal', active: activeView === 'add', onClick: () => setActiveView('add') },
    { icon: ShoppingCart, label: 'Marketplace', active: activeView === 'marketplace', onClick: () => onNavigate('marketplace') },
    { icon: Wallet, label: 'Wallet', active: activeView === 'wallet', onClick: () => onNavigate('wallet') },
    { icon: FileText, label: 'Escrow', active: activeView === 'escrow', onClick: () => onNavigate('escrow') },
    { icon: TrendingUp, label: 'Analytics', active: activeView === 'analytics', onClick: () => setActiveView('analytics') },
    { icon: AlertCircle, label: 'Early Warning', active: activeView === 'ews', onClick: () => onNavigate('ews') },
    { icon: Bell, label: 'Alerts', active: activeView === 'alerts', onClick: () => setActiveView('alerts'), badge: alerts.length },
    { icon: Settings, label: 'Settings', active: activeView === 'settings', onClick: () => setActiveView('settings') }
  ];

  // Refresh animals after adding a new one
  const handleAnimalAdded = async () => {
    try {
      const { data, error } = await supabase
        .from('animals')
        .select('*')
        .eq('farmer_id', user?.id)
        .order('registered_at', { ascending: false });
      
      if (error) {
        console.error('Failed to refresh animals:', error);
      } else {
        setAnimals(data || []);
      }
    } catch (err) {
      console.error('Error refreshing animals:', err);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewAnimal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setNewAnimal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleAddAnimal = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Call the API endpoint to register animal on-chain
      const response = await fetch('/.netlify/functions/api/animals/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tag_id: newAnimal.tag_id,
          owner_id: user.id,
          breed: newAnimal.breed,
          sex: newAnimal.sex,
          dob: newAnimal.dob || null,
          gps_lat: newAnimal.gps_lat || null,
          gps_lng: newAnimal.gps_lng || null,
          notes: newAnimal.notes || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register animal');
      }

      const data = await response.json();
      console.log('Animal registered on-chain:', data);

      // Reset form
      setNewAnimal({
        tag_id: '',
        breed: '',
        sex: '',
        dob: '',
        gps_lat: '',
        gps_lng: '',
        notes: ''
      });

      // Close dialog
      setShowAddAnimalDialog(false);

      // Refresh animal list
      handleAnimalAdded();

      alert('Animal registered successfully on blockchain!');
    } catch (err) {
      console.error('Error registering animal:', err);
      alert(err instanceof Error ? err.message : 'Failed to register animal');
    }
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      title="Farmer Dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      walletBalance="$1,245.50"
      notifications={notifications}
    >
      <div className="p-6 space-y-6">
        {/* Overview */}
        {activeView === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Herd</CardDescription>
                  <CardTitle className="font-['Poppins']">
                    {loading ? 'Loading...' : animals.length}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    <span className="text-green-600">+2</span> this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Active Listings</CardDescription>
                  <CardTitle className="font-['Poppins']">0</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="link" className="px-0" onClick={() => setActiveView('marketplace')}>
                    List an animal
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Health Status</CardDescription>
                  <CardTitle className="font-['Poppins']">Excellent</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">All animals healthy</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Alerts</CardDescription>
                  <CardTitle className="font-['Poppins']">{alerts.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="link" className="px-0" onClick={() => setActiveView('alerts')}>
                    View alerts
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-['Poppins']">Herd Health Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="h-80 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                  ) : healthStats.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={healthStats}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(Number(percent) * 100).toFixed(0)}%`}
                          >
                            {healthStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="w-12 h-12 mb-4" />
                      <p>No health data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-['Poppins']">Profit & Loss</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={profitData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                        <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins']">Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="animate-pulse rounded-full bg-muted h-10 w-10" />
                        <div className="space-y-2 flex-1">
                          <div className="animate-pulse h-4 bg-muted rounded w-3/4"></div>
                          <div className="animate-pulse h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : alerts.length > 0 ? (
                  <div className="space-y-4">
                    {alerts.slice(0, 3).map((alert: any) => (
                      <div key={alert.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="mt-1">
                          {alert.type === 'Disease' && <AlertCircle className="w-5 h-5 text-red-500" />}
                          {alert.type === 'Weather' && <AlertCircle className="w-5 h-5 text-blue-500" />}
                          {alert.type === 'Market' && <DollarSign className="w-5 h-5 text-green-500" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-['Poppins'] font-medium">{alert.title || alert.message}</h4>
                          <p className="text-sm text-muted-foreground">{alert.description || 'No description available'}</p>
                          <div className="flex items-center mt-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>{alert.location || alert.farms?.name || 'Unknown location'}</span>
                            <span className="mx-2">•</span>
                            <span>{alert.timestamp || 'Unknown time'}</span>
                          </div>
                        </div>
                        <Badge variant={alert.severity === 'High' ? 'destructive' : alert.severity === 'Medium' ? 'secondary' : 'default'}>
                          {alert.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                    <p>No alerts at this time</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* My Herd */}
        {activeView === 'herd' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">My Herd</CardTitle>
              <CardDescription>Manage your livestock</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : animals.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tag Number</TableHead>
                        <TableHead>Breed</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Weight (kg)</TableHead>
                        <TableHead>Health Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {animals.map((animal: any) => (
                        <TableRow key={animal.id}>
                          <TableCell className="font-medium">{animal.tag_number}</TableCell>
                          <TableCell>{animal.breed}</TableCell>
                          <TableCell>{animal.age || 'N/A'}</TableCell>
                          <TableCell>{animal.weight || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                animal.health_status === 'Healthy' ? 'default' : 
                                animal.health_status === 'Ill' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {animal.health_status || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedAnimal(animal)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-['Poppins'] text-lg font-medium mb-1">No animals found</h3>
                  <p className="text-muted-foreground mb-4">Get started by adding your first animal</p>
                  <Button onClick={() => setActiveView('add')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Animal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add Animal Form */}
        {activeView === 'add' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Add New Animal</CardTitle>
              <CardDescription>Register a new animal to your herd</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAnimal} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="tag_id">Tag Number *</Label>
                    <Input
                      id="tag_id"
                      name="tag_id"
                      value={newAnimal.tag_id}
                      onChange={handleInputChange}
                      placeholder="Enter tag number"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="breed">Breed *</Label>
                    <Select name="breed" value={newAnimal.breed} onValueChange={(value) => handleSelectChange('breed', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select breed" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="White Fulani">White Fulani</SelectItem>
                        <SelectItem value="Red Bororo">Red Bororo</SelectItem>
                        <SelectItem value="Sokoto Gudali">Sokoto Gudali</SelectItem>
                        <SelectItem value="Keteku">Keteku</SelectItem>
                        <SelectItem value="N'dama">N'dama</SelectItem>
                        <SelectItem value="Bakosi">Bakosi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sex">Sex *</Label>
                    <Select name="sex" value={newAnimal.sex} onValueChange={(value) => handleSelectChange('sex', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      name="dob"
                      type="date"
                      value={newAnimal.dob}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gps_lat">GPS Latitude</Label>
                    <Input
                      id="gps_lat"
                      name="gps_lat"
                      type="number"
                      step="any"
                      value={newAnimal.gps_lat}
                      onChange={handleInputChange}
                      placeholder="Enter latitude"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gps_lng">GPS Longitude</Label>
                    <Input
                      id="gps_lng"
                      name="gps_lng"
                      type="number"
                      step="any"
                      value={newAnimal.gps_lng}
                      onChange={handleInputChange}
                      placeholder="Enter longitude"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={newAnimal.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes about the animal"
                  />
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setActiveView('overview')}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Animal</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Analytics */}
        {activeView === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Animals</CardDescription>
                  <CardTitle className="font-['Poppins']">{animals.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Across all farms</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Average Age</CardDescription>
                  <CardTitle className="font-['Poppins']">
                    {animals.length > 0 
                      ? `${(animals.reduce((sum, animal) => sum + (animal.age || 0), 0) / animals.length).toFixed(1)} years` 
                      : 'N/A'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Of your herd</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Average Weight</CardDescription>
                  <CardTitle className="font-['Poppins']">
                    {animals.length > 0 
                      ? `${(animals.reduce((sum, animal) => sum + (animal.weight || 0), 0) / animals.length).toFixed(1)} kg` 
                      : 'N/A'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Of your herd</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins']">Health Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : healthStats.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={healthStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(Number(percent) * 100).toFixed(0)}%`}
                        >
                          {healthStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex flex-col items-center justify-center text-muted-foreground">
                    <FileText className="w-12 h-12 mb-4" />
                    <p>No health data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alerts */}
        {activeView === 'alerts' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Alerts & Notifications</CardTitle>
              <CardDescription>Stay informed about your herd and farm</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="animate-pulse rounded-full bg-muted h-10 w-10" />
                      <div className="space-y-2 flex-1">
                        <div className="animate-pulse h-4 bg-muted rounded w-3/4"></div>
                        <div className="animate-pulse h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert: any) => (
                    <div key={alert.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="mt-1">
                        {alert.type === 'Disease' && <AlertCircle className="w-5 h-5 text-red-500" />}
                        {alert.type === 'Weather' && <AlertCircle className="w-5 h-5 text-blue-500" />}
                        {alert.type === 'Market' && <DollarSign className="w-5 h-5 text-green-500" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-['Poppins'] font-medium">{alert.title || alert.message}</h4>
                        <p className="text-sm text-muted-foreground">{alert.description || 'No description available'}</p>
                        <div className="flex items-center mt-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span>{alert.location || alert.farms?.name || 'Unknown location'}</span>
                          <span className="mx-2">•</span>
                          <span>{alert.timestamp || 'Unknown time'}</span>
                        </div>
                      </div>
                      <Badge variant={alert.severity === 'High' ? 'destructive' : alert.severity === 'Medium' ? 'secondary' : 'default'}>
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                  <p>No alerts at this time</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Animal Detail Dialog */}
      {selectedAnimal && (
        <Dialog open={!!selectedAnimal} onOpenChange={() => setSelectedAnimal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-['Poppins']">{selectedAnimal.tag_number}</DialogTitle>
              <DialogDescription>
                {selectedAnimal.breed}, {selectedAnimal.age || 'N/A'} years old
              </DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <img 
                  src={selectedAnimal.image_cid ? `https://ipfs.io/ipfs/${selectedAnimal.image_cid}` : '/placeholder-animal.jpg'} 
                  alt={selectedAnimal.tag_number}
                  className="w-full h-64 object-cover rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-animal.jpg';
                  }}
                />
              </div>
              <div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-['Poppins'] font-medium mb-2">Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Tag Number:</span>
                      <span>{selectedAnimal.tag_number}</span>
                      <span className="text-muted-foreground">Breed:</span>
                      <span>{selectedAnimal.breed}</span>
                      <span className="text-muted-foreground">Sex:</span>
                      <span>{selectedAnimal.sex}</span>
                      <span className="text-muted-foreground">Age:</span>
                      <span>{selectedAnimal.age || 'N/A'} years</span>
                      <span className="text-muted-foreground">Weight:</span>
                      <span>{selectedAnimal.weight || 'N/A'} kg</span>
                      <span className="text-muted-foreground">Health Status:</span>
                      <span>
                        <Badge 
                          variant={
                            selectedAnimal.health_status === 'Healthy' ? 'default' : 
                            selectedAnimal.health_status === 'Ill' ? 'destructive' : 
                            'secondary'
                          }
                        >
                          {selectedAnimal.health_status || 'Unknown'}
                        </Badge>
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-['Poppins'] font-medium mb-2">Location</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Latitude:</span>
                      <span>{selectedAnimal.gps_lat || 'N/A'}</span>
                      <span className="text-muted-foreground">Longitude:</span>
                      <span>{selectedAnimal.gps_lng || 'N/A'}</span>
                    </div>
                  </div>
                  
                  {selectedAnimal.notes && (
                    <div>
                      <h4 className="font-['Poppins'] font-medium mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground">{selectedAnimal.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}