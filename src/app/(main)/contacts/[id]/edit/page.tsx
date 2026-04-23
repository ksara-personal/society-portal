import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { ContactForm } from "@/components/contacts/contact-form";
import { getContactById, getContactCategories } from "@/actions/contacts";

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let contact;
  try {
    contact = await getContactById(params.id);
  } catch {
    notFound();
  }

  const isAdmin = user.role === "ADMIN";
  const isOwner = contact.createdBy.id === user.id;
  if (!isAdmin && !isOwner) redirect("/contacts");

  const categories = await getContactCategories();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`/contacts/${params.id}`} className="flex items-center gap-1 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4" />{contact.name}
        </Link>
        <span>/</span>
        <span>Edit</span>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Edit contact</h1>
        <p className="mt-1 text-sm text-gray-500">Update the details for {contact.name}.</p>
      </div>

      <ContactForm
        categories={categories}
        defaultValues={{
          id:          contact.id,
          name:        contact.name,
          type:        contact.type,
          companyName: contact.companyName ?? "",
          categoryId:  contact.categoryId,
          phone:       contact.phone ?? "",
          altPhone:    contact.altPhone ?? "",
          email:       contact.email ?? "",
          address:     contact.address ?? "",
          website:     contact.website ?? "",
          notes:       contact.notes ?? "",
        }}
      />
    </div>
  );
}
