import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Phone, Mail, MapPin, Globe, Building2, Pencil } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ContactTypeBadge } from "@/components/contacts/contact-type-badge";
import { ShareButtonWrapper } from "@/components/contacts/share-button-wrapper";
import { DeleteContactButton } from "@/components/contacts/delete-contact-button";
import { getContactById } from "@/actions/contacts";
import { format } from "date-fns";

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let contact;
  try {
    contact = await getContactById(params.id);
  } catch {
    notFound();
  }

  const isAdmin = user.role === "ADMIN";
  const canEdit = isAdmin || contact.createdBy.id === user.id;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/contacts" className="flex items-center gap-1 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4" />Contacts
        </Link>
        <span>/</span>
        <span className="truncate">{contact.name}</span>
      </div>

      {/* Card */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {contact.category.color && (
          <div className="h-2" style={{ backgroundColor: contact.category.color }} />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{contact.name}</h1>
              {contact.type === "INDIVIDUAL" && contact.companyName && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                  <Building2 className="h-4 w-4" />{contact.companyName}
                </p>
              )}
            </div>
            <ContactTypeBadge type={contact.type} />
          </div>

          <div className="mt-3">
            <Badge
              variant="outline"
              style={contact.category.color ? {
                borderColor: contact.category.color + "80",
                color: contact.category.color,
                backgroundColor: contact.category.color + "15",
              } : undefined}
            >
              {contact.category.name}
            </Badge>
          </div>

          <Separator className="my-4" />

          <dl className="space-y-3">
            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <a href={`tel:${contact.phone}`} className="text-sm hover:underline">{contact.phone}</a>
              </div>
            )}
            {contact.altPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <a href={`tel:${contact.altPhone}`} className="text-sm text-gray-500 hover:underline">{contact.altPhone} (alt)</a>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <a href={`mailto:${contact.email}`} className="text-sm hover:underline">{contact.email}</a>
              </div>
            )}
            {contact.address && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm">{contact.address}</span>
              </div>
            )}
            {contact.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">{contact.website}</a>
              </div>
            )}
          </dl>

          {contact.notes && (
            <>
              <Separator className="my-4" />
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">Notes: </span>{contact.notes}
              </p>
            </>
          )}

          <Separator className="my-4" />
          <p className="text-xs text-gray-400">
            Added by {contact.createdBy.name} · {format(new Date(contact.createdAt), "d MMM yyyy")}
            {contact.updatedAt > contact.createdAt && (
              <> · Updated {format(new Date(contact.updatedAt), "d MMM yyyy")}</>
            )}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <ShareButtonWrapper contact={contact} />
        {canEdit && (
          <Button variant="outline" asChild>
            <Link href={`/contacts/${contact.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />Edit
            </Link>
          </Button>
        )}
        {canEdit && <DeleteContactButton id={contact.id} name={contact.name} />}
      </div>
    </div>
  );
}
