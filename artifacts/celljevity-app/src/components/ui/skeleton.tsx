import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md bg-muted/80", className)}
      style={{
        backgroundImage: "linear-gradient(90deg, transparent 0%, hsl(var(--muted-foreground) / 0.08) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
      {...props}
    />
  )
}

export { Skeleton }
