"use client";

import { useCallback, useEffect, useState } from "react";

type BusinessImageGalleryProps = {
  images: string[];
  businessName: string;
};

export default function BusinessImageGallery({ images, businessName }: BusinessImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const count = images.length;

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActiveIndex((index + count) % count);
    },
    [count],
  );

  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLightboxOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isLightboxOpen]);

  if (count === 0) {
    return (
      <div className="mb-8 rounded-2xl bg-surface-container h-96 flex items-center justify-center">
        <span className="material-symbols-outlined text-[48px] text-outline/40">image</span>
      </div>
    );
  }

  return (
    <div id="photos" className="mb-8 scroll-mt-36">
      <div className="grid h-[min(27rem,62vw)] grid-cols-1 gap-2 overflow-hidden rounded-2xl bg-surface-container md:grid-cols-[minmax(0,2fr)_minmax(13rem,1fr)]">
        <button type="button" className="block h-full w-full cursor-zoom-in" onClick={() => setIsLightboxOpen(true)} aria-label={`Open photo ${activeIndex + 1} full screen`}><img alt={`${businessName} — photo ${activeIndex + 1} of ${count}`} className="h-full w-full object-cover" src={images[activeIndex]} /></button>
        {count > 1 && <div className="absolute inset-x-0 bottom-0 flex justify-between p-3 md:inset-y-0 md:bottom-auto md:items-center"><button type="button" onClick={goPrev} className="flex size-9 items-center justify-center rounded-full bg-black/35 text-white transition-colors hover:bg-black/55" aria-label="Previous photo"><span className="material-symbols-outlined text-[20px]">chevron_left</span></button><button type="button" onClick={goNext} className="flex size-9 items-center justify-center rounded-full bg-black/35 text-white transition-colors hover:bg-black/55" aria-label="Next photo"><span className="material-symbols-outlined text-[20px]">chevron_right</span></button></div>}
        {count > 1 && <div className="hidden grid-cols-2 grid-rows-2 gap-2 md:grid">{images.slice(1, 5).map((src, index) => <button key={`${src}-side-${index}`} type="button" onClick={() => setActiveIndex(index + 1)} className="overflow-hidden bg-surface-container" aria-label={`Show photo ${index + 2}`}><img alt="" className="h-full w-full object-cover transition-transform hover:scale-[1.03]" src={src} /></button>)}</div>}
      </div>

      {count > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              className={`relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface-container transition-shadow ${
                index === activeIndex
                  ? "ring-2 ring-secondary ring-offset-1 ring-offset-background"
                  : "opacity-90 hover:opacity-100"
              }`}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
            >
              <img
                alt=""
                className="w-full h-full object-cover"
                src={src}
              />
            </button>
          ))}
          </div>
          <span className="hidden shrink-0 text-sm font-semibold text-primary sm:inline">View all photos <span aria-hidden="true">→</span></span>
        </div>
      )}
      {isLightboxOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-on-surface/90 p-5" role="dialog" aria-modal="true" aria-label={`${businessName} photo viewer`} onMouseDown={(event) => { if (event.target === event.currentTarget) setIsLightboxOpen(false); }}><button type="button" className="absolute right-5 top-5 flex size-11 items-center justify-center rounded-full bg-white text-on-surface hover:bg-surface-container-low" aria-label="Close photo viewer" onClick={() => setIsLightboxOpen(false)}><span className="material-symbols-outlined" aria-hidden="true">close</span></button><img src={images[activeIndex]} alt={`${businessName} — photo ${activeIndex + 1} of ${count}`} className="max-h-[85vh] max-w-full object-contain" /></div>}
    </div>
  );
}
