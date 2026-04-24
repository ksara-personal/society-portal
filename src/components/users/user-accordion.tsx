"use client";

import { Accordion, type AccordionGroup } from "@/components/ui/accordion";
import { UserCard, type UserCardData } from "./user-card";

interface UserAccordionProps {
  groups: Array<AccordionGroup<UserCardData>>;
  currentUserId: string | undefined;
  onApprove: (userId: string) => Promise<void>;
  onPromote: (userId: string) => Promise<void>;
  onDemote: (userId: string) => Promise<void>;
  onToggleActive: (userId: string, current: boolean) => Promise<void>;
  onResetPassword: (userId: string) => void;
}

export function UserAccordion({
  groups,
  currentUserId,
  onApprove,
  onPromote,
  onDemote,
  onToggleActive,
  onResetPassword,
}: UserAccordionProps) {
  return (
    <Accordion
      groups={groups}
      renderItem={(user) => (
        <UserCard
          key={user.id}
          user={user}
          isSelf={user.id === currentUserId}
          onApprove={() => onApprove(user.id)}
          onPromote={() => onPromote(user.id)}
          onDemote={() => onDemote(user.id)}
          onToggleActive={() => onToggleActive(user.id, user.isActive)}
          onResetPassword={() => onResetPassword(user.id)}
        />
      )}
      emptyStateText="No users found."
    />
  );
}
