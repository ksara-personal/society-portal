import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ContactFilters } from "@/components/contacts/contact-filters";
import { ContactCard } from "@/components/contacts/contact-card";
import { getContacts, getContactCategories } from "@/actions/contacts";
import type { ContactType } from "@prisma/client";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ContactsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const search     = typeof searchParams.search     === "string" ? searchParams.search     : undefined;
  const categoryId = typeof searchParams.categoryId === "string" ? searchParams.categoryId : undefined;
  const type       = typeof searchParams.type       === "string" ? searchParams.type as ContactType : undefined;
  const page       = typeof searchParams.page       === "string" ? Number(searchParams.page) : 1;

  const [{ contacts, total, totalPages }, categories] = await Promise.all([
    getContacts({ search, categoryId, type, page }),
    getContactCategories(),
  ]);

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500">
            {total} service provider{total !== 1 ? "s" : ""} in the directory
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
        <ContactFilters categories={categories} view="list" />
      </Suspense>

      {contacts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-gray-400 text-lg">No contacts found.</p>
          <p className="text-gray-400 text-sm mt-1">
            <Link href="/contacts/new" className="text-primary hover:underline">Add the first contact</Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact as any}
              currentUserId={user.id}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={{ pathname: "/contacts", query: { ...searchParams, page: p } }}>
                {p}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
