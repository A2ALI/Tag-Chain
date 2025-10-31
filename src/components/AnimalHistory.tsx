import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, Clock, User, Tag, FileText, Award } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

interface AnimalHistoryProps {
  animalId?: string;
  tagNumber?: string;
  onBack?: () => void;
}

interface HistoryEvent {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  decoded_message: any;
  transaction_id?: string;
  hcs_tx_id?: string;
}

export default function AnimalHistory({ animalId, tagNumber, onBack }: AnimalHistoryProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [vetRecords, setVetRecords] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Supabase client
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch HCS history directly from Supabase
        try {
          let query = supabase
            .from('animals')
            .select(`
              id,
              history_events(*),
              vet_records(*),
              certificates(*)
            `);
          
          if (animalId) {
            query = query.eq('id', animalId);
          }
          if (tagNumber) {
            query = query.eq('tag_number', tagNumber);
          }
          
          const { data, error: fetchError } = await query;
          
          if (fetchError) {
            console.error('Failed to fetch animal history:', fetchError);
            // Fallback to mock data if API fails
            setEvents([
              // Mock data would go here
            ]);
          } else if (data && data.length > 0) {
            const animal = data[0];
            setEvents(animal.history_events || []);
            setVetRecords(animal.vet_records || []);
            setCertificates(animal.certificates || []);
          }
        } catch (err) {
          console.error('Error fetching animal history:', err);
          // Fallback to mock data if API fails
          setEvents([
            {
              id: '1',
              timestamp: '2025-10-20T10:30:00Z',
              type: 'animal.register',
              message: 'Animal registered in system',
              decoded_message: { type: 'animal.register', message: 'Animal registered in system' }
            }
          ]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching animal history:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch animal history');
        setLoading(false);
      }
    };
    
    if (animalId || tagNumber) {
      fetchHistory();
    }
  }, [animalId, tagNumber, supabase]);

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'animal.register':
        return <Tag className="w-4 h-4" />;
      case 'animal.verified':
        return <CheckCircle className="w-4 h-4" />;
      case 'escrow.create':
        return <Clock className="w-4 h-4" />;
      case 'vet.record':
        return <FileText className="w-4 h-4" />;
      case 'certificate.issued':
        return <Award className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'animal.register':
        return 'default';
      case 'animal.verified':
        return 'success';
      case 'escrow.create':
        return 'warning';
      case 'vet.record':
        return 'info';
      case 'certificate.issued':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const openHashScan = (txId: string) => {
    if (txId) {
      const network = import.meta.env.VITE_HEDERA_NETWORK || 'testnet';
      const baseUrl = network === 'mainnet' 
        ? 'https://hashscan.io/mainnet/transaction/'
        : 'https://hashscan.io/testnet/transaction/';
      window.open(`${baseUrl}${txId}`, '_blank');
    }
  };

  const verifyCertificate = async (certificateId: string) => {
    try {
      // Direct Supabase call to verify certificate
      const { data: certData, error: certError } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', certificateId)
        .single();
      
      if (certError) {
        console.error('Failed to verify certificate:', certError);
        return;
      }
      
      const isValid = !!certData.on_chain_tx_id;
      const type = certData.type || 'Unknown';
      const issuedAt = certData.issued_at ? new Date(certData.issued_at).toLocaleDateString() : 'Unknown';
      
      alert(`Certificate Verification:\nValid: ${isValid}\nType: ${type}\nIssued: ${issuedAt}`);
      
      if (isValid && certData.on_chain_tx_id) {
        const network = import.meta.env.VITE_HEDERA_NETWORK || 'testnet';
        const baseUrl = network === 'mainnet' 
          ? 'https://hashscan.io/mainnet/transaction/'
          : 'https://hashscan.io/testnet/transaction/';
        window.open(`${baseUrl}${certData.on_chain_tx_id}`, '_blank');
      }
    } catch (err) {
      console.error('Error verifying certificate:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-['Poppins']">Animal History</CardTitle>
            <CardDescription>Loading history events...</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-['Poppins']">Animal History</CardTitle>
            <CardDescription>Error loading history</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">Error: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Combine HCS events and vet records
  const allEvents = [
    ...events.map(event => ({
      id: event.id,
      timestamp: event.timestamp,
      type: event.decoded_message?.type || 'unknown',
      message: event.decoded_message?.message || 'Event recorded on blockchain',
      details: event.decoded_message?.details,
      hcs_tx_id: event.hcs_tx_id,
      source: 'hcs'
    })),
    ...vetRecords.map(record => ({
      id: record.id,
      timestamp: record.date,
      type: 'vet.record',
      message: `${record.record_type} recorded by veterinarian`,
      details: record.description,
      hcs_tx_id: record.on_chain_hash,
      source: 'vet'
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-['Poppins'] font-bold">Animal History</h1>
          <p className="text-muted-foreground">
            {animalId ? `Animal ID: ${animalId}` : `Tag: ${tagNumber}`}
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Dashboard
          </Button>
        )}
      </div>

      {/* Timeline Events */}
      <Card>
        <CardHeader>
          <CardTitle className="font-['Poppins']">Timeline Events</CardTitle>
          <CardDescription>Historical events recorded on blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          {allEvents.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-['Poppins'] text-lg font-medium mb-2">No History Found</h3>
              <p className="text-muted-foreground">
                No on-chain history events found for this animal.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getEventTypeIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getEventTypeColor(event.type) as any}>
                            {event.type === 'vet.record' ? 'Vet Record' : event.type === 'certificate.issued' ? 'Certificate' : event.type || 'Unknown Event'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        <p className="font-['Poppins'] font-medium mb-2">
                          {event.message}
                        </p>
                        {event.details && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {event.details}
                          </p>
                        )}
                        {event.hcs_tx_id && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto"
                            onClick={() => openHashScan(event.hcs_tx_id!)}
                          >
                            View On-Chain Proof
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificates */}
      <Card>
        <CardHeader>
          <CardTitle className="font-['Poppins']">Certificates</CardTitle>
          <CardDescription>Issued certificates for this animal</CardDescription>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-['Poppins'] text-lg font-medium mb-2">No Certificates Found</h3>
              <p className="text-muted-foreground">
                No certificates have been issued for this animal.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <Card key={cert.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="default">
                            {cert.type}
                          </Badge>
                          <Badge variant={new Date(cert.expires_at) > new Date() ? 'default' : 'destructive'}>
                            {new Date(cert.expires_at) > new Date() ? 'Active' : 'Expired'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Issued: {new Date(cert.issued_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-['Poppins'] font-medium mb-2">
                          Issued by {cert.issuer_role}: {cert.issuer_name}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Expires: {cert.expires_at ? new Date(cert.expires_at).toLocaleDateString() : 'Never'}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => verifyCertificate(cert.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify
                          </Button>
                          {cert.on_chain_tx_id && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openHashScan(cert.on_chain_tx_id)}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View on HashScan
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}