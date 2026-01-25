import { CheckCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  success: boolean;
}

export default function StatusBadge({ success }: StatusBadgeProps) {
  if (success) {
    return (
      <span className="status-success" title="성공">
        <CheckCircle className="w-3.5 h-3.5" />
      </span>
    );
  }

  return (
    <span className="status-error" title="실패">
      <XCircle className="w-3.5 h-3.5" />
    </span>
  );
}
