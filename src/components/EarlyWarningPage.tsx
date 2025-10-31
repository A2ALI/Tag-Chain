import { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import EWSMap from './EWSMap';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertTriangle, RefreshCw, Plus } from 'lucide-react';
import type { Page } from '../App';
import { useAuth } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

interface EarlyWarningPageProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function EarlyWarningPage({ onNavigate, onLogout }: EarlyWarningPageProps) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    region: '',
    severity: '',
    limit: '10'
  });
  const [showTestAlertDialog, setShowTestAlertDialog] = useState(false);
  const [testAlert, setTestAlert] = useState({
    disease_name: '',
    region: '',
    severity: 'medium',
    description: ''
  });

  // Initialize Supabase client
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  // Fetch alerts data directly from Supabase
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let query = supabase
          .from('ews_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(parseInt(filter.limit) || 10);
        
        // Apply filters
        if (filter.region) {
          // This would depend on how region filtering is implemented in your data model
          // For now, we'll assume there's a region field
        }
        
        if (filter.severity) {
          query = query.eq('severity', filter.severity);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Failed to fetch alerts:', error);
          throw new Error(error.message || 'Failed to fetch alerts');
        }
        
        setAlerts(data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
        // Fallback to mock data if API fails
        setAlerts([
          { 
            id: '1', 
            disease_name: 'Lumpy Skin Disease', 
            region: 'Kaduna State', 
            severity: 'High', 
            description: 'Confirmed cases in 3 farms. Immediate vaccination recommended.',
            source: 'Ministry of Agriculture',
            alert_date: '2 hours ago',
            is_active: true
          },
          { 
            id: '2', 
            disease_name: 'Foot and Mouth Disease', 
            region: 'Kano State', 
            severity: 'Medium', 
            description: 'Suspected outbreak. Movement restrictions advised.',
            source: 'Veterinary Services',
            alert_date: '5 hours ago',
            is_active: true
          },
          { 
            id: '3', 
            disease_name: 'Blue Tongue', 
            region: 'Abuja', 
            severity: 'Low', 
            description: 'Increased vector activity detected. Monitor livestock.',
            source: 'Animal Health Institute',
            alert_date: '1 day ago',
            is_active: true
          }
        ]);
        setLoading(false);
      }
    };
    
    fetchAlerts();
  }, [filter, supabase]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleRefresh = async () => {
    try {
      // Refresh alerts from Supabase
      let query = supabase
        .from('ews_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(parseInt(filter.limit) || 10);
      
      if (filter.severity) {
        query = query.eq('severity', filter.severity);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message || 'Failed to refresh alerts');
      }
      
      setAlerts(data || []);
    } catch (err) {
      console.error('Error refreshing alerts:', err);
      alert('Failed to refresh alerts. Check console for details.');
    }
  };

  const handleCreateTestAlert = async () => {
    try {
      // Insert test alert into Supabase
      const { data, error } = await supabase
        .from('ews_alerts')
        .insert([{
          disease_name: testAlert.disease_name,
          region: testAlert.region,
          severity: testAlert.severity,
          description: testAlert.description,
          source: 'Test Alert',
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message || 'Failed to create test alert');
      }
      
      // Refresh alerts
      let query = supabase
        .from('ews_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(parseInt(filter.limit) || 10);
      
      if (filter.severity) {
        query = query.eq('severity', filter.severity);
      }
      
      const { data: refreshData, error: refreshError } = await query;
      
      if (refreshError) {
        throw new Error(refreshError.message || 'Failed to refresh alerts');
      }
      
      setAlerts(refreshData || []);
      setShowTestAlertDialog(false);
      setTestAlert({
        disease_name: '',
        region: '',
        severity: 'medium',
        description: ''
      });
    } catch (err) {
      console.error('Error creating test alert:', err);
      alert('Failed to create test alert. Check console for details.');
    }
  };

  return (
    <DashboardLayout
      sidebarItems={[]}
      title="Early Warning System"
      onNavigate={onNavigate}
      onLogout={onLogout}
      walletBalance="$1,245.00"
      notifications={[]}
    >
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="font-['Poppins']">Early Warning System (EWS)</CardTitle>
                <CardDescription>Live monitoring of disease and weather conditions</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowTestAlertDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Test Alert
                </Button>
                <Button variant="outline" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <EWSMap />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins']">Alert Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={filter.region}
                      onChange={(e) => setFilter({...filter, region: e.target.value})}
                      placeholder="Filter by region"
                    />
                  </div>
                  <div>
                    <Label htmlFor="severity">Severity</Label>
                    <Select 
                      value={filter.severity} 
                      onValueChange={(value) => setFilter({...filter, severity: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All severities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Severities</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="limit">Limit</Label>
                    <Select 
                      value={filter.limit} 
                      onValueChange={(value) => setFilter({...filter, limit: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="10 alerts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 Alerts</SelectItem>
                        <SelectItem value="10">10 Alerts</SelectItem>
                        <SelectItem value="20">20 Alerts</SelectItem>
                        <SelectItem value="50">50 Alerts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins']">Alert Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-2xl font-['Poppins'] font-bold text-red-600">2</p>
                    <p className="text-sm text-red-700">High Severity Alerts</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-2xl font-['Poppins'] font-bold text-yellow-600">3</p>
                    <p className="text-sm text-yellow-700">Medium Severity Alerts</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-2xl font-['Poppins'] font-bold text-blue-600">1</p>
                    <p className="text-sm text-blue-700">Low Severity Alerts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-['Poppins']">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert: any, index: number) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h4 className="font-['Poppins'] font-medium">{alert.disease_name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityClass(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{alert.region}</span>
                        <span>Source: {alert.source}</span>
                        <span>{alert.alert_date || 'Unknown time'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Alert Dialog */}
        {showTestAlertDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="font-['Poppins']">Create Test Alert</CardTitle>
                <CardDescription>Simulate an alert for testing purposes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="disease-name">Disease Name</Label>
                    <Input
                      id="disease-name"
                      value={testAlert.disease_name}
                      onChange={(e) => setTestAlert({...testAlert, disease_name: e.target.value})}
                      placeholder="Enter disease name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="alert-region">Region</Label>
                    <Input
                      id="alert-region"
                      value={testAlert.region}
                      onChange={(e) => setTestAlert({...testAlert, region: e.target.value})}
                      placeholder="Enter region"
                    />
                  </div>
                  <div>
                    <Label htmlFor="alert-severity">Severity</Label>
                    <Select 
                      value={testAlert.severity} 
                      onValueChange={(value) => setTestAlert({...testAlert, severity: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="alert-description">Description</Label>
                    <textarea
                      id="alert-description"
                      value={testAlert.description}
                      onChange={(e) => setTestAlert({...testAlert, description: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      placeholder="Enter alert description"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowTestAlertDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTestAlert}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Alert
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}