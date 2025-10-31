import { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Badge } from './ui/badge';
import {
  Truck,
  Package,
  CheckCircle,
  MapPin,
  Calendar,
  Clock,
  Wallet
} from 'lucide-react';
import type { Page } from '../App';
import { useAuth } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

interface TransporterDashboardProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function TransporterDashboard({ onNavigate, onLogout }: TransporterDashboardProps) {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('available');
  const [transports, setTransports] = useState<any[]>([]);
  const [myTransports, setMyTransports] = useState<any[]>([]);
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
        
        // Fetch available transports
        try {
          const { data: transportsData, error: transportsError } = await supabase
            .from('transports')
            .select(`
              *,
              animals(tag_id),
              escrow_logs(amount, currency)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
          
          if (transportsError) {
            console.error('Failed to fetch transports:', transportsError);
            // Fallback to mock data if API fails
            setTransports([
              { id: 1, animal_id: 1, pickup_location: 'Kaduna Farm', delivery_location: 'Lagos Abattoir', scheduled_pickup: '2025-10-25', escrow_logs: { amount: 1500, currency: 'USDC' } },
              { id: 2, animal_id: 2, pickup_location: 'Kano Ranch', delivery_location: 'Abuja Market', scheduled_pickup: '2025-10-26', escrow_logs: { amount: 1200, currency: 'USDC' } }
            ]);
          } else {
            setTransports(transportsData || []);
          }
        } catch (err) {
          console.error('Error fetching transports:', err);
          // Fallback to mock data if API fails
          setTransports([
            { id: 1, animal_id: 1, pickup_location: 'Kaduna Farm', delivery_location: 'Lagos Abattoir', scheduled_pickup: '2025-10-25', escrow_logs: { amount: 1500, currency: 'USDC' } },
            { id: 2, animal_id: 2, pickup_location: 'Kano Ranch', delivery_location: 'Abuja Market', scheduled_pickup: '2025-10-26', escrow_logs: { amount: 1200, currency: 'USDC' } }
          ]);
        }
        
        // Fetch my transports
        try {
          const { data: myTransportsData, error: myTransportsError } = await supabase
            .from('transports')
            .select(`
              *,
              animals(tag_id),
              escrow_logs(amount, currency)
            `)
            .eq('transporter_id', user.id)
            .neq('status', 'pending')
            .order('created_at', { ascending: false });
          
          if (myTransportsError) {
            console.error('Failed to fetch my transports:', myTransportsError);
            // Fallback to mock data if API fails
            setMyTransports([
              { id: 3, animal_id: 3, pickup_location: 'Jos Ranch', delivery_location: 'Enugu Market', status: 'in_transit', scheduled_pickup: '2025-10-20', actual_pickup: '2025-10-20', escrow_logs: { amount: 1800, currency: 'USDC' } }
            ]);
          } else {
            setMyTransports(myTransportsData || []);
          }
        } catch (err) {
          console.error('Error fetching my transports:', err);
          // Fallback to mock data if API fails
          setMyTransports([
            { id: 3, animal_id: 3, pickup_location: 'Jos Ranch', delivery_location: 'Enugu Market', status: 'in_transit', scheduled_pickup: '2025-10-20', actual_pickup: '2025-10-20', escrow_logs: { amount: 1800, currency: 'USDC' } }
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
    { icon: Package, label: 'Available Jobs', active: activeView === 'available', onClick: () => setActiveView('available') },
    { icon: Truck, label: 'My Transports', active: activeView === 'my-transports', onClick: () => setActiveView('my-transports') },
    { icon: Wallet, label: 'Payments', active: activeView === 'payments', onClick: () => setActiveView('payments') }
  ];

  const handleAssignTransport = async (transportId: string) => {
    try {
      const { data: updatedTransport, error: updateError } = await supabase
        .from('transports')
        .update({ 
          transporter_id: user?.id,
          status: 'assigned',
          assigned_at: new Date().toISOString()
        })
        .eq('id', transportId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Failed to assign transport:', updateError);
        return;
      }
      
      // Refresh data
      const { data: transportsData, error: transportsError } = await supabase
        .from('transports')
        .select(`
          *,
          animals(tag_id),
          escrow_logs(amount, currency)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (!transportsError) {
        setTransports(transportsData || []);
      }
      
      const { data: myTransportsData, error: myTransportsError } = await supabase
        .from('transports')
        .select(`
          *,
          animals(tag_id),
          escrow_logs(amount, currency)
        `)
        .eq('transporter_id', user?.id)
        .neq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (!myTransportsError) {
        setMyTransports(myTransportsData || []);
      }
    } catch (err) {
      console.error('Error assigning transport:', err);
    }
  };

