"use client";

export default function TrustStrip() {
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location:", position.coords);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <section className="bg-primary-container py-4">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-wrap items-center justify-center gap-2 text-center text-body-md text-sm text-on-surface-variant">
        <span className="text-on-surface-variant/90">
          It looks like you&apos;re around <strong className="font-semibold text-on-surface">Bole</strong>. If not
        </span>
        <span className="hidden sm:inline text-outline/40"><br /></span>
        <button
          className="inline-flex items-center gap-1.5 font-semibold text-secondary hover:text-[#d95547] transition-colors cursor-pointer"
          type="button"
          onClick={handleGetLocation}
        >
          <span className="material-symbols-outlined text-[18px] text-secondary" data-filled="true">
            near_me
          </span>
          <span>Get current location</span>
        </button>
      </div>
    </section>
  );
}
