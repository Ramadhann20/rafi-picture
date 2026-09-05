import { useLanguage } from "@/context/LanguageContext";

export default function PersonalDetail({
  data,
  accountData = null,
  errors = {},
  showPartnerName = false,
  vision = "",
  onChange,
  onVisionChange,
}) {
  const { translate } = useLanguage();
  function handleUseMyData(event) {
    const useMyData = event.target.checked;

    onChange({
      useMyData,
      ...(useMyData
        ? {
            fullName: accountData?.fullName?.trim() || data.fullName,
            email: accountData?.email?.trim() || data.email,
          }
        : {
            fullName: "",
            email: "",
          }),
    });
  }

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
        {/* ROW 1: Full Name + Partner Name only for couple */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2">
          <Field
            label={translate("fullName")}
            error={errors.fullName}
          >
            <input
              className="w-full border-x-0 border-t-0 border-b border-outline bg-transparent px-0 py-3 font-body-md text-body-md text-on-surface transition-colors outline-none focus:border-primary"
              placeholder={translate("fullNamePlaceholder")}
              type="text"
              autoComplete="name"
              value={data.fullName}
              onChange={(event) =>
                onChange({
                  fullName:
                    event.target.value,
                })
              }
            />
          </Field>

          {showPartnerName && (
            <Field
              label={translate("partnerName")}
              optional
            >
              <input
                className="w-full border-x-0 border-t-0 border-b border-outline bg-transparent px-0 py-3 font-body-md text-body-md text-on-surface transition-colors outline-none focus:border-primary"
                placeholder={translate("partnerNamePlaceholder")}
                type="text"
                autoComplete="off"
                value={data.partnerName}
                onChange={(event) =>
                  onChange({
                    partnerName:
                      event.target.value,
                  })
                }
              />
            </Field>
          )}
        </div>

        {/* ROW 2: Email always starts on the next row */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2">
          <Field
            label={translate("emailAddress")}
            error={errors.email}
          >
            <input
              className="w-full border-x-0 border-t-0 border-b border-outline bg-transparent px-0 py-3 font-body-md text-body-md text-on-surface transition-colors outline-none focus:border-primary"
              placeholder="nama@email.com"
              type="email"
              autoComplete="email"
              value={data.email}
              onChange={(event) =>
                onChange({
                  email:
                    event.target.value,
                })
              }
            />
          </Field>

          <Field
            label={translate("phoneNumber")}
            error={errors.phone}
          >
            <input
              className="w-full border-x-0 border-t-0 border-b border-outline bg-transparent px-0 py-3 font-body-md text-body-md text-on-surface transition-colors outline-none focus:border-primary"
              placeholder={translate("phonePlaceholder")}
              type="tel"
              autoComplete="tel"
              value={data.phone}
              onChange={(event) =>
                onChange({
                  phone:
                    event.target.value,
                })
              }
            />
          </Field>
        </div>

        {/* ROW 3 */}
        <Field
          label="Instagram"
          optional
        >
          <div className="flex items-center gap-2 border-b border-outline py-3 transition-colors focus-within:border-primary">
            <span className="font-body-md text-body-md text-on-surface-variant">
              @
            </span>

            <input
              className="w-full border-0 bg-transparent p-0 font-body-md text-body-md text-on-surface outline-none"
              placeholder="username"
              type="text"
              autoComplete="off"
              value={data.instagram}
              onChange={(event) =>
                onChange({
                  instagram:
                    event.target.value,
                })
              }
            />
          </div>
        </Field>
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

        <textarea
          className="mt-5 min-h-28 w-full resize-y border-x-0 border-t-0 border-b border-outline bg-transparent px-0 py-3 font-body-md text-body-md text-on-surface transition-colors outline-none focus:border-primary"
          placeholder={translate("visionPlaceholder")}
          rows={4}
          value={vision}
          onChange={(event) =>
            onVisionChange?.(
              event.target.value,
            )
          }
        />
      </section>
    </div>
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
        <p className="mt-2 font-label-sm text-label-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
