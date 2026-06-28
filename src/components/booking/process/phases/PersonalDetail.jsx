export default function PersonalDetail({ data, errors = {}, onChange }) {
  return (
    <div>
      <h2 className="font-headline-md text-headline-md mb-stack-md">
        Who are we capturing?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
        <div className="flex flex-col gap-2">
          <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Your Full Name
          </label>

          <input
            className="bg-surface-bright border-x-0 border-t-0 border-b border-outline py-3 px-0 focus:border-primary transition-colors text-body-md font-body-md"
            placeholder="John Doe"
            type="text"
            value={data.fullName}
            onChange={(event) => onChange({ fullName: event.target.value })}
          />

          {errors.fullName && (
            <p className="font-label-sm text-label-sm text-error">
              {errors.fullName}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Partner Name
          </label>

          <input
            className="bg-surface-bright border-x-0 border-t-0 border-b border-outline py-3 px-0 focus:border-primary transition-colors text-body-md font-body-md"
            placeholder="Jane Doe"
            type="text"
            value={data.partnerName}
            onChange={(event) => onChange({ partnerName: event.target.value })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Email Address
          </label>

          <input
            className="bg-surface-bright border-x-0 border-t-0 border-b border-outline py-3 px-0 focus:border-primary transition-colors text-body-md font-body-md"
            placeholder="john@example.com"
            type="email"
            value={data.email}
            onChange={(event) => onChange({ email: event.target.value })}
          />

          {errors.email && (
            <p className="font-label-sm text-label-sm text-error">
              {errors.email}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Phone Number
          </label>

          <input
            className="bg-surface-bright border-x-0 border-t-0 border-b border-outline py-3 px-0 focus:border-primary transition-colors text-body-md font-body-md"
            placeholder="+1 (555) 000-0000"
            type="tel"
            value={data.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
          />

          {errors.phone && (
            <p className="font-label-sm text-label-sm text-error">
              {errors.phone}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Instagram Handle
          </label>

          <div className="flex items-center gap-2 border-b border-outline py-3 px-0 focus-within:border-primary transition-colors">
            <span className="text-on-surface-variant font-body-md">@</span>

            <input
              className="bg-transparent border-none p-0 w-full focus:ring-0 text-body-md font-body-md"
              placeholder="yourprofile"
              type="text"
              value={data.instagram}
              onChange={(event) => onChange({ instagram: event.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}