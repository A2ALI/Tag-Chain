import { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import EWSMap from './EWSMap';
import { motion } from 'framer-motion';
import type { Page } from '../App';
import { useAuth } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';
import { 
  LayoutDashboard, 
  Map, 
  BarChart, 
  Bell, 
  AlertCircle, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface EWSPageProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function EWSPage({ onNavigate, onLogout }: EWSPageProps) {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('map');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch alerts data directly from Supabase
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('ews_alerts')
          .select(`
            *,
            farms (id, name, gps_lat, gps_lng)
          `)
          .order('created_at', { ascending: false })
          .limit(100);
        
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
        ]);
        setLoading(false);
      }
    };
    
    fetchAlerts();
  }, [supabase]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'default';
      default: return 'default';
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      // Update the alert in the database
      const { error } = await supabase
        .from('ews_alerts')
        .update({ 
          payload: {
            ...alerts.find(a => a.id === id)?.payload,
            acknowledged: true,
            acknowledged_at: new Date().toISOString()
          }
        })
        .eq('id', id);
      
      if (error) {
        console.error('Failed to acknowledge alert:', error);
        alert('Failed to acknowledge alert');
        return;
      }
      
      // Update local state
      setAlerts(alerts.map(alert => 
        alert.id === id 
          ? { 
              ...alert, 
              payload: { 
                ...alert.payload, 
                acknowledged: true,
                acknowledged_at: new Date().toISOString()
              }
            } 
          : alert
      ));
      
      alert(`Alert ${id} acknowledged`);
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      alert('Failed to acknowledge alert');
    }
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: activeView === 'dashboard', onClick: () => onNavigate('farmer-dashboard') },
    { icon: Map, label: 'Map View', active: activeView === 'map', onClick: () => setActiveView('map') },
    { icon: BarChart, label: 'Analytics', active: activeView === 'analytics', onClick: () => setActiveView('analytics') },
    { icon: Bell, label: 'Alerts', active: activeView === 'alerts', onClick: () => setActiveView('alerts') },
    { icon: AlertCircle, label: 'Risk Assessment', active: activeView === 'risk', onClick: () => setActiveView('risk') },
    { icon: Settings, label: 'Settings', active: activeView === 'settings', onClick: () => setActiveView('settings') }
  ];

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      title="Early Warning System"
      onNavigate={onNavigate}
      onLogout={onLogout}
      walletBalance="$1,245.00"
      notifications={[]}
    >
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-['Poppins']">Early Warning System (EWS)</CardTitle>
            <CardDescription>Live monitoring of disease, weather, and market conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <EWSMap />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
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
          
          <div>
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
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex justify-between">
                        <h4 className="font-['Poppins'] font-medium">{alert.title || alert.message}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          alert.severity === 'High' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.location || alert.farms?.name || 'Unknown location'}</p>
                      <p className="text-sm mt-2">{alert.description || alert.message || 'No description available'}</p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs text-muted-foreground">{alert.timestamp || 'Unknown time'}</span>
                        {(!alert.payload?.acknowledged) && (
                          <button 
                            className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcknowledge(alert.id);
                            }}
                          >
                            Acknowledge
                          </button>
                        )}
                        {(alert.payload?.acknowledged) && (
                          <span className="text-xs text-green-600">Acknowledged</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}