"use client";

import { useMemo, useState } from "react";

import PersonalDetail from "./phases/PersonalDetail";
import EventInfo from "./phases/EventInfo";
import PackageOption from "./phases/PackageOption";
import BookConfirm from "./phases/BookConfirm";

const phases = [
  { id: "personal", label: "Personal Details" },
  { id: "event", label: "Event Info" },
  { id: "package", label: "Packages" },
  { id: "confirm", label: "Confirm" },
];

const initialFormData = {
  personal: {
    fullName: "",
    partnerName: "",
    email: "",
    phone: "",
    instagram: "",
  },
  event: {
    eventDate: "",
    location: "",
    vision: "",
  },
  package: {
    packageId: "premium",
  },
};

const packageOptions = [
  {
    id: "essential",
    name: "Essential",
    price: 1200,
    priceLabel: "$1,200",
    features: [
      "4 Hours Coverage",
      "Digital Gallery",
      "150+ Edited Photos",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: 2500,
    priceLabel: "$2,500",
    badge: "Most Popular",
    features: [
      "8 Hours Coverage",
      "Engagement Session",
      "400+ Edited Photos",
      "Luxury Photo Book",
    ],
  },
  {
    id: "cinema",
    name: "Cinematic",
    price: 4000,
    priceLabel: "$4,000",
    features: [
      "Full Day Photo & Video",
      "2 Videographers",
      "10min Highlight Film",
      "Drone Coverage",
    ],
  },
];

function getLocalToday() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;

  return new Date(today.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 10);
}

