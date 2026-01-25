import { CheckCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  success: boolean;
}

export default function StatusBadge({ success }: StatusBadgeProps) {
  if (success) {
    return (
      <span
        className="inline-flex items-center text-green-600 dark:text-green-400"
        title="성공"
      >
        <CheckCircle className="w-3.5 h-3.5" />
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center text-red-600 dark:text-red-400"
      title="실패"
    >
      <XCircle className="w-3.5 h-3.5" />
    </span>
  );
}
