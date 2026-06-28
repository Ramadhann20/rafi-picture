export default function SkeletonLoader({ className = "" }) {
  return (
    <div
      className={`relative w-full min-h-[40px] overflow-hidden rounded-md bg-surface-container ${className}`}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  );
}