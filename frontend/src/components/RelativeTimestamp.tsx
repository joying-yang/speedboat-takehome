import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { Tooltip } from "./ui/Tooltip/Tooltip";

type RelativeTimestampProps = {
  value: string | null;
  fallback?: string;
};

export function RelativeTimestamp({
  value,
  fallback = "Never used",
}: RelativeTimestampProps) {
  if (!value) return <span className="text-secondary">{fallback}</span>;

  const date = parseISO(value);
  const relative = formatDistanceToNowStrict(date, { addSuffix: true });
  const exact = format(date, "MMMM d, yyyy 'at' h:mm a zzz");

  return (
    <Tooltip content={exact}>
      <time dateTime={value} aria-label={exact}>
        {relative}
      </time>
    </Tooltip>
  );
}
