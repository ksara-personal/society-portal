import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { MeetingForm } from "@/components/meetings/meeting-form";

export default async function NewMeetingPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/meetings");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Meeting Minutes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Save as a draft to keep working on it, or publish to make it visible to all residents.
        </p>
      </div>
      <MeetingForm />
    </div>
  );
}
