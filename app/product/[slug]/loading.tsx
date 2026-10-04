// Shown instantly while a product page that isn't saved yet is being prepared.
export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-bg pb-28 md:pb-12" aria-busy="true">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:py-8 md:grid md:grid-cols-2 md:gap-10">
        <div className="md:max-w-[480px]">
          <div className="aspect-[3/4] rounded-2xl bg-black/5 animate-pulse" />
        </div>
        <div className="py-5 md:py-0 space-y-3">
          <div className="h-3 w-24 rounded bg-black/5 animate-pulse" />
          <div className="h-7 w-3/4 rounded bg-black/5 animate-pulse" />
          <div className="h-6 w-24 rounded bg-black/5 animate-pulse" />
          <div className="h-24 w-full max-w-md rounded bg-black/5 animate-pulse" />
          <div className="h-11 w-full max-w-md rounded-full bg-black/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
