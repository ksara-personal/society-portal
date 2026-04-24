"use client";

import { Accordion, type AccordionGroup } from "@/components/ui/accordion";
import { ContactCard, type ContactCardData } from "./contact-card";

type ContactAccordionCategory = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  contacts: ContactCardData[];
};

interface ContactAccordionProps {
  categories: ContactAccordionCategory[];
  currentUserId: string;
  isAdmin: boolean;
}

export function ContactAccordion({
  categories,
  currentUserId,
  isAdmin,
}: ContactAccordionProps) {
  const groups: AccordionGroup<ContactCardData>[] = categories
    .filter((category) => category.contacts.length > 0)
    .map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      label: `${category.contacts.length} contact${category.contacts.length !== 1 ? "s" : ""}`,
      items: category.contacts,
    }));

  return (
    <Accordion
      groups={groups}
      renderItem={(contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          compact={true}
        />
      )}
      emptyStateText="No contacts found."
    />
  );
}
