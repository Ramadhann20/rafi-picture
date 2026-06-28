import { useState } from "react";

export default function EventInfo({ data, errors = {}, onChange }) {
  const [availabilityStatus, setAvailabilityStatus] = useState("idle");

  const checkAvailability = () => {
    if (!data.eventDate) {
      setAvailabilityStatus("empty");
      return;
    }

    setAvailabilityStatus("checking");

    setTimeout(() => {
      setAvailabilityStatus(Math.random() > 0.3 ? "available" : "booked");
    }, 900);
  };

  return (
    <div>
      <h2 className="font-headline-md text-headline-md mb-stack-md">
        Event Details
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
        <div className="flex flex-col gap-2">
          <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Preferred Date
          </label>

          <div className="relative">
            <input
              className="w-full bg-surface-bright border-x-0 border-t-0 border-b border-outline py-3 px-0 focus:border-primary transition-colors text-body-md font-body-md"
              type="date"
              value={data.eventDate}
              onChange={(event) => {
                setAvailabilityStatus("idle");
                onChange({ eventDate: event.target.value });
              }}
            />

            <button
              type="button"
              onClick={checkAvailability}
              className="mt-2 md:mt-0 md:absolute md:right-0 md:bottom-3 text-secondary font-label-sm text-label-sm hover:underline transition-colors"
            >
              Check Availability
            </button>
          </div>

          {errors.eventDate && (
            <p className="font-label-sm text-label-sm text-error">
              {errors.eventDate}
            </p>
          )}

          {availabilityStatus === "empty" && (
            <p className="font-label-sm text-label-sm text-error">
              Please select a date first.
            </p>
          )}

          {availabilityStatus === "checking" && (
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Checking studio calendar...
            </p>
          )}

          {availabilityStatus === "available" && (
            <p className="font-label-sm text-label-sm text-secondary">
              Date is available for booking.
            </p>
          )}

          {availabilityStatus === "booked" && (
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              This date is fully booked. Please try another.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Event Location
          </label>

          <input
            className="bg-surface-bright border-x-0 border-t-0 border-b border-outline py-3 px-0 focus:border-primary transition-colors text-body-md font-body-md"
            placeholder="City, State or Venue Name"
            type="text"
            value={data.location}
            onChange={(event) => onChange({ location: event.target.value })}
          />

          {errors.location && (
            <p className="font-label-sm text-label-sm text-error">
              {errors.location}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Tell us about your vision
          </label>

          <textarea
            className="bg-surface-bright border-x-0 border-t-0 border-b border-outline py-3 px-0 focus:border-primary transition-colors text-body-md font-body-md resize-none"
            placeholder="Briefly describe what you're looking for..."
            rows={4}
            value={data.vision}
            onChange={(event) => onChange({ vision: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
}