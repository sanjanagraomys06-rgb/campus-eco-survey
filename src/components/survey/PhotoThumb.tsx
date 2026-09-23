import { useSignedUrl } from "@/lib/survey-data";
import { labelize } from "@/lib/survey-types";

export function PhotoThumb({ storageRef, type }: { storageRef: string; type: string }) {
  const { data: url } = useSignedUrl(storageRef);
  if (!url) return <div className="size-16 animate-pulse rounded-md bg-muted" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" title={labelize(type)}>
      <img src={url} alt={labelize(type)} className="size-16 rounded-md border object-cover" />
    </a>
  );
}
