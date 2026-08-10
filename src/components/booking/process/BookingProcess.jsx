"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import PersonalDetail from "./phases/PersonalDetail";
import EventInfo from "./phases/EventInfo";
import PackageOption from "./phases/PackageOption";
import BookConfirm from "./phases/BookConfirm";
import {
  createEventLocation,
  isValidCoordinates,
  normalizeEventLocation,
} from "@/lib/location";

const phases = [
  { id: "package", label: "Packages" },
  { id: "event", label: "Event Info" },
  { id: "personal", label: "Personal Details" },
  { id: "confirm", label: "Confirm" },
];

function normalizeInitialPackageId(value) {
  if (Array.isArray(value)) {
    return String(value[0] ?? "").trim();
  }

  return String(value ?? "").trim();
}

function createInitialFormData(initialPackageId) {
  return {
    personal: {
      fullName: "",
      partnerName: "",
      email: "",
      phone: "",
      instagram: "",
    },
    event: {
      eventDate: "",
      startTime: "",
      endTime: "",
      endTimeDayOffset: 0,
      location: createEventLocation(),
      vision: "",
    },
    package: {
      packageId: normalizeInitialPackageId(initialPackageId),
    },
  };
}

function getLocalToday() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;

  return new Date(today.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 10);
}

export default function BookingProcess({
  packageOptions = [],
  initialPackageId = null,
  packagesLoading = false,
  packagesError = null,
  submitStatus = "idle",
  submitError = null,
  onSubmitBooking,
}) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [formData, setFormData] = useState(() =>
    createInitialFormData(initialPackageId)
  );
  const [errors, setErrors] = useState({});

  const [phaseVisible, setPhaseVisible] =
    useState(true);
  const [isPhaseTransitioning, setIsPhaseTransitioning] =
    useState(false);

  const phaseTopRef = useRef(null);
  const phaseSwitchTimerRef = useRef(null);
  const phaseFinishTimerRef = useRef(null);

  useEffect(() => {
    const nextPackageId = normalizeInitialPackageId(initialPackageId);

    setFormData((previousData) => {
      if (previousData.package.packageId === nextPackageId) {
        return previousData;
      }

      return {
        ...previousData,
        package: {
          ...previousData.package,
          packageId: nextPackageId,
        },
      };
    });
  }, [initialPackageId]);

  useEffect(() => {
    return () => {
      if (phaseSwitchTimerRef.current) {
        window.clearTimeout(
          phaseSwitchTimerRef.current,
        );
      }

      if (phaseFinishTimerRef.current) {
        window.clearTimeout(
          phaseFinishTimerRef.current,
        );
      }
    };
  }, []);

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
  }, [formData.package.packageId, packageOptions]);

  /*
   * Backward compatibility:
   * package lama yang belum memiliki bookingSubjectType tetap
   * menampilkan Partner Name sebagai field opsional.
   */
  const showPartnerName =
    Boolean(selectedPackage) &&
    selectedPackage.bookingSubjectType !== "individual";

  useEffect(() => {
    if (
      selectedPackage?.bookingSubjectType === "individual" &&
      formData.personal.partnerName
    ) {
      setFormData((previousData) => ({
        ...previousData,
        personal: {
          ...previousData.personal,
          partnerName: "",
        },
      }));

      setErrors((previousErrors) => {
        const personalErrors = {
          ...(previousErrors.personal ?? {}),
        };
        delete personalErrors.partnerName;

        return {
          ...previousErrors,
          personal: personalErrors,
        };
      });
    }
  }, [
    selectedPackage?.bookingSubjectType,
    formData.personal.partnerName,
  ]);

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

    if (
      formData.event.eventDate &&
      !formData.event.startTime
    ) {
      nextErrors.startTime =
        "Jam mulai acara wajib dipilih.";
    }

    const eventLocation = normalizeEventLocation(
      formData.event.location,
    );

    if (!eventLocation.venueName.trim()) {
      nextErrors.location =
        "Venue atau lokasi acara wajib diisi.";
    } else if (
      !isValidCoordinates(eventLocation.coordinates)
    ) {
      nextErrors.location =
        "Pilih titik lokasi event pada peta.";
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

  const scrollToPhaseTop = () => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;

    phaseTopRef.current?.scrollIntoView({
      behavior:
        prefersReducedMotion
          ? "auto"
          : "smooth",
      block: "start",
    });
  };

  const transitionToPhase = (
    nextPhase,
  ) => {
    const targetPhase =
      Math.max(
        0,
        Math.min(
          nextPhase,
          phases.length - 1,
        ),
      );

    if (
      targetPhase === currentPhase ||
      isPhaseTransitioning
    ) {
      return;
    }

    setIsPhaseTransitioning(true);
    setPhaseVisible(false);

    if (phaseSwitchTimerRef.current) {
      window.clearTimeout(
        phaseSwitchTimerRef.current,
      );
    }

    if (phaseFinishTimerRef.current) {
      window.clearTimeout(
        phaseFinishTimerRef.current,
      );
    }

    phaseSwitchTimerRef.current =
      window.setTimeout(() => {
        setCurrentPhase(targetPhase);

        window.requestAnimationFrame(() => {
          scrollToPhaseTop();
          setPhaseVisible(true);

          phaseFinishTimerRef.current =
            window.setTimeout(() => {
              setIsPhaseTransitioning(
                false,
              );
            }, 280);
        });
      }, 140);
  };

  const validateCurrentPhase = () => {
    let section = null;
    let nextErrors = {};

    if (currentPhase === 0) {
      section = "package";
      nextErrors = getPackageErrors();
    }

    if (currentPhase === 1) {
      section = "event";
      nextErrors = getEventErrors();
    }

    if (currentPhase === 2) {
      section = "personal";
      nextErrors = getPersonalErrors();
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

    if (Object.keys(packageErrors).length > 0) {
      transitionToPhase(0);
      return false;
    }

    if (Object.keys(eventErrors).length > 0) {
      transitionToPhase(1);
      return false;
    }

    if (Object.keys(personalErrors).length > 0) {
      transitionToPhase(2);
      return false;
    }

    return true;
  };

  const goToNextPhase = () => {
    if (
      isSubmitting ||
      isPhaseTransitioning ||
      !validateCurrentPhase()
    ) {
      return;
    }

    transitionToPhase(
      currentPhase + 1,
    );
  };

  const goToPreviousPhase = () => {
    if (
      isSubmitting ||
      isPhaseTransitioning
    ) {
      return;
    }

    transitionToPhase(
      currentPhase - 1,
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

      transitionToPhase(0);
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
    <div
      ref={phaseTopRef}
      className="scroll-mt-24"
    >
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
        <div
          className={`grow transform-gpu transition-all duration-300 ease-out ${
            phaseVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0"
          }`}
        >
          {currentPhase === 0 && (
            <PackageOption
              selectedPackageId={formData.package.packageId}
              packageOptions={packageOptions}
              loading={packagesLoading}
              error={packagesError}
              errors={errors.package ?? {}}
              onChange={(packageId) =>
                updateFormSection("package", { packageId })
              }
            />
          )}

          {currentPhase === 1 && (
            <EventInfo
              data={formData.event}
              errors={errors.event ?? {}}
              selectedPackage={selectedPackage}
              onChange={(values) =>
                updateFormSection("event", values)
              }
            />
          )}

          {currentPhase === 2 && (
            <PersonalDetail
              data={formData.personal}
              errors={errors.personal ?? {}}
              showPartnerName={showPartnerName}
              vision={formData.event.vision ?? ""}
              onChange={(values) =>
                updateFormSection("personal", values)
              }
              onVisionChange={(vision) =>
                updateFormSection("event", { vision })
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
              disabled={
                isSubmitting ||
                isPhaseTransitioning
              }
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
              disabled={
                isSubmitting ||
                isPhaseTransitioning ||
                (currentPhase === 0 &&
                  packagesLoading)
              }
              className="rounded-lg bg-primary px-10 py-3 font-label-md text-label-md text-on-primary transition-all hover:bg-opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Next Step →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                isPhaseTransitioning ||
                submitStatus === "success"
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
    </div>
  );
}
