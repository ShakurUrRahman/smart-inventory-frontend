import { cn } from "@/lib/utils";

interface SkeletonProps {
  variant?: "card" | "row" | "stat" | "text" | "circle";
  className?: string;
}

export function Skeleton({
  variant = "text",
  className,
}: SkeletonProps) {
  const baseClass = "bg-gradient-to-r from-zinc-700 to-zinc-800 animate-pulse rounded";

  switch (variant) {
    case "card":
      return (
        <div className={cn("space-y-4", className)}>
          <div className={cn(baseClass, "h-48 w-full rounded-lg")} />
          <div className={cn(baseClass, "h-4 w-3/4")} />
          <div className={cn(baseClass, "h-4 w-1/2")} />
        </div>
      );

    case "row":
      return (
        <div className={cn("flex gap-4 items-center", className)}>
          <div className={cn(baseClass, "h-10 w-10 rounded-lg flex-shrink-0")} />
          <div className="flex-1 space-y-2">
            <div className={cn(baseClass, "h-4 w-full")} />
            <div className={cn(baseClass, "h-3 w-2/3")} />
          </div>
          <div className={cn(baseClass, "h-8 w-24")} />
        </div>
      );

    case "stat":
      return (
        <div className={cn("space-y-3", className)}>
          <div className={cn(baseClass, "h-4 w-1/2")} />
          <div className={cn(baseClass, "h-8 w-full")} />
          <div className={cn(baseClass, "h-3 w-2/3")} />
        </div>
      );

    case "circle":
      return (
        <div
          className={cn(
            baseClass,
            "rounded-full w-10 h-10",
            className
          )}
        />
      );

    case "text":
    default:
      return (
        <div className={cn(baseClass, "h-4 w-full", className)} />
      );
  }
}

export function SkeletonGrid({
  count = 4,
  variant = "card",
  columns = 2,
}: {
  count?: number;
  variant?: "card" | "row" | "stat";
  columns?: number;
}) {
  return (
    <div
      className={`grid gap-6`}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${variant === "stat" ? "250px" : "300px"}, 1fr))`,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant={variant} />
      ))}
    </div>
  );
}