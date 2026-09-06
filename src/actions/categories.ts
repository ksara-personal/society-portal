"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { categorySchema } from "@/lib/validators";
import { CACHE_TAGS, getCachedAllCategories } from "@/lib/master-data";

/** Called by every category mutation so the cached reference reads pick up the change. */
function invalidateCategoryCaches() {
  updateTag(CACHE_TAGS.categories);
  revalidatePath("/admin/categories");
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    icon: formData.get("icon") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const slug = toSlug(parsed.data.name);

  const existing = await prisma.category.findFirst({
    where: { OR: [{ name: parsed.data.name }, { slug }] },
  });
  if (existing) return { error: "A category with this name already exists" };

  await prisma.category.create({
    data: { ...parsed.data, slug },
  });

  invalidateCategoryCaches();
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    icon: formData.get("icon") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.category.update({
    where: { id },
    data: parsed.data,
  });

  invalidateCategoryCaches();
  return { success: true };
}

export async function deleteCategory(id: string) {
  await requireAdmin();

  const issueCount = await prisma.issue.count({ where: { categoryId: id } });
  if (issueCount > 0) {
    return {
      error: `Cannot delete: ${issueCount} issue(s) are linked to this category`,
    };
  }

  await prisma.category.delete({ where: { id } });
  invalidateCategoryCaches();
  return { success: true };
}

export async function getCategories() {
  return getCachedAllCategories();
}
