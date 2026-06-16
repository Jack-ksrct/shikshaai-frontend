import { AlertTriangle, Info } from "lucide-react";

interface Props {
  errors: string[];
  type?: "error" | "warning" | "info";
}

export default function AlertBanner({ errors, type = "warning" }: Props) {
  if (!errors.length) return null;

  const colors = {
    error:   "bg-red-50 border-red-300 text-red-700",
    warning: "bg-amber-50 border-amber-300 text-amber-800",
    info:    "bg-blue-50 border-blue-300 text-blue-700",
  }[type];

  return (
    <div className={`border rounded-lg px-4 py-3 flex gap-3 items-start text-sm ${colors}`}>
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      <div className="space-y-1">
        {errors.map((e, i) => (
          <p key={i}>{e}</p>
        ))}
      </div>
    </div>
  );
}
