import { STATUT_CLASS, STATUT_LABEL, type Statut } from "@/lib/cbp";
import { cn } from "@/lib/utils";

export function StatutBadge({ statut, className }: { statut: Statut | string; className?: string }) {
  const s = statut as Statut;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        STATUT_CLASS[s] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {STATUT_LABEL[s] ?? statut}
    </span>
  );
}
