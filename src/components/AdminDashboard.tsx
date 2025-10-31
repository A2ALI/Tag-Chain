import { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Switch } from './ui/switch';
import { 
  Users, 
  CheckCircle, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  MapPin, 
  Settings,
  FileText
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Page } from '../App';
import { useAuth } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

interface AdminDashboardProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function AdminDashboard({ onNavigate, onLogout }: AdminDashboardProps) {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [usersByRole, setUsersByRole] = useState<any[]>([]);
  const [certificationData, setCertificationData] = useState<any[]>([]);
  const [adoptionData, setAdoptionData] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        // Fetch users by role data
        try {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('role');
          
          if (usersError) {
            console.error('Failed to fetch users by role:', usersError);
            // Fallback to mock data if API fails
            setUsersByRole([
              { role: 'Farmers', count: 892, color: '#004643' },
              { role: 'Buyers', count: 542, color: '#E76F51' },
              { role: 'Vets', count: 156, color: '#264653' },
              { role: 'Regulators', count: 12, color: '#6AB0A5' }
            ]);
          } else {
            // Group and count users by role manually
            const roleCounts: { [key: string]: number } = {};
            usersData.forEach((user: any) => {
              roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
            });

            // Format the data for the frontend
            const usersByRoleData = Object.keys(roleCounts).map(role => ({
              role: role.charAt(0).toUpperCase() + role.slice(1) + 's',
              count: roleCounts[role],
              color: getColorForRole(role)
            }));
            
            setUsersByRole(usersByRoleData);
          }
        } catch (err) {
          console.error('Error fetching users by role:', err);
          // Fallback to mock data if API fails
          setUsersByRole([
            { role: 'Farmers', count: 892, color: '#004643' },
            { role: 'Buyers', count: 542, color: '#E76F51' },
            { role: 'Vets', count: 156, color: '#264653' },
            { role: 'Regulators', count: 12, color: '#6AB0A5' }
          ]);
        }
        
        // Fetch certification data by state
        try {
          const { data: certsData, error: certsError } = await supabase
            .from('certificates')
            .select('animal_id');
          
          if (certsError) {
            console.error('Failed to fetch certification data:', certsError);
            // Fallback to mock data if API fails
            setCertificationData([
              { state: 'Lagos', count: 145 },
              { state: 'Kano', count: 123 },
              { state: 'Kaduna', count: 98 },
              { state: 'Oyo', count: 87 },
              { state: 'Rivers', count: 65 }
            ]);
          } else {
            // In a real implementation, we would join with animals and farms tables
            // to get the state information. For now, we'll use mock data.
            setCertificationData([
              { state: 'Lagos', count: 145 },
              { state: 'Kano', count: 123 },
              { state: 'Kaduna', count: 98 },
              { state: 'Oyo', count: 87 },
              { state: 'Rivers', count: 65 }
            ]);
          }
        } catch (err) {
          console.error('Error fetching certification data:', err);
          // Fallback to mock data if API fails
          setCertificationData([
            { state: 'Lagos', count: 145 },
            { state: 'Kano', count: 123 },
            { state: 'Kaduna', count: 98 },
            { state: 'Oyo', count: 87 },
            { state: 'Rivers', count: 65 }
          ]);
        }
        
        // Fetch adoption data (user growth)
        try {
          // In a real implementation, we would query the users table and group by month
          // For now, we'll use mock data
          setAdoptionData([
            { month: 'Apr', users: 850 },
            { month: 'May', users: 1100 },
            { month: 'Jun', users: 1450 },
            { month: 'Jul', users: 1680 },
            { month: 'Aug', users: 1920 },
            { month: 'Sep', users: 2050 },
            { month: 'Oct', users: 2267 }
          ]);
        } catch (err) {
          console.error('Error fetching adoption data:', err);
          // Fallback to mock data if API fails
          setAdoptionData([
            { month: 'Apr', users: 850 },
            { month: 'May', users: 1100 },
            { month: 'Jun', users: 1450 },
            { month: 'Jul', users: 1680 },
            { month: 'Aug', users: 1920 },
            { month: 'Sep', users: 2050 },
            { month: 'Oct', users: 2267 }
          ]);
        }
        
        // Fetch disputes data
        try {
          const { data: disputesData, error: disputesError } = await supabase
            .from('disputes')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (disputesError) {
            console.error('Failed to fetch disputes:', disputesError);
            // Fallback to mock data if API fails
            setDisputes([
              { id: 'DIS-001', type: 'Payment', parties: 'Farmer vs Buyer', status: 'Under Review', created: '2025-10-20' },
              { id: 'DIS-002', type: 'Quality', parties: 'Abattoir vs Farmer', status: 'Resolved', created: '2025-10-18' }
            ]);
          } else {
            // Format the data for the frontend
            const formattedDisputes = disputesData.map((dispute: any) => ({
              id: dispute.id,
              type: dispute.type,
              parties: dispute.parties,
              status: dispute.status,
              created: dispute.created_at ? new Date(dispute.created_at).toISOString().split('T')[0] : 'Unknown'
            }));
            
            setDisputes(formattedDisputes);
          }
        } catch (err) {
          console.error('Error fetching disputes:', err);
          // Fallback to mock data if API fails
          setDisputes([
            { id: 'DIS-001', type: 'Payment', parties: 'Farmer vs Buyer', status: 'Under Review', created: '2025-10-20' },
            { id: 'DIS-002', type: 'Quality', parties: 'Abattoir vs Farmer', status: 'Resolved', created: '2025-10-18' }
          ]);
        }
        
