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
      {/* Digital Bull Logo - Geometric/Minimalist */}
      <div className={cn('relative', sizes[size].icon)}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Main bull head shape */}
          <path
            d="M24 8L8 20V32L24 44L40 32V20L24 8Z"
            className="fill-primary/10 stroke-primary"
            strokeWidth="1.5"
          />
          
          {/* Left horn */}
          <path
            d="M8 20L4 10L12 16"
            className="stroke-primary"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Right horn */}
          <path
            d="M40 20L44 10L36 16"
            className="stroke-primary"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Inner circuit lines - tech feel */}
          <path
            d="M24 16V24M18 22L24 28L30 22"
            className="stroke-primary/60"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Circuit nodes */}
          <circle cx="24" cy="16" r="2" className="fill-primary" />
          <circle cx="18" cy="22" r="1.5" className="fill-primary/60" />
          <circle cx="30" cy="22" r="1.5" className="fill-primary/60" />
          <circle cx="24" cy="28" r="2" className="fill-primary" />
          
          {/* Bottom accent line */}
          <path
            d="M16 36H32"
            className="stroke-primary/40"
            strokeWidth="1"
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
