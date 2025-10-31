import { Badge } from './ui/badge';
import { useEscrowStatus } from '../hooks/useEscrowStatus';

interface HederaVerificationBadgeProps {
  transactionId: string;
}

export default function HederaVerificationBadge({ transactionId }: HederaVerificationBadgeProps) {
  const { status, loading, error } = useEscrowStatus(transactionId);

  if (loading) {
    return <Badge variant="secondary">Checking status...</Badge>;
  }

  if (error) {
    return <Badge variant="destructive">Error loading status</Badge>;
  }

  if (!status) {
    return <Badge variant="outline">Status not available</Badge>;
  }

  // If hcs_tx_id exists, show verified on Hedera
  if (status.hcs_tx_id) {
    return (
      <Badge variant="default" className="gap-1">
        <span>✅</span>
        <span>Verified on Hedera</span>
      </Badge>
    );
  }

  // If escrow is funded but not yet verified on Hedera
  if (status.escrow_status === 'funded') {
    return <Badge variant="secondary">Funded, pending blockchain</Badge>;
  }

  // If escrow is released but not yet verified on Hedera
  if (status.escrow_status === 'released') {
    return <Badge variant="secondary">Released, pending blockchain</Badge>;
  }

  // If escrow is disputed
  if (status.escrow_status === 'disputed') {
    return <Badge variant="destructive">Disputed</Badge>;
  }

  // Default status
  return <Badge variant="outline">Processing</Badge>;
}