        // Fetch notifications data
        try {
          const { data: notificationsData, error: notificationsError } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (notificationsError) {
            console.error('Failed to fetch notifications:', notificationsError);
            // Fallback to mock data if API fails
            setNotifications([
              { id: '1', title: 'High Transaction Volume', message: '50+ transactions in last hour', time: '10 min ago', read: false },
              { id: '2', title: 'New Dispute Opened', message: 'DIS-001 requires attention', time: '1 hour ago', read: false }
            ]);
          } else {
            // Format the data for the frontend
            const formattedNotifications = notificationsData.map((notification: any) => ({
              id: notification.id,
              title: notification.title,
              message: notification.message,
              time: getTimeAgo(new Date(notification.created_at)),
              read: notification.read || false
            }));
            
            setNotifications(formattedNotifications);
          }
        } catch (err) {
          console.error('Error fetching notifications:', err);
          // Fallback to mock data if API fails
          setNotifications([
            { id: '1', title: 'High Transaction Volume', message: '50+ transactions in last hour', time: '10 min ago', read: false },
            { id: '2', title: 'New Dispute Opened', message: 'DIS-001 requires attention', time: '1 hour ago', read: false }
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
    { icon: TrendingUp, label: 'Overview', active: activeView === 'overview', onClick: () => setActiveView('overview') },
    { icon: Users, label: 'User Management', active: activeView === 'users', onClick: () => setActiveView('users') },
    { icon: CheckCircle, label: 'Certifications', active: activeView === 'certifications', onClick: () => setActiveView('certifications') },
    { icon: DollarSign, label: 'Escrow Volume', active: activeView === 'escrow', onClick: () => setActiveView('escrow') },
    { icon: AlertTriangle, label: 'Disputes', active: activeView === 'disputes', onClick: () => setActiveView('disputes'), badge: 1 },
    { icon: MapPin, label: 'EWS Map', active: activeView === 'ews', onClick: () => setActiveView('ews') },
    { icon: Settings, label: 'Settings', active: activeView === 'settings', onClick: () => setActiveView('settings') }
  ];

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      title="Admin Dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      walletBalance="N/A"
      notifications={notifications}
    >
      <div className="p-6 space-y-6">
        {/* Overview */}
        {activeView === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Users</CardDescription>
                  <CardTitle className="font-['Poppins']">2,267</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-600">+217 this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Certified Cattle</CardDescription>
                  <CardTitle className="font-['Poppins']">8,542</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Blockchain verified</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Escrow (USDC)</CardDescription>
                  <CardTitle className="font-['Poppins']">$124,500</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Active transactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Open Disputes</CardDescription>
                  <CardTitle className="font-['Poppins']">1</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">Low</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Active Alerts (EWS)</CardDescription>
                  <CardTitle className="font-['Poppins']">3</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">2 Disease, 1 Weather</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Transactions (24h)</CardDescription>
                  <CardTitle className="font-['Poppins']">127</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-600">+18% vs yesterday</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>NFTs Minted</CardDescription>
                  <CardTitle className="font-['Poppins']">342</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Certificates</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Platform Health</CardDescription>
                  <CardTitle className="font-['Poppins'] text-green-600">99.8%</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="bg-green-500 text-white">Operational</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Users by Role */}
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins']">Active Users by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {usersByRole.map((user: any) => (
                    <div 
                      key={user.role} 
                      className="p-4 rounded-xl border"
                      style={{ borderLeftWidth: '4px', borderLeftColor: user.color }}
                    >
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                      <p className="text-2xl font-['Poppins'] mt-1">{user.count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-['Poppins']">User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={adoptionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="users" stroke="#004643" strokeWidth={2} name="Total Users" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-['Poppins']">Regional Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={certificationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="state" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2A9D8F" name="Certifications" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Disputes */}
        {activeView === 'disputes' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Open Disputes</CardTitle>
              <CardDescription>Review and manage dispute cases</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispute ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Parties</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell className="font-medium">{dispute.id}</TableCell>
                      <TableCell>{dispute.type}</TableCell>
                      <TableCell>{dispute.parties}</TableCell>
                      <TableCell>
                        <Badge variant={dispute.status === 'Resolved' ? 'default' : 'secondary'}>
                          {dispute.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{dispute.created}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        {activeView === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Platform Settings</CardTitle>
              <CardDescription>Configure system-wide parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-['Poppins'] font-medium">EWS Alerts</h3>
                    <p className="text-sm text-muted-foreground">Enable/disable early warning system</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-['Poppins'] font-medium">On-Chain Verification</h3>
                    <p className="text-sm text-muted-foreground">Require blockchain verification for all certificates</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-['Poppins'] font-medium">Multi-Signature Escrow</h3>
                    <p className="text-sm text-muted-foreground">Require multiple approvals for escrow release</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-['Poppins'] font-medium">Automated Dispute Resolution</h3>
                    <p className="text-sm text-muted-foreground">Enable AI-assisted dispute resolution</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function getColorForRole(role: string): string {
  switch (role) {
    case 'farmer':
      return '#004643';
    case 'buyer':
      return '#E76F51';
    case 'veterinarian':
      return '#264653';
    case 'regulator':
      return '#6AB0A5';
    default:
      return '#6AB0A5';
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) {
    return interval + ' years ago';
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + ' months ago';
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + ' days ago';
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + ' hours ago';
  }
  
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + ' minutes ago';
  }
  
  return Math.floor(seconds) + ' seconds ago';
}