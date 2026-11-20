import { Building2 } from "lucide-react";
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="inline-flex items-center justify-center rounded-lg bg-brand text-white" style={{ width: size, height: size }}>
      <Building2 size={size * 0.53} strokeWidth={2} />
    </span>
  );
}
