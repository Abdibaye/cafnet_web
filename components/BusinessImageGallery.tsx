"use client";

import { useCallback, useState } from "react";

type BusinessImageGalleryProps = {
  images: string[];
  businessName: string;
};

export default function BusinessImageGallery({ images, businessName }: BusinessImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
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

  if (count === 0) {
    return (
      <div className="mb-8 rounded-2xl bg-surface-container h-96 flex items-center justify-center">
        <span className="material-symbols-outlined text-[48px] text-outline/40">image</span>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="relative rounded-2xl overflow-hidden bg-surface-container group">
        <img
          alt={`${businessName} — photo ${activeIndex + 1} of ${count}`}
          className="w-full h-[min(28rem,55vw)] object-cover"
          src={images[activeIndex]}
        />

        {count > 1 && (
          <>
             <button
               type="button"
               onClick={goPrev}
               className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
               aria-label="Previous photo"
             >
               <span className="material-symbols-outlined text-[60px] font-light">chevron_left</span>
             </button>
             <button
               type="button"
               onClick={goNext}
               className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
               aria-label="Next photo"
             >
               <span className="material-symbols-outlined text-[60px] font-light">chevron_right</span>
             </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              className={`relative shrink-0 flex-1 min-w-0 aspect-square overflow-hidden bg-surface-container transition-shadow ${
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
      )}
    </div>
  );
}