export default function BookingProcess({
  submitStatus = "idle",
  submitError = null,
  onSubmitBooking,
}) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const isFirstPhase = currentPhase === 0;
  const isLastPhase = currentPhase === phases.length - 1;
  const isSubmitting = submitStatus === "loading";

  const progressWidth = `${
    (currentPhase / (phases.length - 1)) * 100
  }%`;

  const selectedPackage = useMemo(() => {
    return (
      packageOptions.find(
        (item) => item.id === formData.package.packageId
      ) ?? null
    );
  }, [formData.package.packageId]);

  const updateFormSection = (section, values) => {
    setFormData((previousData) => ({
      ...previousData,
      [section]: {
        ...previousData[section],
        ...values,
      },
    }));

    /*
     * Hanya menghapus error dari field yang sedang diubah.
     * Error pada field lain tetap ditampilkan.
     */
    setErrors((previousErrors) => {
      const sectionErrors = {
        ...(previousErrors[section] ?? {}),
      };

      Object.keys(values).forEach((fieldName) => {
        delete sectionErrors[fieldName];
      });

      return {
        ...previousErrors,
        [section]: sectionErrors,
      };
    });
  };

  const getPersonalErrors = () => {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\+?[0-9\s\-()]{8,20}$/;

    const fullName = formData.personal.fullName.trim();
    const email = formData.personal.email.trim();
    const phone = formData.personal.phone.trim();

    if (!fullName) {
      nextErrors.fullName = "Full name is required.";
    } else if (fullName.length < 2) {
      nextErrors.fullName =
        "Full name must contain at least 2 characters.";
    }

    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!emailPattern.test(email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!phone) {
      nextErrors.phone = "Phone number is required.";
    } else if (!phonePattern.test(phone)) {
      nextErrors.phone = "Please enter a valid phone number.";
    }

    return nextErrors;
  };

  const getEventErrors = () => {
    const nextErrors = {};
    const today = getLocalToday();

    if (!formData.event.eventDate) {
      nextErrors.eventDate = "Preferred date is required.";
    } else if (formData.event.eventDate < today) {
      nextErrors.eventDate =
        "Preferred date cannot be in the past.";
    }

    if (!formData.event.location.trim()) {
      nextErrors.location = "Event location is required.";
    }

    return nextErrors;
  };

  const getPackageErrors = () => {
    const nextErrors = {};

    if (!formData.package.packageId) {
      nextErrors.packageId = "Please select a package.";
    } else if (!selectedPackage) {
      nextErrors.packageId =
        "The selected package is no longer available.";
    }

    return nextErrors;
  };

  const validateCurrentPhase = () => {
    let section = null;
    let nextErrors = {};

    if (currentPhase === 0) {
      section = "personal";
      nextErrors = getPersonalErrors();
    }

    if (currentPhase === 1) {
      section = "event";
      nextErrors = getEventErrors();
    }

    if (currentPhase === 2) {
      section = "package";
      nextErrors = getPackageErrors();
    }

    if (!section) {
      return true;
    }

    setErrors((previousErrors) => ({
      ...previousErrors,
      [section]: nextErrors,
    }));

    return Object.keys(nextErrors).length === 0;
  };

  const validateEntireForm = () => {
    const personalErrors = getPersonalErrors();
    const eventErrors = getEventErrors();
    const packageErrors = getPackageErrors();

    const allErrors = {
      personal: personalErrors,
      event: eventErrors,
      package: packageErrors,
    };

    setErrors(allErrors);

    if (Object.keys(personalErrors).length > 0) {
      setCurrentPhase(0);
      return false;
    }

    if (Object.keys(eventErrors).length > 0) {
      setCurrentPhase(1);
      return false;
    }

    if (Object.keys(packageErrors).length > 0) {
      setCurrentPhase(2);
      return false;
    }

    return true;
  };

  const goToNextPhase = () => {
    if (isSubmitting || !validateCurrentPhase()) return;

    setCurrentPhase((previousPhase) =>
      Math.min(previousPhase + 1, phases.length - 1)
    );
  };

  const goToPreviousPhase = () => {
    if (isSubmitting) return;

    setCurrentPhase((previousPhase) =>
      Math.max(previousPhase - 1, 0)
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!validateEntireForm()) return;

    if (!selectedPackage) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        package: {
          packageId: "Please select a valid package.",
        },
      }));

      setCurrentPhase(2);
      return;
    }

    if (typeof onSubmitBooking !== "function") {
      console.error(
        "BookingProcess: onSubmitBooking must be a function."
      );
      return;
    }

    await onSubmitBooking({
      formData,
      selectedPackage,
    });
  };

  return (
    <>
      <div className="mb-stack-lg">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 top-5 -z-10 h-px w-full bg-outline-variant" />

          <div
            className="absolute left-0 top-5 -z-10 h-px bg-primary transition-all duration-500"
            style={{ width: progressWidth }}
          />

          {phases.map((phase, index) => {
            const isCompleted = index < currentPhase;
            const isActive = index === currentPhase;

            return (
              <div
                key={phase.id}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-label-md text-label-md ring-8 ring-background transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-on-primary"
                      : isCompleted
                        ? "bg-secondary-container text-on-secondary-container"
                        : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>

                <span
                  className={`hidden font-label-sm text-label-sm sm:block ${
                    isActive || isCompleted
                      ? "text-primary"
                      : "text-on-surface-variant"
                  }`}
                >
                  {phase.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <section className="glass-panel flex min-h-125 flex-col rounded-xl p-6 shadow-sm md:p-stack-lg">
        <div className="grow">
          {currentPhase === 0 && (
            <PersonalDetail
              data={formData.personal}
              errors={errors.personal ?? {}}
              onChange={(values) =>
                updateFormSection("personal", values)
              }
            />
          )}

          {currentPhase === 1 && (
            <EventInfo
              data={formData.event}
              errors={errors.event ?? {}}
              onChange={(values) =>
                updateFormSection("event", values)
              }
            />
          )}

          {currentPhase === 2 && (
            <PackageOption
              selectedPackageId={formData.package.packageId}
              packageOptions={packageOptions}
              errors={errors.package ?? {}}
              onChange={(packageId) =>
                updateFormSection("package", { packageId })
              }
            />
          )}

          {currentPhase === 3 && (
            <>
              <BookConfirm
                formData={formData}
                selectedPackage={selectedPackage}
                submitStatus={submitStatus}
              />

              {submitError && (
                <div
                  role="alert"
                  className="mt-5 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700"
                >
                  {submitError}
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-stack-lg flex items-center justify-between border-t border-outline-variant/30 pt-stack-md">
          {!isFirstPhase ? (
            <button
              type="button"
              onClick={goToPreviousPhase}
              disabled={isSubmitting}
              className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant transition-all hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Previous
            </button>
          ) : (
            <div />
          )}

          {!isLastPhase ? (
            <button
              type="button"
              onClick={goToNextPhase}
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-10 py-3 font-label-md text-label-md text-on-primary transition-all hover:bg-opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next Step →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting || submitStatus === "success"
              }
              className="rounded-lg bg-primary px-10 py-3 font-label-md text-label-md text-on-primary transition-all hover:bg-opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Sending..."
                : submitStatus === "success"
                  ? "Inquiry Sent"
                  : "Send Inquiry"}
            </button>
          )}
        </div>
      </section>
    </>
  );
}

