import { UtensilsCrossed } from "lucide-react";
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
    <Card className="border-dashed bg-muted/20 p-8 shadow-none">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <UtensilsCrossed className="h-5 w-5" />
        </div>
        <div className="font-semibold">{title}</div>
        {description && <div className="mt-1 text-sm leading-6 text-muted-foreground">{description}</div>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </Card>
  );
}
