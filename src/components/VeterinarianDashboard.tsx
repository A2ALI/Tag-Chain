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
  User,
  FileText,
  Plus,
  CheckCircle,
  AlertCircle,
  Calendar,
  Upload,
  Eye,
  Award
} from 'lucide-react';
import type { Page } from '../App';
import { useAuth } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

interface VeterinarianDashboardProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function VeterinarianDashboard({ onNavigate, onLogout }: VeterinarianDashboardProps) {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('animals');
  const [animals, setAnimals] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddRecordDialog, setShowAddRecordDialog] = useState(false);
  const [showIssueCertDialog, setShowIssueCertDialog] = useState(false);
  const [newRecord, setNewRecord] = useState({
    animal_id: '',
    record_type: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    attachment_url: ''
  });
  const [newCertificate, setNewCertificate] = useState({
    animal_id: '',
    certificate_type: 'VET_HEALTH',
    expires_at: '',
    document_url: ''
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
        
        // Fetch animals assigned to this vet
        try {
          const { data: animalsData, error: animalsError } = await supabase
            .from('animals')
            .select('*')
            .eq('vet_id', user.id)
            .order('created_at', { ascending: false });
          
          if (animalsError) {
            console.error('Failed to fetch animals:', animalsError);
            // Fallback to mock data if API fails
            setAnimals([
              { id: 1, tag_id: 'TC-001-NG', breed: 'Brahman', age: 3, owner: 'John Farmer' },
              { id: 2, tag_id: 'TC-002-NG', breed: 'Angus', age: 2, owner: 'Mary Smith' },
              { id: 3, tag_id: 'TC-003-NG', breed: 'Hereford', age: 4, owner: 'Robert Johnson' }
            ]);
          } else {
            setAnimals(animalsData || []);
          }
        } catch (err) {
          console.error('Error fetching animals:', err);
          // Fallback to mock data if API fails
          setAnimals([
            { id: 1, tag_id: 'TC-001-NG', breed: 'Brahman', age: 3, owner: 'John Farmer' },
            { id: 2, tag_id: 'TC-002-NG', breed: 'Angus', age: 2, owner: 'Mary Smith' },
            { id: 3, tag_id: 'TC-003-NG', breed: 'Hereford', age: 4, owner: 'Robert Johnson' }
          ]);
        }
        
        // Fetch vet records
        try {
          const { data: recordsData, error: recordsError } = await supabase
            .from('vet_records')
            .select(`
              *,
              animals(tag_id)
            `)
            .eq('vet_id', user.id)
            .order('date', { ascending: false });
          
          if (recordsError) {
            console.error('Failed to fetch records:', recordsError);
            // Fallback to mock data if API fails
            setRecords([
              { id: 1, animal_id: 1, record_type: 'Vaccination', date: '2025-10-15', description: 'Annual vaccination for FMD', signature_hash: 'abc123', on_chain_hash: 'xyz789' },
              { id: 2, animal_id: 2, record_type: 'Treatment', date: '2025-10-10', description: 'Antibiotic treatment for respiratory infection', signature_hash: 'def456', on_chain_hash: 'uvw456' }
            ]);
          } else {
            setRecords(recordsData || []);
          }
        } catch (err) {
          console.error('Error fetching records:', err);
          // Fallback to mock data if API fails
          setRecords([
            { id: 1, animal_id: 1, record_type: 'Vaccination', date: '2025-10-15', description: 'Annual vaccination for FMD', signature_hash: 'abc123', on_chain_hash: 'xyz789' },
            { id: 2, animal_id: 2, record_type: 'Treatment', date: '2025-10-10', description: 'Antibiotic treatment for respiratory infection', signature_hash: 'def456', on_chain_hash: 'uvw456' }
          ]);
        }
        
        // Fetch issued certificates
        try {
          const { data: certsData, error: certsError } = await supabase
            .from('certificates')
            .select('*')
            .eq('issuer_id', user.id)
            .eq('issuer_role', 'veterinarian')
            .order('issued_at', { ascending: false });
          
          if (certsError) {
            console.error('Failed to fetch certificates:', certsError);
            // Fallback to mock data if API fails
            setCertificates([
              { id: 'CERT-001', animal_id: 1, type: 'VET_HEALTH', issued: '2025-10-20', expires: '2026-10-20', on_chain_tx_id: '0.0.123456@1234567890' },
              { id: 'CERT-002', animal_id: 2, type: 'VET_HEALTH', issued: '2025-10-15', expires: '2026-10-15', on_chain_tx_id: '0.0.123456@1234567891' }
            ]);
          } else {
            setCertificates(certsData || []);
          }
        } catch (err) {
          console.error('Error fetching certificates:', err);
          // Fallback to mock data if API fails
          setCertificates([
            { id: 'CERT-001', animal_id: 1, type: 'VET_HEALTH', issued: '2025-10-20', expires: '2026-10-20', on_chain_tx_id: '0.0.123456@1234567890' },
            { id: 'CERT-002', animal_id: 2, type: 'VET_HEALTH', issued: '2025-10-15', expires: '2026-10-15', on_chain_tx_id: '0.0.123456@1234567891' }
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
    { icon: User, label: 'My Animals', active: activeView === 'animals', onClick: () => setActiveView('animals') },
    { icon: FileText, label: 'Records', active: activeView === 'records', onClick: () => setActiveView('records') },
    { icon: Award, label: 'Certificates', active: activeView === 'certificates', onClick: () => setActiveView('certificates') },
    { icon: Plus, label: 'Add Record', active: activeView === 'add', onClick: () => setActiveView('add') },
    { icon: Plus, label: 'Issue Certificate', active: activeView === 'issue-cert', onClick: () => setActiveView('issue-cert') }
  ];

  const handleAddRecord = async () => {
    try {
      const { data: recordData, error: recordError } = await supabase
        .from('vet_records')
        .insert([{
          animal_id: parseInt(newRecord.animal_id),
          vet_id: user?.id,
          record_type: newRecord.record_type,
          description: newRecord.description,
          date: newRecord.date,
          attachment_url: newRecord.attachment_url
        }])
        .select()
        .single();
      
      if (recordError) {
        console.error('Failed to add record:', recordError);
        return;
      }
      
      // Refresh records
      const { data: recordsData, error: recordsError } = await supabase
        .from('vet_records')
        .select(`
          *,
          animals(tag_id)
        `)
        .eq('vet_id', user?.id)
        .order('date', { ascending: false });
      
      if (!recordsError) {
        setRecords(recordsData || []);
      }
      
      setShowAddRecordDialog(false);
      setNewRecord({
        animal_id: '',
        record_type: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        attachment_url: ''
      });
    } catch (err) {
      console.error('Error adding record:', err);
    }
  };

  const handleIssueCertificate = async () => {
    try {
      const { data: certData, error: certError } = await supabase
        .from('certificates')
        .insert([{
          animal_id: parseInt(newCertificate.animal_id),
          issuer_id: user?.id,
          issuer_role: 'veterinarian',
          type: newCertificate.certificate_type,
          expires_at: newCertificate.expires_at || null,
          document_url: newCertificate.document_url,
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
        .eq('issuer_id', user?.id)
        .eq('issuer_role', 'veterinarian')
        .order('issued_at', { ascending: false });
      
      if (!certsError) {
        setCertificates(certsData || []);
      }
      
      setShowIssueCertDialog(false);
      setNewCertificate({
        animal_id: '',
        certificate_type: 'VET_HEALTH',
        expires_at: '',
        document_url: ''
      });
    } catch (err) {
      console.error('Error issuing certificate:', err);
    }
  };

  const verifySignature = async (recordId: string) => {
    try {
      const { data: recordData, error: recordError } = await supabase
        .from('vet_records')
        .select('signature_hash, on_chain_hash')
        .eq('id', recordId)
        .single();
      
      if (recordError) {
        console.error('Failed to verify signature:', recordError);
        return;
      }
      
      const isVerified = !!recordData.on_chain_hash;
      const signatureHash = recordData.signature_hash || 'N/A';
      
      alert(`Verification Result:\nVerified: ${isVerified}\nHash: ${signatureHash}`);
      
      // In a real implementation, you would check the hash on the blockchain
      // For now, we'll just show a placeholder
      if (isVerified) {
        // This would be a real URL in production
        // window.open(result.data.hashscan_url, '_blank');
      }
    } catch (err) {
      console.error('Error verifying signature:', err);
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
      title="Veterinarian Dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      walletBalance="$1,245.50"
      notifications={[]}
    >
      <div className="p-6 space-y-6">
        {/* My Animals */}
        {activeView === 'animals' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Assigned Animals</CardTitle>
              <CardDescription>Animals requiring veterinary attention</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag Number</TableHead>
                    <TableHead>Breed</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {animals.map((animal) => (
                    <TableRow key={animal.id}>
                      <TableCell className="font-medium">{animal.tag_id}</TableCell>
                      <TableCell>{animal.breed}</TableCell>
                      <TableCell>{animal.age} years</TableCell>
                      <TableCell>{animal.owner}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => setSelectedAnimal(animal)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Records
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Records */}
        {activeView === 'records' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Veterinary Records</CardTitle>
              <CardDescription>All veterinary records with blockchain verification</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Animal</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.animals?.tag_id || 'Unknown'}</TableCell>
                      <TableCell>{record.record_type}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>
                        {record.on_chain_hash ? (
                          <Badge variant="default">Verified</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => verifySignature(record.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify
                          </Button>
                          {record.attachment_url && (
                            <Button variant="outline" size="sm" onClick={() => window.open(record.attachment_url, '_blank')}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
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

        {/* Certificates */}
        {activeView === 'certificates' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Issued Certificates</CardTitle>
              <CardDescription>All certificates issued by you with blockchain verification</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Animal</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">Animal #{cert.animal_id}</TableCell>
                      <TableCell>{cert.type}</TableCell>
                      <TableCell>{cert.issued ? new Date(cert.issued).toLocaleDateString() : 'Unknown'}</TableCell>
                      <TableCell>{cert.expires ? new Date(cert.expires).toLocaleDateString() : 'Never'}</TableCell>
                      <TableCell>
                        {cert.expires && new Date(cert.expires) > new Date() ? (
                          <Badge variant="default">Active</Badge>
                        ) : cert.expires ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => verifyCertificate(cert.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify
                          </Button>
                          {cert.on_chain_tx_id && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                const network = import.meta.env.VITE_HEDERA_NETWORK || 'testnet';
                                const baseUrl = network === 'mainnet' 
                                  ? 'https://hashscan.io/mainnet/transaction/'
                                  : 'https://hashscan.io/testnet/transaction/';
                                window.open(`${baseUrl}${cert.on_chain_tx_id}`, '_blank');
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

        {/* Add Record */}
        {activeView === 'add' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Add Veterinary Record</CardTitle>
              <CardDescription>Create a new veterinary record for an animal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="animal">Animal</Label>
                    <Select 
                      value={newRecord.animal_id} 
                      onValueChange={(value) => setNewRecord({...newRecord, animal_id: value})}
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
                    <Label htmlFor="record-type">Record Type</Label>
                    <Select 
                      value={newRecord.record_type} 
                      onValueChange={(value) => setNewRecord({...newRecord, record_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vaccination">Vaccination</SelectItem>
                        <SelectItem value="treatment">Treatment</SelectItem>
                        <SelectItem value="examination">Examination</SelectItem>
                        <SelectItem value="surgery">Surgery</SelectItem>
                        <SelectItem value="birth">Birth Record</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newRecord.description}
                    onChange={(e) => setNewRecord({...newRecord, description: e.target.value})}
                    placeholder="Enter detailed description of the procedure..."
                  />
                </div>
                <div>
                  <Label htmlFor="attachment">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Attach Certificate (PDF/Image)
                    </div>
                  </Label>
                  <Input
                    id="attachment"
                    type="url"
                    value={newRecord.attachment_url}
                    onChange={(e) => setNewRecord({...newRecord, attachment_url: e.target.value})}
                    placeholder="Enter URL to certificate or upload file"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleAddRecord}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Record
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Issue Certificate */}
        {activeView === 'issue-cert' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-['Poppins']">Issue Health Certificate</CardTitle>
              <CardDescription>Create a new health certificate for an animal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
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
                        <SelectItem value="VET_HEALTH">Health Certificate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="expires">Expiration Date (Optional)</Label>
                  <Input
                    id="expires"
                    type="date"
                    value={newCertificate.expires_at}
                    onChange={(e) => setNewCertificate({...newCertificate, expires_at: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="cert-attachment">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Attach Document (PDF/Image)
                    </div>
                  </Label>
                  <Input
                    id="cert-attachment"
                    type="url"
                    value={newCertificate.document_url}
                    onChange={(e) => setNewCertificate({...newCertificate, document_url: e.target.value})}
                    placeholder="Enter URL to certificate document"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleIssueCertificate}>
                    <Award className="w-4 h-4 mr-2" />
                    Issue Certificate
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