  const handleConfirmDelivery = async (transportId: string) => {
    try {
      // Get current transport status
      const { data: currentTransport, error: fetchError } = await supabase
        .from('transports')
        .select('status')
        .eq('id', transportId)
        .single();
      
      if (fetchError) {
        console.error('Failed to fetch transport:', fetchError);
        return;
      }
      
      // Determine new status
      let newStatus = 'delivered';
      let updateFields: any = {
        status: newStatus,
        delivered_at: new Date().toISOString()
      };
      
      if (currentTransport.status === 'assigned') {
        newStatus = 'in_transit';
        updateFields = {
          status: newStatus,
          in_transit_at: new Date().toISOString()
        };
      }
      
      // Update transport status
      const { data: updatedTransport, error: updateError } = await supabase
        .from('transports')
        .update(updateFields)
        .eq('id', transportId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Failed to confirm delivery:', updateError);
        return;
      }
      
      // Refresh my transports
      const { data: myTransportsData, error: myTransportsError } = await supabase
        .from('transports')
        .select(`
          *,
          animals(tag_id),
          escrow_logs(amount, currency)
        `)
        .eq('transporter_id', user?.id)
        .neq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (!myTransportsError) {
        setMyTransports(myTransportsData || []);
      }
    } catch (err) {
      console.error('Error confirming delivery:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'assigned':
        return <Badge variant="default">Assigned</Badge>;
      case 'in_transit':
        return <Badge variant="default">In Transit</Badge>;
      case 'delivered':
        return <Badge variant="default">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      title="Transporter Dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      walletBalance="$3,245.50"
      notifications={[]}
    >
      <div className="p-6 space-y-6">
        {/* Available Jobs */}
        {activeView === 'available' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Available Transport Jobs</CardTitle>
              <CardDescription>Jobs available for assignment</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Animal</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transports.map((transport) => (
                    <TableRow key={transport.id}>
                      <TableCell className="font-medium">Animal #{transport.animal_id}</TableCell>
                      <TableCell>{transport.pickup_location}</TableCell>
                      <TableCell>{transport.delivery_location}</TableCell>
                      <TableCell>{transport.scheduled_pickup}</TableCell>
                      <TableCell>{transport.escrow_logs?.amount} {transport.escrow_logs?.currency}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleAssignTransport(transport.id)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Job
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* My Transports */}
        {activeView === 'my-transports' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">My Transport Jobs</CardTitle>
              <CardDescription>Jobs assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Animal</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Actual Pickup</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myTransports.map((transport) => (
                    <TableRow key={transport.id}>
                      <TableCell className="font-medium">Animal #{transport.animal_id}</TableCell>
                      <TableCell>{transport.pickup_location}</TableCell>
                      <TableCell>{transport.delivery_location}</TableCell>
                      <TableCell>{getStatusBadge(transport.status)}</TableCell>
                      <TableCell>{transport.scheduled_pickup}</TableCell>
                      <TableCell>{transport.actual_pickup || 'Not yet'}</TableCell>
                      <TableCell>
                        {transport.status === 'assigned' && (
                          <Button variant="outline" size="sm" onClick={() => handleConfirmDelivery(transport.id)}>
                            <Truck className="w-4 h-4 mr-2" />
                            Start Transport
                          </Button>
                        )}
                        {transport.status === 'in_transit' && (
                          <Button variant="outline" size="sm" onClick={() => handleConfirmDelivery(transport.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirm Delivery
                          </Button>
                        )}
                        {transport.status === 'delivered' && (
                          <Button variant="outline" size="sm" disabled>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Payments */}
        {activeView === 'payments' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Payment History</CardTitle>
              <CardDescription>Your payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Transport #3</TableCell>
                    <TableCell>2025-10-20</TableCell>
                    <TableCell>1800</TableCell>
                    <TableCell>USDC</TableCell>
                    <TableCell>
                      <Badge variant="default">Completed</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="link" size="sm">
                        View on HashScan
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Transport #1</TableCell>
                    <TableCell>2025-10-15</TableCell>
                    <TableCell>1500</TableCell>
                    <TableCell>USDC</TableCell>
                    <TableCell>
                      <Badge variant="default">Completed</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="link" size="sm">
                        View on HashScan
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}