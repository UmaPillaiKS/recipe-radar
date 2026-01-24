import { type ReactNode } from "react";
import { Card } from "./ui/card";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="p-6">
      <div className="space-y-2">
        <div className="font-medium">{title}</div>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
        {action && <div className="pt-2">{action}</div>}
      </div>
    </Card>
  );
}
