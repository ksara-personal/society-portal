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
  /** Override the link target per issue. Defaults to /issues/:id */
  getHref?: (issue: IssueItem) => string;
  emptyStateText?: string;
}

export function IssueAccordion({
  groups,
  getHref,
  emptyStateText = "No issues found.",
}: IssueAccordionProps) {
  return (
    <Accordion
      groups={groups}
      renderItem={(issue) => (
        <IssueCard issue={issue} href={getHref?.(issue)} />
      )}
      emptyStateText={emptyStateText}
      gridClassName="grid-cols-1 md:grid-cols-2 gap-3"
    />
  );
}
