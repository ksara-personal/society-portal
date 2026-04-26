"use client";

import { Accordion, type AccordionGroup } from "@/components/ui/accordion";
import { IssueCard } from "./issue-card";

export type IssueItem = {
  id: string;
  title: string;
  status: any;
  priority: any;
  wing: string | null;
  location: string | null;
  createdAt: Date;
  category: { name: string; icon: string | null };
  createdBy: { name: string; wing: string | null; flatNo: string | null };
  assignedTo?: { name: string } | null;
  attachments: { url: string }[];
};

interface IssueAccordionProps {
  groups: AccordionGroup<IssueItem>[];
  /**
   * Path prefix used to build card links: `${issueLinkPrefix}/${issue.id}`.
   * Defaults to "/issues".
   */
  issueLinkPrefix?: string;
  emptyStateText?: string;
}

export function IssueAccordion({
  groups,
  issueLinkPrefix = "/issues",
  emptyStateText = "No issues found.",
}: IssueAccordionProps) {
  return (
    <Accordion
      groups={groups}
      renderItem={(issue) => (
        <IssueCard issue={issue} href={`${issueLinkPrefix}/${issue.id}`} />
      )}
      emptyStateText={emptyStateText}
      gridClassName="grid-cols-1 md:grid-cols-2 gap-3"
    />
  );
}
