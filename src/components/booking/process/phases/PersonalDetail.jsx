export default function PersonalDetail({
  data,
  errors = {},
  showPartnerName = false,
  vision = "",
  onChange,
  onVisionChange,
}) {
  return (
    <div>
      <header className="mb-8">
        <p className="font-label-sm text-[10px] uppercase tracking-[0.24em] text-secondary">
          Personal Information
        </p>

        <h2 className="mt-1 font-headline-md text-headline-md text-on-surface">
          Data Pemesan
        </h2>

        <p className="mt-2 max-w-2xl font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          Isi data yang dapat dihubungi oleh tim Rafi Picture terkait booking dan kebutuhan acara.
        </p>
      </header>

      <div className="space-y-7">
        {/* ROW 1: Full Name + Partner Name only for couple */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2">
          <Field
            label="Nama Lengkap"
            error={errors.fullName}
          >
            <input
              className="w-full border-x-0 border-t-0 border-b border-outline bg-transparent px-0 py-3 font-body-md text-body-md text-on-surface transition-colors outline-none focus:border-primary"
              placeholder="Nama lengkap"
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
              label="Nama Pasangan"
              optional
            >
              <input
                className="w-full border-x-0 border-t-0 border-b border-outline bg-transparent px-0 py-3 font-body-md text-body-md text-on-surface transition-colors outline-none focus:border-primary"
                placeholder="Nama pasangan"
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
            label="Email"
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
            label="Nomor Telepon"
            error={errors.phone}
          >
            <input
              className="w-full border-x-0 border-t-0 border-b border-outline bg-transparent px-0 py-3 font-body-md text-body-md text-on-surface transition-colors outline-none focus:border-primary"
              placeholder="08xxxxxxxxxx"
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
          Additional Notes
        </p>

        <h3 className="mt-1 font-headline-md text-headline-md text-on-surface">
          Tell Us About Your Vision
        </h3>

        <p className="mt-1.5 max-w-2xl font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
          Ceritakan konsep, suasana, atau kebutuhan khusus yang kamu inginkan. Bagian ini opsional.
        </p>

        <textarea
          className="mt-5 min-h-28 w-full resize-y border-x-0 border-t-0 border-b border-outline bg-transparent px-0 py-3 font-body-md text-body-md text-on-surface transition-colors outline-none focus:border-primary"
          placeholder="Contoh: konsep intimate, tone hangat, fokus candid keluarga..."
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
  return (
    <div>
      <label className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
        {label}

        {optional && (
          <span className="ml-2 normal-case tracking-normal text-on-surface-variant/55">
            (Optional)
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
