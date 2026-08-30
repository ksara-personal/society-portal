import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays } from "lucide-react";

interface LatestMeetingCardProps {
  meeting: {
    id: string;
    title: string;
    meetingDate: Date;
  } | null;
}

export function LatestMeetingCard({ meeting }: LatestMeetingCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Latest Meeting Minutes</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/meetings" className="gap-1 text-xs">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {meeting ? (
          <Link
            href={`/meetings/${meeting.id}`}
            className="flex items-start gap-3 -mx-2 px-2 py-1.5 rounded hover:bg-gray-50 transition-colors"
          >
            <CalendarDays className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{meeting.title}</p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(meeting.meetingDate), { addSuffix: true })}
              </p>
            </div>
          </Link>
        ) : (
          <p className="py-4 text-center text-sm text-gray-400">No minutes published yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
