import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ContactFilters } from "@/components/contacts/contact-filters";
import { ContactKanban } from "@/components/contacts/contact-kanban";
import { getContactsByCategory, getContactCategories } from "@/actions/contacts";

interface PageProps {
  searchParams: { search?: string };
}

export default async function ContactsKanbanPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN";
  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;

  const [rawCategories, allCategories] = await Promise.all([
    getContactsByCategory(search),
    getContactCategories(),
  ]);

  // Attach category info onto each contact so the card can render the badge
  const kanbanData = rawCategories.map((cat) => ({
    ...cat,
    contacts: cat.contacts.map((c) => ({
      ...c,
      category: { id: cat.id, name: cat.name, icon: cat.icon, color: cat.color },
    })),
  }));

  const totalContacts = kanbanData.reduce((n, c) => n + c.contacts.length, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500">
            {totalContacts} service provider{totalContacts !== 1 ? "s" : ""} across {rawCategories.length} categories
            {isAdmin && <span className="ml-2 text-xs">· Drag cards to re-categorise</span>}
          </p>
        </div>
        <Button asChild>
          <Link href="/contacts/new" className="gap-2">
            <Plus className="h-4 w-4" />Add contact
          </Link>
        </Button>
      </div>

      <Suspense>
        <ContactFilters categories={allCategories} view="kanban" />
      </Suspense>

      <ContactKanban
        initialCategories={kanbanData as any}
        currentUserId={user.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
