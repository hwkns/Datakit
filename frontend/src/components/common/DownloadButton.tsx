import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DownloadButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function DownloadButton({ onClick, disabled = false }: DownloadButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="bg-transparent border-primary text-foreground hover:bg-primary/10 hover:text-primary transition-colors ml-2"
      onClick={onClick}
      disabled={disabled}
      title="Download CSV"
    >
      <Download size={16} />
    </Button>
  );
}