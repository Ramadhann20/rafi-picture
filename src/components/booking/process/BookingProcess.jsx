"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import PersonalDetail from "./phases/PersonalDetail";
import { useLanguage } from "@/context/LanguageContext";
import EventInfo from "./phases/EventInfo";
import PackageOption from "./phases/PackageOption";
import BookConfirm from "./phases/BookConfirm";
import {
  createEventLocation,
  isValidCoordinates,
  normalizeEventLocation,
} from "@/lib/location";

function normalizeInitialPackageId(value) {
  if (Array.isArray(value)) {
    return String(value[0] ?? "").trim();
  }

  return String(value ?? "").trim();
}

function normalizeInitialPackageIds(value) {
  const values = Array.isArray(value) ? value : [value];

  return Array.from(
    new Set(values.map((item) => String(item ?? "").trim()).filter(Boolean)),
  );
}

function createEventData() {
  return {
    eventDate: "",
    startTime: "",
    endTime: "",
    endTimeDayOffset: 0,
    location: createEventLocation(),
    vision: "",
  };
}

function getPackageSessions(packageItem) {
  if (Array.isArray(packageItem?.sessions) && packageItem.sessions.length > 0) {
    return packageItem.sessions.map((session, index) => ({
      id: String(session.id || `session-${index + 1}`),
      name: String(session.name || `Session ${index + 1}`),
      durationHours: Number(session.durationHours) || packageItem.durationHours || 0,
    }));
  }

  if (packageItem?.packageCategoryId === "bundle") {
    return [
      { id: "pre-wedding", name: "Pre-Wedding", durationHours: packageItem.durationHours },
      { id: "wedding", name: "Wedding", durationHours: packageItem.durationHours },
    ];
  }

  return [
    {
      id: "main",
      name: packageItem?.name || "Event",
      durationHours: Number(packageItem?.durationHours) || 0,
    },
  ];
}

function createEventEntries(packageItems, previousEvents = []) {
  return packageItems.flatMap((packageItem) =>
    getPackageSessions(packageItem).map((session) => {
      const key = `${packageItem.id}:${session.id}`;
      const previous = previousEvents.find(
        (eventItem) => `${eventItem.packageId}:${eventItem.sessionId}` === key,
      );

      return {
        packageId: packageItem.id,
        sessionId: session.id,
        sessionName: session.name,
        durationHours: session.durationHours,
        data: previous?.data ?? createEventData(),
      };
    }),
  );
}

