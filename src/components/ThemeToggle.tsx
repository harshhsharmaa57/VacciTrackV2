import React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'with-label';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, variant = 'icon' }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-9 w-9', className)}
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = theme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const buttonContent = (
    <>
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform hover:rotate-12" />
      ) : (
        <Moon className="h-4 w-4 transition-transform hover:-rotate-12" />
      )}
      {variant === 'with-label' && (
        <span className="text-sm font-medium">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </>
  );

  const button = (
    <Button
      variant="ghost"
      size={variant === 'with-label' ? 'default' : 'icon'}
      onClick={toggleTheme}
      className={cn(
        'text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
        variant === 'icon' ? 'h-9 w-9' : 'gap-2',
        className
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {buttonContent}
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {button}
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      </TooltipContent>
    </Tooltip>
  );
};

export default ThemeToggle;
