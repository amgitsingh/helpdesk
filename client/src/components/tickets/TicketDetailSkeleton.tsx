import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TicketDetailSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="w-2/3 h-6" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="w-1/3 h-4" />
        <Skeleton className="w-1/4 h-4" />
        <Skeleton className="w-full h-24" />
      </CardContent>
    </Card>
  );
}
