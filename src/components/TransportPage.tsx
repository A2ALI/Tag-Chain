import { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Truck, MapPin, Package, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Page } from '../App';

interface TransportJob {
  id: string;
  animal_id: string;
  animal_breed: string;
  animal_weight: string;
  pickup_location: string;
  delivery_location: string;
  distance: string;
  price: number;
  deadline: string;
  status: 'available' | 'accepted' | 'in_transit' | 'delivered';
  farmer: string;
  buyer: string;
  vehicle_type: string;
}

interface TransportPageProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function TransportPage({ onNavigate, onLogout }: TransportPageProps) {
  const [jobs, setJobs] = useState<TransportJob[]>([
    {
      id: 'job_1',
      animal_id: 'TC-001-NG',
      animal_breed: 'White Fulani',
      animal_weight: '420kg',
      pickup_location: 'Kaduna Farm A',
      delivery_location: 'Abattoir Complex, Abuja',
      distance: '250km',
      price: 150,
      deadline: '2025-10-25T10:00:00Z',
      status: 'available',
      farmer: 'John Farmer',
      buyer: 'Premium Abattoir Ltd',
      vehicle_type: 'Livestock Trailer'
    },
    {
      id: 'job_2',
      animal_id: 'TC-003-NG',
      animal_breed: 'Sokoto Gudali',
      animal_weight: '380kg',
      pickup_location: 'Kano Ranch B',
      delivery_location: 'Market Yard, Kano',
      distance: '80km',
      price: 80,
      deadline: '2025-10-24T15:30:00Z',
      status: 'accepted',
      farmer: 'Ahmed Ibrahim',
      buyer: 'Kano Livestock Co.',
      vehicle_type: 'Pickup Truck'
    },
    {
      id: 'job_3',
      animal_id: 'TC-007-NG',
      animal_breed: 'Red Bororo',
      animal_weight: '450kg',
      pickup_location: 'Plateau Farm C',
      delivery_location: 'Export Facility, Lagos',
      distance: '1200km',
      price: 450,
      deadline: '2025-10-27T09:00:00Z',
      status: 'available',
      farmer: 'Mary Rancher',
      buyer: 'International Exporters',
      vehicle_type: 'Livestock Trailer'
    }
  ]);
  
  const [selectedJob, setSelectedJob] = useState<TransportJob | null>(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('in_transit');

  const handleAcceptJob = (jobId: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, status: 'accepted' } : job
    ));
  };

  const handleUpdateLocation = (jobId: string) => {
    if (!currentLocation) {
      alert('Please enter current location');
      return;
    }
    
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, status: 'in_transit' } : job
    ));
    alert(`Location updated to: ${currentLocation}`);
  };

  const handleMarkDelivered = (jobId: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, status: 'delivered' } : job
    ));
    alert('Job marked as delivered');
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'delivered': return 'default';
      case 'in_transit': return 'secondary';
      case 'accepted': return 'outline';
      case 'available': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'in_transit': return 'In Transit';
      case 'accepted': return 'Accepted';
      case 'available': return 'Available';
      default: return status;
    }
  };

  return (
    <DashboardLayout
      sidebarItems={[]}
      title="Transport Jobs"
      onNavigate={onNavigate}
      onLogout={onLogout}
      walletBalance="$2,450.00"
      notifications={[]}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Poppins'] text-2xl font-bold">Transport Jobs</h1>
            <p className="text-muted-foreground">Find and manage livestock transportation jobs</p>
          </div>
          <div className="flex gap-2">
            <Card className="p-4">
              <div className="text-center">
                <p className="text-2xl font-['Poppins'] font-bold">3</p>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-2xl font-['Poppins'] font-bold">$680</p>
                <p className="text-sm text-muted-foreground">Earnings</p>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="font-['Poppins'] flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Transport Job #{job.id.split('_')[1]}
                      </CardTitle>
                      <CardDescription>
                        Transport {job.animal_breed} ({job.animal_id}) from {job.pickup_location} to {job.delivery_location}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(job.status)}>
                      {getStatusText(job.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Animal</Label>
                      <p className="font-medium">{job.animal_id}</p>
                      <p className="text-sm text-muted-foreground">{job.animal_breed} • {job.animal_weight}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Route</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{job.distance}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{job.vehicle_type}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Deadline</Label>
                      <p className="font-medium">
                        {new Date(job.deadline).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(job.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Price</Label>
                      <p className="font-['Poppins'] text-xl font-bold">${job.price}</p>
                      <p className="text-sm text-muted-foreground">USDC</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Farmer</Label>
                        <p className="font-medium">{job.farmer}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Buyer</Label>
                        <p className="font-medium">{job.buyer}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {job.status === 'available' && (
                        <Button 
                          onClick={() => handleAcceptJob(job.id)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Job
                        </Button>
                      )}
                      
                      {job.status === 'accepted' && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Current location"
                            value={currentLocation}
                            onChange={(e) => setCurrentLocation(e.target.value)}
                            className="w-40 bg-input-background"
                          />
                          <Button 
                            onClick={() => handleUpdateLocation(job.id)}
                            variant="outline"
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            Update
                          </Button>
                        </div>
                      )}
                      
                      {job.status === 'in_transit' && (
                        <Button 
                          onClick={() => handleMarkDelivered(job.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Mark Delivered
                        </Button>
                      )}
                      
                      {job.status === 'delivered' && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-['Poppins']">Transport Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-['Poppins'] font-semibold mb-1">Vehicle Requirements</h3>
                <p className="text-sm text-muted-foreground">
                  Use appropriate livestock transport vehicles with proper ventilation and safety measures
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-['Poppins'] font-semibold mb-1">On-Time Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Ensure timely delivery as per agreed deadlines to maintain quality ratings
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-['Poppins'] font-semibold mb-1">Animal Welfare</h3>
                <p className="text-sm text-muted-foreground">
                  Maintain animal welfare standards during transport with adequate food, water, and rest
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}