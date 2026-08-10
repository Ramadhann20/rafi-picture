const STATUS_STYLE = {
  pending:
    "border-secondary-container bg-secondary-container text-on-secondary-container",

  draft:
    "border-outline-variant bg-surface-container-low text-on-surface-variant",

  booked:
    "border-primary/25 bg-primary-container text-on-primary-container",

  confirmed:
    "border-primary/25 bg-primary-container text-on-primary-container",

  in_progress:
    "border-primary/25 bg-primary-container text-on-primary-container",

  conflict:
    "border-error/25 bg-error-container text-error",

  rejected:
    "border-error/25 bg-error-container text-error",

  cancelled:
    "border-outline-variant bg-surface-container text-on-surface-variant opacity-60",
};

function getSourceLabel(
  source,
) {
  return source ===
    "schedule"
    ? "SCHEDULE"
    : "REQUEST";
}

export function EventPill({
  event,
  onClick,
}) {
  const className =
    STATUS_STYLE[
      event.status
    ] ||
    "border-outline-variant bg-surface text-on-surface";

  const sourceLabel =
    getSourceLabel(
      event.source,
    );

  return (
    <button
      type="button"
      onClick={() =>
        onClick?.(
          event,
        )
      }
      className={`w-full rounded-lg border px-3 py-2 text-left transition-all hover:opacity-80 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate font-label-md text-label-md">
          {sourceLabel} •{" "}
          {event.title}
        </p>

        {event.timeLabel && (
          <span className="shrink-0 font-label-sm text-[10px] opacity-75">
            {
              event.timeLabel
            }
          </span>
        )}
      </div>

      <p className="mt-0.5 truncate font-label-sm text-label-sm opacity-80">
        {
          event.locationLabel ||
          event.subtitle
        }
      </p>
    </button>
  );
}
