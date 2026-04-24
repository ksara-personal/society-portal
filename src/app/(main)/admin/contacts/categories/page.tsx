import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { getContactCategories } from "@/actions/contacts";
import { ContactCategoryTable } from "@/components/contacts/contact-category-table";

export default async function AdminContactCategoriesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const categories = await getContactCategories();

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Service Contact Categories</h1>
        <p className="text-sm text-gray-500">
          Manage the categories shown in the Service Contacts directory.
        </p>
      </div>
      <ContactCategoryTable categories={categories} />
    </div>
  );
}
