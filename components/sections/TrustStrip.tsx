"use client";

type TrustStripProps = {
  variant?: "default" | "homepage";
};

export default function TrustStrip({ variant = "default" }: TrustStripProps) {
  const isHomepage = variant === "homepage";

  return (
    <section className="bg-background pb-0 pt-4 md:pt-5">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-1.5 gap-y-1 px-5 text-[13px] text-on-surface-variant lg:px-12">
        <span className="material-symbols-outlined mr-0.5 text-[17px] text-on-surface-variant" aria-hidden="true">
          location_on
        </span>
        <span>
          {isHomepage ? "Around " : "Showing places around "}
          <strong className="font-semibold text-on-surface">Bole</strong>
        </span>
      </div>
    </section>
  );
}
