import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PAYMENT_STATUS_LABELS } from "@/lib/utils";

interface DuesSummaryCardProps {
  outstandingAmount: number;
  currentQuarterName: string | null;
  currentQuarterStatus: string | null;
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  PAID: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  WAIVED: "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200",
  PARTIAL: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200",
  PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
  OVERDUE: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
};

export function DuesSummaryCard({
  outstandingAmount,
  currentQuarterName,
  currentQuarterStatus,
}: DuesSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">My Dues</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/payments" className="gap-1 text-xs">
            View payment history <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-gray-500">Outstanding amount</p>
          <p
            className={`text-2xl font-bold ${
              outstandingAmount > 0 ? "text-destructive" : "text-green-600"
            }`}
          >
            ₹{outstandingAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
        {currentQuarterName && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{currentQuarterName}:</span>
            <Badge className={STATUS_BADGE_CLASS[currentQuarterStatus ?? "PENDING"]}>
              {PAYMENT_STATUS_LABELS[currentQuarterStatus ?? "PENDING"] ?? currentQuarterStatus}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
