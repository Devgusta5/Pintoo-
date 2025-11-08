import { cn } from "@/lib/utils";

interface LinedPaperProps extends React.HTMLAttributes<HTMLDivElement> {
  lineHeight?: number;
  marginLeft?: number;
}

export function LinedPaper({ 
  children, 
  className,
  lineHeight = 32,
  marginLeft = 60,
  ...props 
}: LinedPaperProps) {
  return (
    <div 
      className={cn(
        "relative w-full bg-card dark:bg-card/95", 
        className
      )} 
      style={{
        backgroundImage: `
          linear-gradient(var(--background) 0px, transparent 0px),
          linear-gradient(90deg, hsl(var(--primary))/${0.04} ${marginLeft}px, transparent ${marginLeft}px),
          repeating-linear-gradient(var(--background) 0px, var(--background) ${lineHeight - 1}px, hsl(var(--muted))/${0.12} ${lineHeight - 1}px, hsl(var(--muted))/${0.12} ${lineHeight}px)
        `,
        backgroundSize: `100% ${lineHeight}px, ${marginLeft}px 100%, 100% ${lineHeight}px`,
        backgroundPosition: "0 0",
      }}
      {...props}
    >
      {children}
    </div>
  );
}