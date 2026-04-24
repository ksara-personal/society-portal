import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ContactFilters } from "@/components/contacts/contact-filters";
import { ContactAccordion } from "@/components/contacts/contact-accordion";
import { getContactsByCategory, getContactCategories } from "@/actions/contacts";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const search =
    typeof searchParams.search === "string" ? searchParams.search : undefined;

  const [rawCategories, allCategories] = await Promise.all([
    getContactsByCategory(search),
    getContactCategories(),
  ]);

  const isAdmin = user.role === "ADMIN";

  // Attach category info onto each contact so ContactCard can render its badge
  const accordionData = rawCategories.map((cat) => ({
    ...cat,
    contacts: cat.contacts.map((c) => ({
      ...c,
      category: {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
      },
    })),
  }));

  const totalContacts = accordionData.reduce(
    (n, c) => n + c.contacts.length,
    0
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Service Contacts</h1>
          <p className="text-sm text-gray-500">
            {totalContacts} service provider{totalContacts !== 1 ? "s" : ""}{" "}
            across {rawCategories.length} categor
            {rawCategories.length !== 1 ? "ies" : "y"}
          </p>
        </div>
        <Button asChild>
          <Link href="/contacts/new" className="gap-2">
            <Plus className="h-4 w-4" />
            Add contact
          </Link>
        </Button>
      </div>

      <Suspense>
        <ContactFilters categories={allCategories} />
      </Suspense>

      <ContactAccordion
        categories={accordionData as any}
        currentUserId={user.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
