import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MeetingCard } from "@/components/meetings/meeting-card";
import { getMeetings, getMeetingYears, getLatestMeeting } from "@/actions/meetings";
import { getCurrentUser } from "@/lib/session";

type MeetingWithCreator = Awaited<ReturnType<typeof getMeetings>>[number];

interface PageProps {
  searchParams: Promise<{ year?: string | string[] }>;
}

export default async function MeetingsPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  const years = await getMeetingYears();
  const yearParam = Array.isArray(resolved.year) ? resolved.year[0] : resolved.year;
  const currentYear = new Date().getFullYear();
  const year = yearParam ? Number(yearParam) : (years.includes(currentYear) ? currentYear : years[0] ?? currentYear);
  const yearOptions = years.includes(currentYear) ? years : [currentYear, ...years];

  const [meetings] = await Promise.all([
    getMeetings({ year }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meeting Minutes</h1>
          <p className="mt-1 text-sm text-gray-500">Society meeting minutes (MoM) and decisions.</p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/meetings/new">
              <Plus className="h-4 w-4" />
              Add MoM
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">All minutes</p>
        <form method="get" className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            Year
            <select name="year" defaultValue={String(year)} className="rounded-md border px-3 py-2 text-sm">
              {yearOptions.map((y: number) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
          <Button type="submit" size="sm" variant="outline">Apply</Button>
        </form>
      </div>

      {meetings.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-gray-400">No meeting minutes for {year}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m: MeetingWithCreator, index:Number) => (
            <MeetingCard key={m.id} meeting={m} isAdmin={isAdmin} defaultOpen={index == 0} />
          ))}
        </div>
      )}
    </div>
  );
}
