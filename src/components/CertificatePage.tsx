import { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { FileText, CheckCircle, XCircle } from 'lucide-react';
import type { Page } from '../App';
import { generateCertHash } from '../lib/certificateUtils';
import { supabase } from '../lib/supabaseClient';
import { logCertificateHash } from '../lib/hederaConsensus';

interface CertificatePageProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function CertificatePage({ onNavigate, onLogout }: CertificatePageProps) {
  const [activeView, setActiveView] = useState('request');
  const [certificateType, setCertificateType] = useState('export');
  const [animalId, setAnimalId] = useState('');
  const [description, setDescription] = useState('');
  
  const certificateRequests = [
    { 
      id: '1', 
      type: 'Export', 
      animalId: 'TC-001-NG', 
      status: 'Approved', 
      issuedDate: '2025-10-20',
      expiryDate: '2026-10-20',
      hash: '0x7a9f...3c2d',
      consensus_timestamp: '2025-10-20T14:30:00Z',
      hashscan_link: 'https://hashscan.io/testnet/topic/0.0.7119910'
    },
    { 
      id: '2', 
      type: 'Halal', 
      animalId: 'TC-003-NG', 
      status: 'Pending', 
      issuedDate: '',
      expiryDate: ''
    },
    { 
      id: '3', 
      type: 'Traceability', 
      animalId: 'TC-007-NG', 
      status: 'Rejected', 
      issuedDate: '',
      expiryDate: '',
      reason: 'Incomplete vaccination records'
    }
  ];

  const handleSubmitRequest = async () => {
    try {
      // Create certificate data
      const certData = {
        animalId,
        type: certificateType,
        description,
        issuedAt: new Date().toISOString()
      };

      // Generate hash using certificateUtils (now async)
      const hash = await generateCertHash(certData);

      alert(`Certificate request submitted for animal ${animalId} with hash: ${hash.substring(0, 16)}...`);

      // In a real app, this would call an API to submit the request
      setActiveView('history');
    } catch (error) {
      console.error('Error submitting certificate request:', error);
      alert('Failed to submit certificate request');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      // Find the certificate request
      const request = certificateRequests.find(r => r.id === id);
      if (!request) {
        alert('Certificate request not found');
        return;
      }
      
      // Create certificate data for hashing
      const certData = {
        animalId: request.animalId,
        type: request.type,
        issuedAt: new Date().toISOString(),
        approved: true
      };

      // Generate hash using certificateUtils (now async)
      const hash = await generateCertHash(certData);

      // Log the certificate hash on Hedera consensus service
      const transactionId = await logCertificateHash(hash, `Certificate for animal ${request.animalId}`);
      
      // In a real app, this would call an API to approve the certificate
      // and store the hash in the database
      alert(`Certificate ${id} approved with hash: ${hash.substring(0, 16)}...\nLogged to Hedera Consensus Service. Transaction ID: ${transactionId}\nView on HashScan: https://hashscan.io/testnet/topic/0.0.7119910`);
      
      // Update the certificate in Supabase (if it exists)
      const { error } = await supabase
        .from('certificates')
        .update({ 
          approved: true, 
          hash: hash,
          consensus_timestamp: new Date().toISOString(),
          hashscan_link: `https://hashscan.io/testnet/topic/0.0.7119910`,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error updating certificate:', error);
      }
    } catch (error) {
      console.error('Error approving certificate:', error);
      alert('Failed to approve certificate');
    }
  };

  const handleReject = (id: string) => {
    alert(`Certificate ${id} rejected`);
    // In a real app, this would call an API to reject the certificate
  };

  return (
    <DashboardLayout
      sidebarItems={[]}
      title="Certificates"
      onNavigate={onNavigate}
      onLogout={onLogout}
      walletBalance="$1,245.00"
      notifications={[]}
    >
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins']">Request Certificate</CardTitle>
                <CardDescription>Submit a new certificate request</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="certificateType">Certificate Type</Label>
                  <Select value={certificateType} onValueChange={setCertificateType}>
                    <SelectTrigger id="certificateType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="export">Export Certificate</SelectItem>
                      <SelectItem value="halal">Halal Certification</SelectItem>
                      <SelectItem value="traceability">Traceability Certificate</SelectItem>
                      <SelectItem value="health">Health Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="animalId">Animal Tag ID</Label>
                  <Input 
                    id="animalId" 
                    placeholder="Enter Tag ID (e.g., TC-001-NG)" 
                    value={animalId}
                    onChange={(e) => setAnimalId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Provide additional details about the certificate request..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    🔐 Digital Certification
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This certificate will be issued as an NFT and stored immutably on Hedera blockchain.
                  </p>
                </div>

                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={handleSubmitRequest}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Submit Request
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins']">Certificate History</CardTitle>
                <CardDescription>Your certificate requests and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {certificateRequests.map((request: any) => (
                    <div key={request.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{request.type} Certificate</p>
                          <p className="text-sm text-muted-foreground">Animal: {request.animalId}</p>
                        </div>
                        <Badge 
                          variant={
                            request.status === 'Approved' ? 'default' : 
                            request.status === 'Pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                      {request.status === 'Approved' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Issued: {request.issuedDate} | Expires: {request.expiryDate}
                        </p>
                      )}
                      {request.status === 'Approved' && request.hash && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <p>Verified on Hedera Testnet: {request.hash}</p>
                          {request.consensus_timestamp && (
                            <p>Consensus Timestamp: {new Date(request.consensus_timestamp).toLocaleString()}</p>
                          )}
                          {request.hashscan_link && (
                            <a 
                              href={request.hashscan_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              View on HashScan
                            </a>
                          )}
                        </div>
                      )}
                      {request.status === 'Rejected' && request.reason && (
                        <p className="text-xs text-destructive mt-1">
                          Reason: {request.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Certificate Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins']">Certificate Preview</CardTitle>
                <CardDescription>How your certificate will appear</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted rounded-xl p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-['Poppins'] text-xl font-semibold mb-2">
                      {certificateType === 'export' && 'Export Certificate'}
                      {certificateType === 'halal' && 'Halal Certification'}
                      {certificateType === 'traceability' && 'Traceability Certificate'}
                      {certificateType === 'health' && 'Health Certificate'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      This is a preview of your certificate
                    </p>
                    <div className="bg-muted p-4 rounded-lg text-left">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="font-medium">Animal ID:</span>
                        <span>{animalId || 'TC-XXX-NG'}</span>
                        
                        <span className="font-medium">Certificate Type:</span>
                        <span>
                          {certificateType === 'export' && 'Export'}
                          {certificateType === 'halal' && 'Halal'}
                          {certificateType === 'traceability' && 'Traceability'}
                          {certificateType === 'health' && 'Health'}
                        </span>
                        
                        <span className="font-medium">Status:</span>
                        <span>Pending Approval</span>
                        
                        <span className="font-medium">Issued By:</span>
                        <span>Tag Chain Authority</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approval Interface for Regulators */}
            <Card>
              <CardHeader>
                <CardTitle className="font-['Poppins']">Approval Interface</CardTitle>
                <CardDescription>For regulator use only</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-['Poppins'] font-medium mb-2">Review Certificate Request</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Animal: TC-003-NG | Type: Halal Certification
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove('2')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={() => handleReject('2')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}