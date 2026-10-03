"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { sendCurrentQuarterPaymentReminders } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export function SendPaymentRemindersButton({
  quarterName,
  unpaidCount,
}: {
  quarterName: string;
  unpaidCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [lastSent, setLastSent] = useState<number | null>(null);

  function sendReminders() {
    if (!window.confirm(`Send ${quarterName} payment reminders to residents with outstanding balances?`)) return;

    startTransition(async () => {
      const result = await sendCurrentQuarterPaymentReminders();
      if ("error" in result) {
        toast({ title: "Unable to send reminders", description: result.error, variant: "destructive" });
        return;
      }

      setLastSent(result.sent);
      toast({
        title: "Payment reminders processed",
        description: `${result.sent} sent, ${result.failed} failed, ${result.noEmailFlats} due flats without an email address.`,
      });
    });
  }

  return (
    <Button type="button" variant="outline" onClick={sendReminders} disabled={isPending || unpaidCount === 0}>
      <Mail />
      {isPending
        ? "Sending..."
        : lastSent === null
          ? `Email reminders (${unpaidCount})`
          : `Send reminders again (${unpaidCount})`}
    </Button>
  );
}