import { cn } from "../../utils/cn";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "purple" | "outline";
interface BadgeProps { children: React.ReactNode; variant?: BadgeVariant; className?: string; }

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[#4f6ef7]/10 text-[#6b8cff] border-[#4f6ef7]/20",
  success: "bg-green-500/10 text-green-400 border-green-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  outline: "bg-transparent text-[#94a3b8] border-[#252a3d]",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("status-badge border", variantClasses[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    DRAFT: "outline", OPEN: "success", ACTIVE: "success", PUBLISHED: "info", BIDDING_OPEN: "info",
    CLOSED: "warning", EVALUATION: "warning", FINALIZED: "default", SUCCEEDED: "success",
    DEFEATED: "error", EXECUTED: "purple", AWARDED: "success", CANCELLED: "error", EXPIRED: "error",
  };
  return <Badge variant={map[status] || "outline"}>{status.replace("_", " ")}</Badge>;
}
