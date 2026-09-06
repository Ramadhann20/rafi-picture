import { useLanguage } from "@/context/LanguageContext";

export default function PersonalDetail({
  data,
  accountData = null,
  errors = {},
  showPartnerName = false,
  personalDetails = [],
  selectedPackages = [],
  events = [],
  onChange,
  onEventChange,
  onPersonalChange,
}) {
  const { translate } = useLanguage();

  return (
    <div>
      <header className="mb-8">
        <p className="font-label-sm text-[10px] uppercase tracking-[0.24em] text-secondary">
          {translate("personalInformation")}
        </p>

        <h2 className="mt-1 font-headline-md text-headline-md text-on-surface">
          {translate("customerData")}
        </h2>

        <p className="mt-2 max-w-2xl font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          {translate("personalDescription")}
        </p>
      </header>

      <div className="space-y-7">
        {selectedPackages.map((packageItem, index) => {
          const packagePersonalDetails = personalDetails?.find(
            (item) => item.packageId === packageItem.id,
          );
          const personalData = packagePersonalDetails?.data ??
            (index === 0 ? data : {});
          const packageEvent = events[index]?.data ?? {};

          return (
            <PersonalInformationCard
              key={`${packageItem.id}-${index}`}
              index={index}
              packageItem={packageItem}
              packageEvent={packageEvent}
              data={personalData}
              accountData={accountData}
              errors={errors[String(index)] ?? {}}
              showPartnerName={packageItem.bookingSubjectType !== "individual"}
              translate={translate}
              onChange={(values) => onPersonalChange?.(packageItem.id, values)}
            />
          );
        })}
      </div>

      <div className="my-9 h-px w-full bg-outline-variant/35" />

      <section>
        <p className="font-label-sm text-[10px] uppercase tracking-[0.22em] text-secondary">
          {translate("additionalNotes")}
        </p>

        <h3 className="mt-1 font-headline-md text-headline-md text-on-surface">
          {translate("tellVision")}
        </h3>

        <p className="mt-1.5 max-w-2xl font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          {translate("visionDescription")}
        </p>

        <div className="mt-5 space-y-5">
          {selectedPackages.map((packageItem, index) => {
            const eventData = events[index]?.data ?? {};

            return (
              <article
                key={`${packageItem.id}-${index}`}
                className="rounded-xl border border-outline-variant/35 bg-surface-container-low p-5"
              >
                <h4 className="font-headline-md text-headline-md text-primary">
                  {translate("bookingDetails")} {index + 1}
                </h4>

                <p className="mt-1 font-label-md text-label-md text-on-surface">
                  {translate("bookingForPackage")}: {packageItem.name}
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 font-body-sm text-body-sm text-on-surface-variant sm:grid-cols-2">
                  <p>
                    <strong className="text-on-surface">{translate("bookingDate")}:</strong>{" "}
                    {eventData.eventDate || "-"}
                  </p>
                  <p>
                    <strong className="text-on-surface">{translate("bookingTime")}:</strong>{" "}
                    {eventData.startTime || "-"}
                  </p>
                  <p className="sm:col-span-2">
                    <strong className="text-on-surface">{translate("bookingLocation")}:</strong>{" "}
                    {eventData.location?.venueName || "-"}
                  </p>
                </div>

                <textarea
                  className="mt-4 min-h-24 w-full resize-y border-x-0 border-t-0 border-b border-outline bg-transparent px-0 py-3 font-body-md text-body-md text-on-surface transition-colors outline-none focus:border-primary"
                  placeholder={translate("visionPlaceholder")}
                  rows={3}
                  value={eventData.vision ?? ""}
                  onChange={(event) =>
                    onEventChange?.(index, {
                      vision: event.target.value,
                    })
                  }
                />
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PersonalInformationCard({
  index,
  packageItem,
  packageEvent,
  data,
  accountData,
  errors,
  showPartnerName,
  translate,
  onChange,
}) {
  const handleUseMyData = (event) => {
    const useMyData = event.target.checked;

    onChange({
      useMyData,
      ...(useMyData
        ? {
            fullName: accountData?.fullName?.trim() || data.fullName,
            email: accountData?.email?.trim() || data.email,
          }
        : { fullName: "", email: "" }),
    });
  };

  const update = (key, value) => onChange({ [key]: value });

  return (
    <article className="rounded-xl border border-outline-variant/35 bg-surface-container-low p-5 md:p-6">
      <div className="mb-6 flex flex-col gap-2 border-b border-outline-variant/25 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
            {translate("personalInformation")} {index + 1}
          </p>
          <h3 className="mt-1 font-headline-md text-headline-md text-on-surface">
            {packageItem.name}
          </h3>
        </div>
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {translate("bookingDetails")} {index + 1}: {packageEvent.eventDate || "-"}
        </p>
      </div>

      <label className="mb-7 flex w-fit cursor-pointer items-center gap-3 rounded-lg border border-outline-variant/50 bg-surface-container-low px-4 py-3">
        <input
          type="checkbox"
          checked={Boolean(data.useMyData)}
          onChange={handleUseMyData}
          className="h-4 w-4 rounded border-outline text-primary focus:ring-primary/20"
        />
        <span className="font-label-md text-label-md text-on-surface">
          {translate("useMyData")}
        </span>
      </label>

      <div className="space-y-7">
        <div className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2">
          <Field label={translate("fullName")} error={errors.fullName}>
            <input
              className="w-full border-x-0 border-t-0 border-b border-outline bg-transparent px-0 py-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
              placeholder={translate("fullNamePlaceholder")}
              type="text"
              value={data.fullName ?? ""}
              onChange={(event) => update("fullName", event.target.value)}
            />
          </Field>

          {showPartnerName && (
            <Field label={translate("partnerName")} optional>
              <input
                className="w-full border-x-0 border-t-0 border-b border-outline bg-transparent px-0 py-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
                placeholder={translate("partnerNamePlaceholder")}
                type="text"
                value={data.partnerName ?? ""}
                onChange={(event) => update("partnerName", event.target.value)}
              />
            </Field>
          )}
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2">
          <Field label={translate("emailAddress")} error={errors.email}>
            <input
              className="w-full border-x-0 border-t-0 border-b border-outline bg-transparent px-0 py-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
              placeholder="nama@email.com"
              type="email"
              value={data.email ?? ""}
              onChange={(event) => update("email", event.target.value)}
            />
          </Field>

          <Field label={translate("phoneNumber")} error={errors.phone}>
            <input
              className="w-full border-x-0 border-t-0 border-b border-outline bg-transparent px-0 py-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
              placeholder={translate("phonePlaceholder")}
              type="tel"
              value={data.phone ?? ""}
              onChange={(event) => update("phone", event.target.value)}
            />
          </Field>
        </div>

        <Field label="Instagram" optional>
          <div className="flex items-center gap-2 border-b border-outline py-3 focus-within:border-primary">
            <span className="font-body-md text-body-md text-on-surface-variant">@</span>
            <input
              className="w-full border-0 bg-transparent p-0 font-body-md text-body-md text-on-surface outline-none"
              placeholder="username"
              type="text"
              value={data.instagram ?? ""}
              onChange={(event) => update("instagram", event.target.value)}
            />
          </div>
        </Field>
      </div>
    </article>
  );
}

function Field({
  label,
  optional = false,
  error = null,
  children,
}) {
  const { translate } = useLanguage();

  return (
    <div>
      <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
        {label}

        {optional && (
          <span className="ml-2 normal-case tracking-normal text-on-surface-variant/55">
            ({translate("optional")})
          </span>
        )}
      </label>

      {children}

      {error && (
        <p
          role="alert"
          className="mt-2 font-label-sm text-label-sm font-semibold text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}
