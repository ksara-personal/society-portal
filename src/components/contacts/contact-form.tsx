"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { contactSchema, type ContactFormValues } from "@/lib/validators";
import { createContact, updateContact } from "@/actions/contacts";

interface Category { id: string; name: string }

interface ContactFormProps {
  categories: Category[];
  defaultValues?: Partial<ContactFormValues> & { id?: string };
}

export function ContactForm({ categories, defaultValues }: ContactFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(defaultValues?.id);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name:        defaultValues?.name        ?? "",
      type:        defaultValues?.type        ?? "INDIVIDUAL",
      companyName: defaultValues?.companyName ?? "",
      categoryId:  defaultValues?.categoryId  ?? "",
      phone:       defaultValues?.phone       ?? "",
      altPhone:    defaultValues?.altPhone    ?? "",
      email:       defaultValues?.email       ?? "",
      address:     defaultValues?.address     ?? "",
      website:     defaultValues?.website     ?? "",
      notes:       defaultValues?.notes       ?? "",
    },
  });

  const watchType = form.watch("type");

  function onSubmit(values: ContactFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.set(k, String(v));
    });

    startTransition(async () => {
      try {
        if (isEdit && defaultValues?.id) {
          const result = await updateContact(defaultValues.id, formData);
          if (result?.error) {
            toast({ title: "Validation error", description: String(result.error), variant: "destructive" });
            return;
          }
          toast({ title: "Contact updated" });
        } else {
          const result = await createContact(formData);
          if (result?.error) {
            toast({ title: "Validation error", description: String(result.error), variant: "destructive" });
            return;
          }
          toast({ title: "Contact added" });
        }
        router.push("/contacts");
        router.refresh();
      } catch (err: any) {
        toast({ title: "Error", description: err.message ?? "Something went wrong", variant: "destructive" });
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Name */}
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name *</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Rajan Kumar or Bright Sparks Electrical" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Type */}
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel>Type *</FormLabel>
            <FormControl>
              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-6">
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl><RadioGroupItem value="INDIVIDUAL" /></FormControl>
                  <FormLabel className="font-normal">Individual person</FormLabel>
                </FormItem>
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl><RadioGroupItem value="COMPANY" /></FormControl>
                  <FormLabel className="font-normal">Company / firm</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Company name — only for Individual */}
        {watchType === "INDIVIDUAL" && (
          <FormField control={form.control} name="companyName" render={({ field }) => (
            <FormItem>
              <FormLabel>Associated company (optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Bright Sparks Electrical" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}

        {/* Category */}
        <FormField control={form.control} name="categoryId" render={({ field }) => (
          <FormItem>
            <FormLabel>Category *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {/* Phone */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl><Input type="tel" placeholder="9876543210" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="altPhone" render={({ field }) => (
            <FormItem>
              <FormLabel>Alt phone</FormLabel>
              <FormControl><Input type="tel" placeholder="98000 11223" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Email + website */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" placeholder="contact@example.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="website" render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl><Input type="url" placeholder="https://example.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Address */}
        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem>
            <FormLabel>Address</FormLabel>
            <FormControl><Input placeholder="e.g. Sector 7, Near Main Gate" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Notes */}
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea placeholder="e.g. Very reliable, ask for 10% resident discount" rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Add contact"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </Form>
  );
}
