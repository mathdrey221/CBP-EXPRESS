import { cn } from "@/lib/utils";
import logoUrl from "@/assets/cbp-logo.jpg";

export const CBP_LOGO_URL = logoUrl;

export function CbpLogo({
  className,
  variant = "color",
  size = "md",
}: {
  className?: string;
  variant?: "color" | "light";
  size?: "sm" | "md" | "lg";
}) {
  const text = variant === "light" ? "text-sidebar-foreground" : "text-foreground";
  const box = size === "lg" ? "size-14" : size === "sm" ? "size-8" : "size-10";
  const title = size === "lg" ? "text-xl" : "text-base";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src={CBP_LOGO_URL}
        alt="Logo CBP Express"
        className={cn(box, "shrink-0 rounded-xl object-cover shadow-card")}
      />
      <span className={cn("leading-tight", text)}>
        <span className={cn("block font-extrabold tracking-tight", title)}>
          CBP <span className="text-accent">EXPRESS</span>
        </span>
        <span className="block text-[10px] font-medium tracking-[0.18em] opacity-70">24H CHRONO · BÉNIN</span>
      </span>
    </div>
  );
}
