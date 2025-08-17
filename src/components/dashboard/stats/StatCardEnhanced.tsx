import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardEnhancedProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

export function StatCardEnhanced({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = "default",
  className
}: StatCardEnhancedProps) {
  const variantStyles = {
    default: "border-border",
    success: "border-success/20 bg-success/5",
    warning: "border-warning/20 bg-warning/5",
    destructive: "border-destructive/20 bg-destructive/5"
  };

  const iconStyles = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive"
  };

  return (
    <Card className={cn(
      "glass-card hover-lift group animate-slide-up",
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-foreground group-hover:gradient-text transition-all duration-300">
                {value}
              </p>
              {trend && (
                <span className={cn(
                  "text-sm font-medium flex items-center",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}>
                  {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <div className={cn(
            "h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-all duration-300",
            iconStyles[variant]
          )}>
            <Icon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}