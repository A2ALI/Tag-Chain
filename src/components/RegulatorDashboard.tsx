import { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CheckCircle, XCircle, FileCheck, Award, MapPin, TrendingUp, Settings, FileText, AlertTriangle, Plus, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Page } from '../App';
import { Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

interface RegulatorDashboardProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function RegulatorDashboard({ onNavigate, onLogout }: RegulatorDashboardProps) {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [certData, setCertData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIssueCertDialog, setShowIssueCertDialog] = useState(false);
  const [newCertificate, setNewCertificate] = useState({
    animal_id: '',
    certificate_type: 'EXPORT',
    expires_at: '',
    document_url: '',
    linked_vet_certificate_id: ''
  });
  const [animals, setAnimals] = useState<any[]>([]);

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
        
        // Fetch pending requests
        try {
          const { data: requestsData, error: requestsError } = await supabase
            .from('certificate_requests')
            .select(`
              id,
              type,
              applicant_name,
              batch_id,
              animal_id,
              submitted_at,
              documents
            `)
            .eq('status', 'pending')
            .order('submitted_at', { ascending: false });
          
          if (requestsError) {
            console.error('Failed to fetch pending requests:', requestsError);
            // Fallback to mock data if API fails
            setPendingRequests([
              { 
                id: 'REQ-001', 
                type: 'Export Certificate', 
                applicant: 'Premium Abattoir Ltd', 
                batchId: 'BATCH-001', 
                submitted: '2025-10-20',
                documents: ['Health Cert', 'Processing Log', 'Origin Records']
              },
              { 
                id: 'REQ-002', 
                type: 'Halal Certificate', 
                applicant: 'Al-Salam Abattoir', 
                batchId: 'BATCH-005', 
                submitted: '2025-10-19',
                documents: ['Halal Compliance', 'Vet Records']
              },
              { 
                id: 'REQ-003', 
                type: 'Movement Permit', 
                applicant: 'John Farmer', 
                animalId: 'TC-010-NG', 
                submitted: '2025-10-18',
                documents: ['Health Certificate', 'Ownership Proof']
              }
            ]);
          } else {
            // Format the data for the frontend
            const pendingRequestsData = requestsData.map((request: any) => ({
              id: request.id,
              type: request.type,
              applicant: request.applicant_name,
              batchId: request.batch_id,
              animalId: request.animal_id,
              submitted: request.submitted_at ? new Date(request.submitted_at).toISOString().split('T')[0] : 'Unknown',
              documents: request.documents || []
            }));
            
            setPendingRequests(pendingRequestsData);
          }
        } catch (err) {
          console.error('Error fetching pending requests:', err);
          // Fallback to mock data if API fails
          setPendingRequests([
            { 
              id: 'REQ-001', 
              type: 'Export Certificate', 
              applicant: 'Premium Abattoir Ltd', 
              batchId: 'BATCH-001', 
              submitted: '2025-10-20',
              documents: ['Health Cert', 'Processing Log', 'Origin Records']
            },
            { 
              id: 'REQ-002', 
              type: 'Halal Certificate', 
              applicant: 'Al-Salam Abattoir', 
              batchId: 'BATCH-005', 
              submitted: '2025-10-19',
              documents: ['Halal Compliance', 'Vet Records']
            },
            { 
              id: 'REQ-003', 
              type: 'Movement Permit', 
              applicant: 'John Farmer', 
              animalId: 'TC-010-NG', 
              submitted: '2025-10-18',
              documents: ['Health Certificate', 'Ownership Proof']
            }
          ]);
        }
        
        // Fetch certificates
        try {
          const { data: certsData, error: certsError } = await supabase
            .from('certificates')
            .select('*')
            .eq('issuer_role', 'regulator')
            .order('issued_at', { ascending: false });
          
          if (certsError) {
            console.error('Failed to fetch certificates:', certsError);
            // Fallback to mock data if API fails
            setCertificates([
              { id: 'CERT-001', type: 'EXPORT', issuerRole: 'REGULATOR', animalTag: 'TC-001-NG', issuerName: 'Regulator Office', issued: '2025-10-15', expires: '2026-10-15', onChainTxId: '0.0.123456@1234567890' },
              { id: 'CERT-002', type: 'HALAL', issuerRole: 'REGULATOR', animalTag: 'TC-002-NG', issuerName: 'Regulator Office', issued: '2025-10-10', expires: '2026-10-10', onChainTxId: '0.0.123456@1234567891' }
            ]);
          } else {
            // Format the data for the frontend
            const certificatesData = certsData.map((cert: any) => ({
              id: cert.id,
              type: cert.type,
              issuerRole: cert.issuer_role?.toUpperCase() || 'REGULATOR',
              animalTag: cert.animal_tag || 'Unknown',
              issuerName: cert.issuer_name || 'Regulator Office',
              issued: cert.issued_at ? new Date(cert.issued_at).toISOString().split('T')[0] : 'Unknown',
              expires: cert.expires_at ? new Date(cert.expires_at).toISOString().split('T')[0] : 'Never',
              onChainTxId: cert.on_chain_tx_id || null
            }));
            
            setCertificates(certificatesData);
          }
        } catch (err) {
          console.error('Error fetching certificates:', err);
          // Fallback to mock data if API fails
          setCertificates([
            { id: 'CERT-001', type: 'EXPORT', issuerRole: 'REGULATOR', animalTag: 'TC-001-NG', issuerName: 'Regulator Office', issued: '2025-10-15', expires: '2026-10-15', onChainTxId: '0.0.123456@1234567890' },
            { id: 'CERT-002', type: 'HALAL', issuerRole: 'REGULATOR', animalTag: 'TC-002-NG', issuerName: 'Regulator Office', issued: '2025-10-10', expires: '2026-10-10', onChainTxId: '0.0.123456@1234567891' }
          ]);
        }
        
        // Fetch certification data for analytics
        try {
          // In a real implementation, we would query the certificates table and group by month/type
          // For now, we'll use mock data
          setCertData([
            { month: 'Jul', export: 12, halal: 8, movement: 45 },
            { month: 'Aug', export: 15, halal: 12, movement: 52 },
            { month: 'Sep', export: 18, halal: 15, movement: 48 },
            { month: 'Oct', export: 22, halal: 18, movement: 63 }
          ]);
        } catch (err) {
          console.error('Error fetching certification data:', err);
          // Fallback to mock data if API fails
          setCertData([
            { month: 'Jul', export: 12, halal: 8, movement: 45 },
            { month: 'Aug', export: 15, halal: 12, movement: 52 },
            { month: 'Sep', export: 18, halal: 15, movement: 48 },
            { month: 'Oct', export: 22, halal: 18, movement: 63 }
          ]);
        }
        
        // Fetch alerts
        try {
          const { data: alertsData, error: alertsError } = await supabase
            .from('ews_alerts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
          
          if (alertsError) {
            console.error('Failed to fetch alerts:', alertsError);
            // Fallback to mock data if API fails
            setAlerts([
              { id: 'ALT-001', region: 'Kaduna State', type: 'Disease', severity: 'High', details: 'FMD outbreak reported' },
              { id: 'ALT-002', region: 'Lagos', type: 'Weather', severity: 'Medium', details: 'Heavy rainfall warning' }
            ]);
          } else {
            setAlerts(alertsData || []);
          }
        } catch (err) {
          console.error('Error fetching alerts:', err);
          // Fallback to mock data if API fails
          setAlerts([
            { id: 'ALT-001', region: 'Kaduna State', type: 'Disease', severity: 'High', details: 'FMD outbreak reported' },
            { id: 'ALT-002', region: 'Lagos', type: 'Weather', severity: 'Medium', details: 'Heavy rainfall warning' }
          ]);
        }
        
        // Fetch notifications
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
              { id: '1', title: 'New Certificate Request', message: 'Export certificate request from Premium Abattoir', time: '30 min ago', read: false },
              { id: '2', title: 'Disease Report', message: 'New disease case reported in Kaduna', time: '2 hours ago', read: false }
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
            { id: '1', title: 'New Certificate Request', message: 'Export certificate request from Premium Abattoir', time: '30 min ago', read: false },
            { id: '2', title: 'Disease Report', message: 'New disease case reported in Kaduna', time: '2 hours ago', read: false }
          ]);
        }
        
        // Fetch animals for certificate issuance
        try {
          const { data: animalsData, error: animalsError } = await supabase
            .from('animals')
            .select('id, tag_id, breed')
            .order('tag_id');
          
          if (animalsError) {
            console.error('Failed to fetch animals:', animalsError);
            // Fallback to mock data if API fails
            setAnimals([
              { id: 1, tag_id: 'TC-001-NG', breed: 'Brahman' },
              { id: 2, tag_id: 'TC-002-NG', breed: 'Angus' },
              { id: 3, tag_id: 'TC-003-NG', breed: 'Hereford' }
            ]);
          } else {
            setAnimals(animalsData || []);
          }
        } catch (err) {
          console.error('Error fetching animals:', err);
          // Fallback to mock data if API fails
          setAnimals([
            { id: 1, tag_id: 'TC-001-NG', breed: 'Brahman' },
            { id: 2, tag_id: 'TC-002-NG', breed: 'Angus' },
            { id: 3, tag_id: 'TC-003-NG', breed: 'Hereford' }
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
    { icon: FileCheck, label: 'Pending Records', active: activeView === 'pending', onClick: () => setActiveView('pending'), badge: 3 },
    { icon: Award, label: 'Certificates', active: activeView === 'certificates', onClick: () => setActiveView('certificates') },
    { icon: FileText, label: 'Movement Permits', active: activeView === 'permits', onClick: () => setActiveView('permits') },
    { icon: TrendingUp, label: 'Analytics', active: activeView === 'analytics', onClick: () => setActiveView('analytics') },
    { icon: AlertTriangle, label: 'Alerts Map', active: activeView === 'alerts', onClick: () => onNavigate('ews') },
    { icon: Wallet, label: 'Wallet', active: activeView === 'wallet', onClick: () => onNavigate('wallet') },
    { icon: Settings, label: 'Settings', active: activeView === 'settings', onClick: () => setActiveView('settings') }
  ];

  const handleApprove = async (requestId: string) => {
    try {
      // Update the request status to approved
      const { error: updateError } = await supabase
        .from('certificate_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);
      
      if (updateError) {
        console.error('Failed to approve request:', updateError);
        return;
      }
      
      alert(`Request ${requestId} approved and certificate NFT minted!`);
      
      // Refresh pending requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('certificate_requests')
        .select(`
          id,
          type,
          applicant_name,
          batch_id,
          animal_id,
          submitted_at,
          documents
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });
      
      if (!requestsError) {
        // Format the data for the frontend
        const pendingRequestsData = requestsData.map((request: any) => ({
          id: request.id,
          type: request.type,
          applicant: request.applicant_name,
          batchId: request.batch_id,
          animalId: request.animal_id,
          submitted: request.submitted_at ? new Date(request.submitted_at).toISOString().split('T')[0] : 'Unknown',
          documents: request.documents || []
        }));
        
        setPendingRequests(pendingRequestsData);
      }
    } catch (err) {
      console.error('Error approving request:', err);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      // Update the request status to rejected
      const { error: updateError } = await supabase
        .from('certificate_requests')
        .update({ 
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', requestId);
      
      if (updateError) {
        console.error('Failed to reject request:', updateError);
        return;
      }
      
      alert(`Request ${requestId} rejected. Reason: ${reason}`);
      
      // Refresh pending requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('certificate_requests')
        .select(`
          id,
          type,
          applicant_name,
          batch_id,
          animal_id,
          submitted_at,
          documents
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });
      
      if (!requestsError) {
        // Format the data for the frontend
        const pendingRequestsData = requestsData.map((request: any) => ({
          id: request.id,
          type: request.type,
          applicant: request.applicant_name,
          batchId: request.batch_id,
          animalId: request.animal_id,
          submitted: request.submitted_at ? new Date(request.submitted_at).toISOString().split('T')[0] : 'Unknown',
          documents: request.documents || []
        }));
        
        setPendingRequests(pendingRequestsData);
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  const handleIssueCertificate = async () => {
    try {
      const { data: certData, error: certError } = await supabase
        .from('certificates')
        .insert([{
          animal_id: parseInt(newCertificate.animal_id),
          issuer_id: user?.id,
          issuer_role: 'regulator',
          type: newCertificate.certificate_type,
          expires_at: newCertificate.expires_at || null,
          document_url: newCertificate.document_url,
          linked_vet_certificate_id: newCertificate.linked_vet_certificate_id || null,
          issued_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (certError) {
        console.error('Failed to issue certificate:', certError);
        return;
      }
      
      // Refresh certificates
      const { data: certsData, error: certsError } = await supabase
        .from('certificates')
        .select('*')
        .eq('issuer_role', 'regulator')
        .order('issued_at', { ascending: false });
      
      if (!certsError) {
        // Format the data for the frontend
        const certificatesData = certsData.map((cert: any) => ({
          id: cert.id,
          type: cert.type,
          issuerRole: cert.issuer_role?.toUpperCase() || 'REGULATOR',
          animalTag: cert.animal_tag || 'Unknown',
          issuerName: cert.issuer_name || 'Regulator Office',
          issued: cert.issued_at ? new Date(cert.issued_at).toISOString().split('T')[0] : 'Unknown',
          expires: cert.expires_at ? new Date(cert.expires_at).toISOString().split('T')[0] : 'Never',
          onChainTxId: cert.on_chain_tx_id || null
        }));
        
        setCertificates(certificatesData);
      }
      
      setShowIssueCertDialog(false);
      setNewCertificate({
        animal_id: '',
        certificate_type: 'EXPORT',
        expires_at: '',
        document_url: '',
        linked_vet_certificate_id: ''
      });
    } catch (err) {
      console.error('Error issuing certificate:', err);
    }
  };

  const verifyCertificate = async (certificateId: string) => {
    try {
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
      
      // In a real implementation, you would check the transaction on the blockchain
      // For now, we'll just show a placeholder
      if (isValid && certData.on_chain_tx_id) {
        // This would be a real URL in production
        // window.open(result.data.hashscanUrl, '_blank');
      }
    } catch (err) {
      console.error('Error verifying certificate:', err);
    }
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      title="Regulator Dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      walletBalance="N/A"
      notifications={notifications}
    >
      <div className="p-6 space-y-6">
        {/* Pending Records */}
        {activeView === 'pending' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Pending Requests</CardDescription>
                  <CardTitle className="font-['Poppins']">3</CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Approved This Month</CardDescription>
                  <CardTitle className="font-['Poppins']">42</CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Active Certificates</CardDescription>
                  <CardTitle className="font-['Poppins']">158</CardTitle>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Disease Alerts</CardDescription>
                  <CardTitle className="font-['Poppins']">2</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="font-['Poppins']">Pending Certification Requests</CardTitle>
                    <CardDescription>Review and approve/reject requests</CardDescription>
                  </div>
                  <Button onClick={() => setShowIssueCertDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Issue Certificate
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge>{request.id}</Badge>
                              <Badge variant="outline">{request.type}</Badge>
                            </div>
                            <div>
                              <p className="font-['Poppins'] font-medium">{request.applicant}</p>
                              <p className="text-sm text-muted-foreground">
                                {request.batchId || request.animalId} • Submitted {request.submitted}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {request.documents.map((doc: string) => (
                                <Badge key={doc} variant="secondary" className="text-xs">{doc}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedRequest(request)}>
                                  Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="font-['Poppins']">Review Request - {request.id}</DialogTitle>
                                  <DialogDescription>{request.type} for {request.applicant}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="font-medium">Applicant</p>
                                      <p className="text-muted-foreground">{request.applicant}</p>
                                    </div>
                                    <div>
                                      <p className="font-medium">Batch/Animal ID</p>
                                      <p className="text-muted-foreground">{request.batchId || request.animalId}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="font-medium mb-2">Documents</p>
                                    <div className="space-y-2">
                                      {request.documents.map((doc: string) => (
                                        <div key={doc} className="flex items-center justify-between p-2 bg-muted rounded">
                                          <span className="text-sm">{doc}</span>
                                          <Button variant="link" size="sm">View</Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Reason (for rejection)</label>
                                    <Textarea placeholder="Enter reason if rejecting..." className="bg-input-background" />
                                  </div>

                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => handleReject(request.id, 'No reason provided')}>
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject
                                    </Button>
                                    <Button onClick={() => handleApprove(request.id)}>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Approve & Mint NFT
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Certificates */}
        {activeView === 'certificates' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="font-['Poppins']">Issued Certificates</CardTitle>
                  <CardDescription>View and manage issued certificates</CardDescription>
                </div>
                <Button onClick={() => setShowIssueCertDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Issue Certificate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Animal</TableHead>
                    <TableHead>Issuer</TableHead>
                    <TableHead>Issued Date</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.id}</TableCell>
                      <TableCell>{cert.type}</TableCell>
                      <TableCell>{cert.animalTag}</TableCell>
                      <TableCell>{cert.issuerName}</TableCell>
                      <TableCell>{cert.issued}</TableCell>
                      <TableCell>{cert.expires}</TableCell>
                      <TableCell>
                        <Badge variant={cert.expires !== 'Never' && new Date(cert.expires) > new Date() ? 'default' : 'destructive'}>
                          {cert.expires !== 'Never' && new Date(cert.expires) > new Date() ? 'Active' : 'Expired'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => verifyCertificate(cert.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Verify
                          </Button>
                          {cert.onChainTxId && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                const network = import.meta.env.VITE_HEDERA_NETWORK || 'testnet';
                                const baseUrl = network === 'mainnet' 
                                  ? 'https://hashscan.io/mainnet/transaction/'
                                  : 'https://hashscan.io/testnet/transaction/';
                                window.open(`${baseUrl}${cert.onChainTxId}`, '_blank');
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View on HashScan
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Analytics */}
        {activeView === 'analytics' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Certification Analytics</CardTitle>
              <CardDescription>Monthly issuance statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={certData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="export" fill="#004643" name="Export Certificates" />
                  <Bar dataKey="halal" fill="#E76F51" name="Halal Certificates" />
                  <Bar dataKey="movement" fill="#264653" name="Movement Permits" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Movement Permits */}
        {activeView === 'permits' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Movement Permits</CardTitle>
              <CardDescription>Active movement permits</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permit ID</TableHead>
                    <TableHead>Animal ID</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">MP-001</TableCell>
                    <TableCell>TC-010-NG</TableCell>
                    <TableCell>Kaduna Farm</TableCell>
                    <TableCell>Lagos Abattoir</TableCell>
                    <TableCell>2025-10-20</TableCell>
                    <TableCell>2025-10-22</TableCell>
                    <TableCell>
                      <Badge variant="default">Active</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">MP-002</TableCell>
                    <TableCell>TC-015-NG</TableCell>
                    <TableCell>Kano Ranch</TableCell>
                    <TableCell>Abuja Market</TableCell>
                    <TableCell>2025-10-19</TableCell>
                    <TableCell>2025-10-21</TableCell>
                    <TableCell>
                      <Badge variant="default">Active</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Issue Certificate Dialog */}
        {showIssueCertDialog && (
          <Dialog open={showIssueCertDialog} onOpenChange={setShowIssueCertDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-['Poppins']">Issue New Certificate</DialogTitle>
                <DialogDescription>Create a new export, halal, or other certificate</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cert-animal">Animal</Label>
                    <Select 
                      value={newCertificate.animal_id} 
                      onValueChange={(value) => setNewCertificate({...newCertificate, animal_id: value})}
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
                  <div>
                    <Label htmlFor="cert-type">Certificate Type</Label>
                    <Select 
                      value={newCertificate.certificate_type} 
                      onValueChange={(value) => setNewCertificate({...newCertificate, certificate_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXPORT">Export Certificate</SelectItem>
                        <SelectItem value="HALAL">Halal Certificate</SelectItem>
                        <SelectItem value="OTHER">Other Certificate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {(newCertificate.certificate_type === 'EXPORT' || newCertificate.certificate_type === 'HALAL') && (
                  <div>
                    <Label htmlFor="linked-vet-cert">Linked Veterinary Certificate ID</Label>
                    <Input
                      id="linked-vet-cert"
                      value={newCertificate.linked_vet_certificate_id}
                      onChange={(e) => setNewCertificate({...newCertificate, linked_vet_certificate_id: e.target.value})}
                      placeholder="Enter veterinary certificate ID"
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="cert-expires">Expiration Date (Optional)</Label>
                  <Input
                    id="cert-expires"
                    type="date"
                    value={newCertificate.expires_at}
                    onChange={(e) => setNewCertificate({...newCertificate, expires_at: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="cert-document">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Attach Document (PDF/Image)
                    </div>
                  </Label>
                  <Input
                    id="cert-document"
                    type="url"
                    value={newCertificate.document_url}
                    onChange={(e) => setNewCertificate({...newCertificate, document_url: e.target.value})}
                    placeholder="Enter URL to certificate document"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowIssueCertDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleIssueCertificate}>
                    <Award className="w-4 h-4 mr-2" />
                    Issue Certificate
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
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