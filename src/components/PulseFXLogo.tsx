import { cn } from '@/lib/utils';

interface PulseFXLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function PulseFXLogo({ className, size = 'md', showText = true }: PulseFXLogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg' },
    md: { icon: 'w-10 h-10', text: 'text-xl' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl' },
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Globe with flow lines logo */}
      <div className={cn('relative', sizes[size].icon)}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Globe outline */}
          <circle
            cx="24"
            cy="24"
            r="16"
            className="fill-primary/10 stroke-primary"
            strokeWidth="2"
          />

          {/* Meridians */}
          <path
            d="M24 8C18 12 18 36 24 40"
            className="stroke-primary/60"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M24 8C30 12 30 36 24 40"
            className="stroke-primary/60"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Parallels */}
          <path
            d="M10 20C15 18 33 18 38 20"
            className="stroke-primary/60"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M10 28C15 30 33 30 38 28"
            className="stroke-primary/60"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Flow lines */}
          <path
            d="M6 16C14 12 20 12 28 10"
            className="stroke-primary"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M20 38C28 36 34 34 42 30"
            className="stroke-primary"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-bold tracking-tight', sizes[size].text)}>
            <span className="text-gradient-gold">Pulse</span>
            <span className="text-foreground">FX</span>
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Inteligência Cambial
          </span>
        </div>
      )}
    </div>
  );
}
