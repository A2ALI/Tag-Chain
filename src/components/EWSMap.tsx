// @ts-nocheck
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Alert {
  id: string;
  type: 'disease' | 'weather' | 'market';
  severity: 'high' | 'medium' | 'low';
  description: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  farm_name?: string;
}

const EWSMap = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
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

  // Fetch live EWS data directly from Supabase
  useEffect(() => {
    const fetchEWSData = async () => {
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
          console.error('Failed to fetch EWS data:', error);
          throw new Error(error.message || 'Failed to fetch EWS data');
        }
        
        // Transform the data to match our Alert interface
        const transformedAlerts: Alert[] = (data || []).map((alert: any) => {
          // Ensure we have valid coordinates
          const lat = alert.farms?.gps_lat || 10.5167;
          const lng = alert.farms?.gps_lng || 7.4333;
          
          // Validate that coordinates are numbers
          const validLat = typeof lat === 'number' && !isNaN(lat) ? lat : 10.5167;
          const validLng = typeof lng === 'number' && !isNaN(lng) ? lng : 7.4333;
          
          return {
            id: alert.id,
            type: alert.type || 'disease',
            severity: alert.severity || 'medium',
            description: alert.message || alert.description || 'No description available',
            latitude: validLat,
            longitude: validLng,
            timestamp: alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Unknown time',
            farm_name: alert.farms?.name || 'Unknown farm'
          };
        });
        
        setAlerts(transformedAlerts);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching EWS data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch EWS data');
        setLoading(false);
        
        // Fallback to sample data on error
        setAlerts([
          {
            id: '1',
            type: 'disease',
            severity: 'high',
            description: 'Lumpy Skin Disease outbreak reported',
            latitude: 10.5167,
            longitude: 7.4333,
            timestamp: '2 hours ago'
          },
          {
            id: '2',
            type: 'weather',
            severity: 'medium',
            description: 'Heatwave warning for the region',
            latitude: 12.0000,
            longitude: 8.5167,
            timestamp: '5 hours ago'
          },
          {
            id: '3',
            type: 'market',
            severity: 'low',
            description: 'Cattle prices increased by 15%',
            latitude: 9.9167,
            longitude: 8.8833,
            timestamp: '1 day ago'
          }
        ]);
      }
    };
    
    fetchEWSData();
  }, [supabase]);

  // Function to trigger EWS data fetch (in a real app, this might call an external API)
  const handleFetchEWSData = async () => {
    try {
      // In a real implementation, this would call an external weather/forecast API
      // For now, we'll just refresh the existing data
      const { data, error } = await supabase
        .from('ews_alerts')
        .select(`
          *,
          farms (id, name, gps_lat, gps_lng)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        throw new Error(error.message || 'Failed to fetch EWS data');
      }
      
      // Transform the data to match our Alert interface
      const transformedAlerts: Alert[] = (data || []).map((alert: any) => {
        // Ensure we have valid coordinates
        const lat = alert.farms?.gps_lat || 10.5167;
        const lng = alert.farms?.gps_lng || 7.4333;
        
        // Validate that coordinates are numbers
        const validLat = typeof lat === 'number' && !isNaN(lat) ? lat : 10.5167;
        const validLng = typeof lng === 'number' && !isNaN(lng) ? lng : 7.4333;
        
        return {
          id: alert.id,
          type: alert.type || 'disease',
          severity: alert.severity || 'medium',
          description: alert.message || alert.description || 'No description available',
          latitude: validLat,
          longitude: validLng,
          timestamp: alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Unknown time',
          farm_name: alert.farms?.name || 'Unknown farm'
        };
      });
      
      setAlerts(transformedAlerts);
      alert(`EWS data refreshed successfully. Found ${transformedAlerts.length} alerts.`);
    } catch (err) {
      console.error('Error triggering EWS fetch:', err);
      alert('Failed to fetch EWS data. Check console for details.');
    }
  };

  // Get color based on severity
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  if (loading) {
    return <div className="h-96 flex items-center justify-center">Loading map data...</div>;
  }

  if (error) {
    return (
      <div className="h-96 flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">Error loading map data: {error}</p>
        <button 
          onClick={handleFetchEWSData}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
        >
          Retry Fetch EWS Data
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-['Poppins'] text-lg font-semibold">EWS Alerts Map</h3>
        <button 
          onClick={handleFetchEWSData}
          className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary/90"
        >
          Refresh Alerts
        </button>
      </div>
      
      <div style={{ height: '400px', width: '100%' }} className="rounded-lg">
        <MapContainer 
          center={[10.5167, 7.4333]}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {alerts.map(alert => (
            <Marker
              key={alert.id}
              position={[alert.latitude, alert.longitude]}
            >
              <Popup>
                <div className="font-['Poppins']">
                  <h3 className="font-semibold text-lg mb-1">
                    {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert
                  </h3>
                  {alert.farm_name && (
                    <p className="text-sm text-muted-foreground mb-1">Farm: {alert.farm_name}</p>
                  )}
                  <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-xs font-medium px-2 py-1 rounded-full text-white"
                      style={{ backgroundColor: getSeverityColor(alert.severity) }}
                    >
                      {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-xs px-2 py-1 rounded-full bg-red-500 text-white">High Severity</span>
        <span className="text-xs px-2 py-1 rounded-full bg-orange-500 text-white">Medium Severity</span>
        <span className="text-xs px-2 py-1 rounded-full bg-green-500 text-white">Low Severity</span>
      </div>
    </div>
  );
};

export default EWSMap;