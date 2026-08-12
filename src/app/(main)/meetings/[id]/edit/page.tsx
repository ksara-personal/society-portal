import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getMeeting } from "@/actions/meetings";
import { MeetingForm } from "@/components/meetings/meeting-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMeetingPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/meetings");

  const meeting = await getMeeting(id);
  if (!meeting) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Meeting Minutes</h1>
      </div>
      <MeetingForm meeting={meeting} />
    </div>
  );
}
