import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { BRANDING } from "@/config/branding";

interface MyIssuesSummaryProps {
  societyOpenCount: number;
  villaOpenCount: number;
}

export function MyIssuesSummary({ societyOpenCount, villaOpenCount }: MyIssuesSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">My Open Issues</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/issues"
            className="rounded-lg border p-3 hover:bg-gray-50 transition-colors"
          >
            <p className="text-xs text-gray-500">Society issues</p>
            <p className="text-2xl font-bold mt-1">{societyOpenCount}</p>
          </Link>
          <Link
            href="/villa-issues"
            className="rounded-lg border p-3 hover:bg-gray-50 transition-colors"
          >
            <p className="text-xs text-gray-500">{BRANDING.unitLabel} issues</p>
            <p className="text-2xl font-bold mt-1">{villaOpenCount}</p>
          </Link>
        </div>
        <Button variant="ghost" size="sm" asChild className="mt-2 -ml-2">
          <Link href="/issues/new" className="gap-1 text-xs">
            Report an issue <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
