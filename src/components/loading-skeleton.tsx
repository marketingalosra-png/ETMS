export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-28 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="skeleton h-32 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    </div>
  );
}
