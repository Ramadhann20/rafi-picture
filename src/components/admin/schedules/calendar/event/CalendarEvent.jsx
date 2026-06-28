const statusStyle = {
  pending:
    "border-secondary-container bg-secondary-container text-on-secondary-container",
  confirmed: "border-primary bg-primary text-on-primary",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

export function EventPill({ event, onClick }) {
  const className =
    statusStyle[event.status] ||
    "border-outline-variant bg-surface text-on-surface";

  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      className={`w-full rounded-lg border px-3 py-2 text-left transition-all hover:opacity-80 ${className}`}
    >
      <p className="truncate font-label-md text-label-md">
        REQUEST • {event.title}
      </p>

      <p className="truncate font-label-sm text-label-sm opacity-80">
        {event.subtitle}
      </p>
    </button>
  );
}