function createInitialFormData(initialPackageId) {
  const packageIds = normalizeInitialPackageIds(initialPackageId);

  return {
    personal: {
      fullName: "",
      partnerName: "",
      email: "",
      phone: "",
      instagram: "",
      useMyData: false,
    },
    event: createEventData(),
    events: packageIds.map((packageId) => ({
      packageId,
      data: createEventData(),
    })),
    package: {
      packageId: packageIds[0] ?? "",
      packageIds,
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
  accountData = null,
  onSubmitBooking,
}) {
  const { translate } = useLanguage();
  const phases = [
    { id: "package", label: translate("stepPackages") },
    { id: "event", label: translate("stepEventInfo") },
    { id: "personal", label: translate("stepPersonalDetails") },
    { id: "confirm", label: translate("stepConfirm") },
  ];
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
    const nextPackageIds = normalizeInitialPackageIds(initialPackageId);
    const nextPackageId = nextPackageIds[0] ?? "";

    setFormData((previousData) => {
      if (
        previousData.package.packageId === nextPackageId &&
        previousData.package.packageIds?.join("|") === nextPackageIds.join("|")
      ) {
        return previousData;
      }

      return {
        ...previousData,
        package: {
          ...previousData.package,
          packageId: nextPackageId,
          packageIds: nextPackageIds,
        },
        events: nextPackageIds.map((packageId) => ({
          packageId,
          data:
            previousData.events?.find((item) => item.packageId === packageId)?.data ??
            createEventData(),
        })),
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

  const selectedPackageIds = formData.package.packageIds ??
    (formData.package.packageId ? [formData.package.packageId] : []);

  const selectedPackages = selectedPackageIds
    .map((packageId) => packageOptions.find((item) => item.id === packageId))
    .filter(Boolean);

  const selectedPackage = selectedPackages[0] ?? null;
  const selectedPackageKey = selectedPackageIds.join("|");

  useEffect(() => {
    setFormData((previousData) => {
      const nextEvents = createEventEntries(selectedPackages, previousData.events);
      const previousKey = previousData.events
        .map((eventItem) => `${eventItem.packageId}:${eventItem.sessionId}`)
        .join("|");
      const nextKey = nextEvents
        .map((eventItem) => `${eventItem.packageId}:${eventItem.sessionId}`)
        .join("|");

      if (previousKey === nextKey) return previousData;

      return {
        ...previousData,
        events: nextEvents,
        event: nextEvents[0]?.data ?? createEventData(),
      };
    });
  }, [selectedPackageKey, packageOptions]);

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
      nextErrors.fullName = translate("fullNameRequired");
    } else if (fullName.length < 2) {
      nextErrors.fullName =
        translate("fullNameMinLength");
    }

    if (!email) {
      nextErrors.email = translate("emailRequired");
    } else if (!emailPattern.test(email)) {
      nextErrors.email = translate("validEmail");
    }

    if (!phone) {
      nextErrors.phone = translate("phoneRequired");
    } else if (!phonePattern.test(phone)) {
      nextErrors.phone = translate("validPhone");
    }

    return nextErrors;
  };

  const getEventErrors = (eventData = formData.event) => {
    const nextErrors = {};
    const today = getLocalToday();

    if (!eventData.eventDate) {
      nextErrors.eventDate = translate("eventDateRequired");
    } else if (eventData.eventDate < today) {
      nextErrors.eventDate =
        translate("eventDatePast");
    }

    if (
      eventData.eventDate &&
      !eventData.startTime
    ) {
      nextErrors.startTime =
        translate("startTimeRequired");
    }

    const eventLocation = normalizeEventLocation(
      eventData.location,
    );

    if (!eventLocation.venueName.trim()) {
      nextErrors.location =
        translate("venueRequired");
    } else if (
      !isValidCoordinates(eventLocation.coordinates)
    ) {
      nextErrors.location =
        translate("mapLocationRequired");
    }

    return nextErrors;
  };

  const getPackageErrors = () => {
    const nextErrors = {};

    if (selectedPackageIds.length === 0) {
      nextErrors.packageId = translate("packageRequired");
    } else if (selectedPackages.length !== selectedPackageIds.length) {
      nextErrors.packageId =
        translate("packageUnavailableError");
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
      nextErrors = Object.fromEntries(
        formData.events.map((eventItem, index) => {
          const eventErrors = getEventErrors(eventItem.data);
          return [String(index), eventErrors];
        }),
      );
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

    if (section === "event") {
      return !Object.values(nextErrors).some(
        (eventErrors) => Object.keys(eventErrors).length > 0,
      );
    }

    return Object.keys(nextErrors).length === 0;
  };

  const validateEntireForm = () => {
    const personalErrors = getPersonalErrors();
    const eventErrors = Object.fromEntries(
      formData.events.map((eventItem, index) => [
        String(index),
        getEventErrors(eventItem.data),
      ]),
    );
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

    if (
      Object.values(eventErrors).some(
        (errorsForEvent) => Object.keys(errorsForEvent).length > 0,
      )
    ) {
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

  const handlePackageSelection = (packageIds) => {
    const normalizedIds = normalizeInitialPackageIds(packageIds);

    setFormData((previousData) => {
      const packagesForSelection = normalizedIds
        .map((packageId) => packageOptions.find((item) => item.id === packageId))
        .filter(Boolean);
      const events = createEventEntries(packagesForSelection, previousData.events);

      return {
        ...previousData,
        package: {
          ...previousData.package,
          packageId: normalizedIds[0] ?? "",
          packageIds: normalizedIds,
        },
        events,
        event: events[0]?.data ?? createEventData(),
      };
    });

    setErrors((previousErrors) => ({
      ...previousErrors,
      package: {},
      event: {},
    }));
  };

  const updateEventData = (index, values) => {
    setFormData((previousData) => {
      const events = previousData.events.map((eventItem, eventIndex) =>
        eventIndex === index
          ? {
              ...eventItem,
              data: { ...eventItem.data, ...values },
            }
          : eventItem,
      );

      return {
        ...previousData,
        events,
        event: events[0]?.data ?? previousData.event,
      };
    });
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
      selectedPackages,
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
              selectedPackageIds={selectedPackageIds}
              packageOptions={packageOptions}
              loading={packagesLoading}
              error={packagesError}
              errors={errors.package ?? {}}
              onChange={handlePackageSelection}
            />
          )}

          {currentPhase === 1 && (
            <div className="space-y-stack-lg">
              {formData.events.map((eventItem, index) => {
                const packageItem = selectedPackages.find(
                  (item) => item.id === eventItem.packageId,
                );

                if (!packageItem) return null;

                return (
                <EventInfo
                  key={`${eventItem.packageId}:${eventItem.sessionId}`}
                  data={eventItem.data}
                  errors={errors.event?.[String(index)] ?? {}}
                  selectedPackage={packageItem}
                  sessionName={eventItem.sessionName}
                  sessionIndex={index}
                  packageIndex={index}
                  onChange={(values) => updateEventData(index, values)}
                />
                );
              })}
            </div>
          )}

          {currentPhase === 2 && (
            <PersonalDetail
              data={formData.personal}
              accountData={accountData}
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
                selectedPackages={selectedPackages}
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
              ← {translate("previousStep")}
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
              {translate("next")} →
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
