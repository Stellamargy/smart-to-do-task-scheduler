import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  className,
}) => {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        "fixed z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "bottom-20 right-6", // Default positioning - accounts for mobile bottom nav
        "md:bottom-6 md:right-6", // Desktop positioning
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        className
      )}
      aria-label="Create new task"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
};
