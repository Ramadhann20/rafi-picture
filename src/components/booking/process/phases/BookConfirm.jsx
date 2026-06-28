export default function BookConfirm({
  formData,
  selectedPackage,
  submitStatus,
}) {
  const clientName = formData.personal.fullName || "Not provided";
  const eventDate = formData.event.eventDate || "TBD";
  const eventLocation = formData.event.location || "Unspecified Location";

  return (
    <div className="text-center py-stack-md">
      <div className="w-16 h-16 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-[28px]">✓</span>
      </div>

      <h2 className="font-headline-md text-headline-md mb-4">
        Review Your Booking
      </h2>

      <p className="text-on-surface-variant font-body-md mb-stack-md max-w-md mx-auto">
        Please confirm the details below before we finalize your inquiry.
      </p>

      <div className="bg-surface-container-low rounded-lg p-6 text-left space-y-4">
        <div className="flex justify-between gap-6 border-b border-outline-variant/30 pb-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            CLIENT
          </span>

          <span className="font-label-md text-label-md text-right">
            {clientName}
          </span>
        </div>

        <div className="flex justify-between gap-6 border-b border-outline-variant/30 pb-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            DATE & LOCATION
          </span>

          <span className="font-label-md text-label-md text-right">
            {eventDate} • {eventLocation}
          </span>
        </div>

        <div className="flex justify-between gap-6 border-b border-outline-variant/30 pb-2">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            SELECTED PACKAGE
          </span>

          <span className="font-label-md text-label-md text-right">
            {selectedPackage?.name || "Not Selected"}{" "}
            {selectedPackage?.priceLabel ? `(${selectedPackage.priceLabel})` : ""}
          </span>
        </div>
      </div>

      <div className="mt-8 p-4 bg-error-container/10 border border-error-container/30 rounded-lg flex items-start gap-3 text-left">
        <span className="text-error text-[20px]">i</span>

        <p className="text-label-sm font-label-sm text-on-surface-variant">
          Submitting this form does not guarantee booking. We will review your
          details and send a contract for digital signature within 24 hours.
        </p>
      </div>

      {submitStatus === "success" && (
        <p className="mt-6 font-label-md text-label-md text-secondary">
          Thank you. Your inquiry has been prepared successfully.
        </p>
      )}
    </div>
  );
}