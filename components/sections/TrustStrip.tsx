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
    <section className="bg-background pb-2">
      <div className="mx-auto flex max-w-7xl items-center px-6 text-[13px] text-on-surface-variant lg:px-12">
        <span className="material-symbols-outlined mr-2 text-[17px] text-on-surface-variant" aria-hidden="true">
          location_on
        </span>
        <span>
          Showing places around <strong className="font-semibold text-on-surface">Bole</strong>
        </span>
        <button
          className="ml-2 inline-flex cursor-pointer items-center gap-1 font-semibold text-secondary transition-colors hover:text-[#d95547]"
          type="button"
          onClick={handleGetLocation}
        >
          <span>Use my current location</span>
          <span className="material-symbols-outlined text-[17px]" aria-hidden="true">arrow_forward</span>
        </button>
      </div>
    </section>
  );
}
