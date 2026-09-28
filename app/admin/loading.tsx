export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-8">
      <div className="h-8 w-48 rounded-xl bg-surface-container-high" />
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="h-32 rounded-2xl bg-surface-container" />
        <div className="h-32 rounded-2xl bg-surface-container" />
        <div className="h-32 rounded-2xl bg-surface-container" />
      </div>
      <div className="h-64 rounded-2xl bg-surface-container" />
    </div>
  );
}
