import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: number; // positive = up, negative = down, undefined = neutral
  trendLabel?: string;
  className?: string;
  valueClassName?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, subValue, trend, trendLabel, className, valueClassName, icon }: StatCardProps) {
  const trendColor =
    trend === undefined || trend === 0
      ? "text-muted-foreground"
      : trend > 0
      ? "text-positive"
      : "text-destructive";

  const TrendIcon =
    trend === undefined || trend === 0 ? Minus : trend > 0 ? TrendingUp : TrendingDown;

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <p className={cn("mt-2 text-2xl font-bold tabular-nums", valueClassName)}>{value}</p>
        {(trend !== undefined || subValue) && (
          <div className="mt-1 flex items-center gap-1.5">
            {trend !== undefined && (
              <>
                <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
                <span className={cn("text-xs font-medium", trendColor)}>
                  {trend > 0 ? "+" : ""}
                  {trend.toFixed(1)}%
                </span>
              </>
            )}
            {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
            {subValue && !trendLabel && <span className="text-xs text-muted-foreground">{subValue}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
