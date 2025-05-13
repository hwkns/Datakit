import { Button } from '@/components/ui/Button';

import { DuckDBIcon } from '@/components/icons/DuckDBIcon';

interface QueryButtonProps {
  onClick: () => void;
  isActive: boolean;
}

export function QueryButton({ onClick, isActive }: QueryButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={`
        bg-transparent border-primary text-foreground 
        hover:bg-primary/10 hover:text-primary transition-colors
        ${isActive ? 'bg-primary/10 text-primary' : ''}
      `}
      onClick={onClick}
    >
      <DuckDBIcon size={16} className="mr-2" />
      <span>SQL</span>
    </Button>
  );
}