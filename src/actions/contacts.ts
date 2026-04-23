"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/session";
import { contactSchema, contactCategorySchema } from "@/lib/validators";
import type { ContactType } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContactFilters = {
  search?: string;
  categoryId?: string;
  type?: ContactType;
  page?: number;
  pageSize?: number;
};

// ─── Permission helpers ───────────────────────────────────────────────────────

async function requireOwnerOrAdmin(contactId: string) {
  const user = await requireAuth();
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { createdById: true },
  });
  if (!contact) throw new Error("Contact not found");
  if (user.role !== "ADMIN" && contact.createdById !== user.id) {
    throw new Error("You don't have permission to do that");
  }
  return { user, contact };
}

// ─── READ: paginated + filtered list ─────────────────────────────────────────

export async function getContacts(filters: ContactFilters = {}) {
  await requireAuth();

  const { search, categoryId, type, page = 1, pageSize = 20 } = filters;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { companyName: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(categoryId && { categoryId }),
    ...(type && { type }),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.contact.count({ where }),
  ]);

  return {
    contacts,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─── READ: grouped by category (for kanban) ───────────────────────────────────

export async function getContactsByCategory(search?: string) {
  await requireAuth();

  return prisma.contactCategory.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    include: {
      contacts: {
        where: search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
                { companyName: { contains: search, mode: "insensitive" } },
              ],
            }
          : undefined,
        include: {
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
      },
    },
  });
}

// ─── READ: single contact ─────────────────────────────────────────────────────

export async function getContactById(id: string) {
  await requireAuth();

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      category: true,
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!contact) throw new Error("Contact not found");
  return contact;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createContact(formData: FormData) {
  const user = await requireAuth();

  const raw = {
    name:        formData.get("name"),
    type:        formData.get("type"),
    companyName: formData.get("companyName") || undefined,
    categoryId:  formData.get("categoryId"),
    phone:       formData.get("phone") || undefined,
    altPhone:    formData.get("altPhone") || undefined,
    email:       formData.get("email") || undefined,
    address:     formData.get("address") || undefined,
    website:     formData.get("website") || undefined,
    notes:       formData.get("notes") || undefined,
  };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const contact = await prisma.contact.create({
    data: { ...parsed.data, createdById: user.id },
  });

  revalidatePath("/contacts");
  revalidatePath("/contacts/kanban");
  return { contact };
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateContact(id: string, formData: FormData) {
  await requireOwnerOrAdmin(id);

  const raw = {
    name:        formData.get("name"),
    type:        formData.get("type"),
    companyName: formData.get("companyName") || undefined,
    categoryId:  formData.get("categoryId"),
    phone:       formData.get("phone") || undefined,
    altPhone:    formData.get("altPhone") || undefined,
    email:       formData.get("email") || undefined,
    address:     formData.get("address") || undefined,
    website:     formData.get("website") || undefined,
    notes:       formData.get("notes") || undefined,
  };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath("/contacts");
  revalidatePath("/contacts/kanban");
  revalidatePath(`/contacts/${id}`);
  return { contact };
}

// ─── UPDATE CATEGORY (kanban drag-and-drop, admin only) ───────────────────────

export async function moveContactToCategory(contactId: string, categoryId: string) {
  await requireAdmin();

  await prisma.contact.update({
    where: { id: contactId },
    data: { categoryId },
  });

  revalidatePath("/contacts/kanban");
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteContact(id: string) {
  await requireOwnerOrAdmin(id);

  await prisma.contact.delete({ where: { id } });

  revalidatePath("/contacts");
  revalidatePath("/contacts/kanban");
  return { success: true };
}

// ─── CONTACT CATEGORIES (admin only) ─────────────────────────────────────────

export async function getContactCategories() {
  await requireAuth();
  return prisma.contactCategory.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
}

export async function createContactCategory(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "");
  const raw = {
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    icon:  formData.get("icon")  || undefined,
    color: formData.get("color") || undefined,
    order: Number(formData.get("order") || 0),
  };

  const parsed = contactCategorySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const category = await prisma.contactCategory.create({ data: parsed.data });
  revalidatePath("/admin/contacts/categories");
  revalidatePath("/contacts/kanban");
  return { category };
}

export async function updateContactCategoryAdmin(id: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "");
  const raw = {
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    icon:  formData.get("icon")  || undefined,
    color: formData.get("color") || undefined,
    order: Number(formData.get("order") || 0),
  };

  const parsed = contactCategorySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const category = await prisma.contactCategory.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/contacts/categories");
  revalidatePath("/contacts/kanban");
  return { category };
}

export async function deleteContactCategory(id: string) {
  await requireAdmin();

  const count = await prisma.contact.count({ where: { categoryId: id } });
  if (count > 0) {
    return {
      error: `Cannot delete — ${count} contact(s) are in this category. Reassign them first.`,
    };
  }

  await prisma.contactCategory.delete({ where: { id } });
  revalidatePath("/admin/contacts/categories");
  revalidatePath("/contacts/kanban");
  return { success: true };
}
