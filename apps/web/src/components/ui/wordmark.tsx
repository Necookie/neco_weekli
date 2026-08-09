/** Weekli wordmark / logo lockup used in the sidebar and mobile header. */

export function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-8 text-lg" : "size-7 text-base";
  const text = size === "lg" ? "text-xl" : "text-lg";
  return (
    <div className="flex items-center gap-2">
      <span
        className={`grid ${box} place-items-center rounded-lg bg-primary font-display font-extrabold text-on-primary`}
      >
        w
      </span>
      <span className={`font-display ${text} font-extrabold tracking-tight`}>
        weekli
      </span>
    </div>
  );
}
