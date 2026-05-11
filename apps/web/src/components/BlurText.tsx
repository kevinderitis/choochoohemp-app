import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type BlurTextProps = {
  text: string;
  className?: string;
  delay?: number;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  threshold?: number;
  rootMargin?: string;
  stepDuration?: number;
};

function buildKeyframes(
  from: Record<string, string | number>,
  steps: Array<Record<string, string | number>>
) {
  const keys = new Set([...Object.keys(from), ...steps.flatMap((step) => Object.keys(step))]);
  const keyframes: Record<string, Array<string | number>> = {};

  keys.forEach((key) => {
    keyframes[key] = [from[key], ...steps.map((step) => step[key])];
  });

  return keyframes;
}

export function BlurText({
  text,
  className = "",
  delay = 120,
  animateBy = "words",
  direction = "top",
  threshold = 0.2,
  rootMargin = "0px",
  stepDuration = 0.32
}: BlurTextProps) {
  const units = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(node);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  const fromSnapshot = useMemo(
    () => ({
      filter: "blur(12px)",
      opacity: 0,
      y: direction === "top" ? -38 : 38
    }),
    [direction]
  );

  const toSnapshots = useMemo(
    () => [
      {
        filter: "blur(6px)",
        opacity: 0.55,
        y: direction === "top" ? 6 : -6
      },
      { filter: "blur(0px)", opacity: 1, y: 0 }
    ],
    [direction]
  );

  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, index) => (stepCount === 1 ? 0 : index / (stepCount - 1)));

  return (
    <p ref={ref} className={className} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
      {units.map((segment, index) => (
        <motion.span
          key={`${segment}-${index}`}
          className="inline-block will-change-[transform,filter,opacity]"
          initial={fromSnapshot}
          animate={inView ? buildKeyframes(fromSnapshot, toSnapshots) : fromSnapshot}
          transition={{
            duration: totalDuration,
            times,
            delay: (index * delay) / 1000,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          {segment}
          {animateBy === "words" && index < units.length - 1 ? "\u00A0" : null}
        </motion.span>
      ))}
    </p>
  );
}
