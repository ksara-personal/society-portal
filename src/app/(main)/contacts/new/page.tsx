import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { ContactForm } from "@/components/contacts/contact-form";
import { getContactCategories } from "@/actions/contacts";
import { BRANDING } from "@/config/branding";

export default async function NewContactPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const categories = await getContactCategories();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/contacts" className="flex items-center gap-1 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4" />Contacts
        </Link>
        <span>/</span>
        <span>Add contact</span>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Add a contact</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a service provider to the community directory. Everyone in {BRANDING.communityName} can see and share this contact.
        </p>
      </div>

      <ContactForm categories={categories} />
    </div>
  );
}
