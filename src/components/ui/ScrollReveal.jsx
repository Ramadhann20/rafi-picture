"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  duration = 720,
  distance = 28,
  threshold = 0.12,
  once = true,
}) {
  const ref = useRef(null);
  const [visible, setVisible] =
    useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return undefined;

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);

            if (once) {
              observer.unobserve(element);
            }

            return;
          }

          if (!once) {
            setVisible(false);
          }
        },
        {
          threshold,
          rootMargin:
            "0px 0px -8% 0px",
        },
      );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [once, threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translate3d(0, 0, 0)"
          : `translate3d(0, ${distance}px, 0)`,
        transitionProperty:
          "opacity, transform",
        transitionDuration:
          `${duration}ms`,
        transitionDelay:
          `${delay}ms`,
        transitionTimingFunction:
          "cubic-bezier(0.22, 1, 0.36, 1)",
        willChange:
          "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
