/* =========================================================
	 LATE PAYMENT CONFIG
========================================================= */
export const LATE_PAYMENT_CONFIG = Object.freeze({
	AMOUNT_PER_DAY: 100_000,
	DAY_ROUNDING: "floor",
	DUE_TIME: "23:59:59.999",
	DUE_TIMEZONE_OFFSET: "+07:00",
});

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const PAYMENT_PENDING_STATUSES = new Set([
	"pending",
	"pending_verification",
]);

const PAYMENT_PAID_STATUSES = new Set([
	"verified",
	"paid",
]);

export function normalizeStatus(value) {
	return String(value ?? "")
		.trim()
		.toLowerCase();
}

export function toDate(value) {
	if (!value) return null;

	if (typeof value?.toDate === "function") {
		const date = value.toDate();
		return Number.isNaN(date.getTime()) ? null : date;
	}

	if (
		typeof value === "object" &&
		Number.isFinite(Number(value?._seconds))
	) {
		const date = new Date(Number(value._seconds) * 1000);
		return Number.isNaN(date.getTime()) ? null : date;
	}

	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function getTimestamp(value) {
	return toDate(value)?.getTime() ?? null;
}

export function getEventStartDate(event) {
	const preferredDate = event?.preferredDate;

	if (!preferredDate) return null;

	const startTime = String(event?.startTime || "").trim();
	const timeMatch = startTime.match(/^(\d{1,2}):(\d{2})$/);

	if (
		typeof preferredDate === "string" &&
		/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)
	) {
		const hour = timeMatch
			? String(Number(timeMatch[1])).padStart(2, "0")
			: "00";
		const minute = timeMatch ? timeMatch[2] : "00";

		return toDate(
			`${preferredDate}T${hour}:${minute}:00.000${LATE_PAYMENT_CONFIG.DUE_TIMEZONE_OFFSET}`,
		);
	}

	const date = toDate(preferredDate);

	if (!date) return null;

	if (timeMatch) {
		date.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
	}

	return date;
}

export function getPaymentDeadline(dueAt) {
	if (!dueAt) return null;

	if (
		typeof dueAt === "string" &&
		/^\d{4}-\d{2}-\d{2}$/.test(dueAt)
	) {
		return toDate(
			`${dueAt}T${LATE_PAYMENT_CONFIG.DUE_TIME}${LATE_PAYMENT_CONFIG.DUE_TIMEZONE_OFFSET}`,
		);
	}

	return toDate(dueAt);
}

export function getDurationParts(milliseconds) {
	const safeValue = Math.max(
		0,
		Math.floor(Number(milliseconds) || 0),
	);

	return {
		days: Math.floor(safeValue / DAY),
		hours: Math.floor((safeValue % DAY) / HOUR),
		minutes: Math.floor((safeValue % HOUR) / MINUTE),
		seconds: Math.floor((safeValue % MINUTE) / SECOND),
	};
}

function getInvoicePayments({ invoice, payments }) {
	if (!invoice?.id) return [];

	return payments
		.filter((payment) => payment?.invoiceId === invoice.id)
		.sort(
			(first, second) =>
				(getTimestamp(first?.submittedAt ?? first?.createdAt) || 0) -
				(getTimestamp(second?.submittedAt ?? second?.createdAt) || 0),
		);
}

function getRejectedReviewPauseMs(invoicePayments) {
	return invoicePayments.reduce((total, payment) => {
		if (
			normalizeStatus(
				payment?.status ?? payment?.verificationStatus,
			) !== "rejected"
		) {
			return total;
		}

		const submittedAt = getTimestamp(
			payment?.submittedAt ?? payment?.createdAt,
		);
		const rejectedAt = getTimestamp(
			payment?.rejectedAt ?? payment?.reviewedAt ?? payment?.updatedAt,
		);

		if (!submittedAt || !rejectedAt || rejectedAt <= submittedAt) {
			return total;
		}

		return total + (rejectedAt - submittedAt);
	}, 0);
}

export function getPenaltyDays(overdueMs) {
	const safeMs = Math.max(0, Number(overdueMs) || 0);

	if (LATE_PAYMENT_CONFIG.DAY_ROUNDING === "ceil") {
		return safeMs > 0 ? Math.ceil(safeMs / DAY) : 0;
	}

	return Math.floor(safeMs / DAY);
}

export function getSuggestedPenalty(overdueMs) {
	const days = getPenaltyDays(overdueMs);
	return { days, amount: days * LATE_PAYMENT_CONFIG.AMOUNT_PER_DAY };
}

export function getInvoicePenaltyAmount(invoice) {
	return Math.max(
		Number(invoice?.penalty?.appliedAmount ?? invoice?.penaltyAmount) || 0,
		0,
	);
}

export function getInvoicePrincipalAmount(invoice) {
	const penaltyAmount = getInvoicePenaltyAmount(invoice);
	const explicitPrincipal = Number(
		invoice?.principalAmount ?? invoice?.baseAmount,
	);

	if (Number.isFinite(explicitPrincipal) && explicitPrincipal >= 0) {
		return explicitPrincipal;
	}

	return Math.max(0, (Number(invoice?.amount) || 0) - penaltyAmount);
}

export function buildPaymentTimer({
	invoice,
	payments = [],
	nowMs,
}) {
	if (!invoice?.id || !nowMs) return null;

	const invoiceType = normalizeStatus(invoice?.type || "deposit");

	if (invoiceType === "final") return null;

	const invoiceStatus = normalizeStatus(invoice?.status);

	if (["paid", "void", "superseded"].includes(invoiceStatus)) {
		return null;
	}

	const deadline = getPaymentDeadline(invoice?.dueAt);
	if (!deadline) return null;

	const invoicePayments = getInvoicePayments({ invoice, payments });
	const hasPaidPayment = invoicePayments.some((payment) =>
		PAYMENT_PAID_STATUSES.has(
			normalizeStatus(payment?.status ?? payment?.verificationStatus),
		),
	);

	if (hasPaidPayment) return null;

	const pendingPayment =
		[...invoicePayments]
			.reverse()
			.find((payment) =>
				PAYMENT_PENDING_STATUSES.has(
					normalizeStatus(payment?.status ?? payment?.verificationStatus),
				),
			) ?? null;

	const carriedReviewPauseMs = Math.max(
		Number(invoice?.penalty?.carriedReviewPauseMs) || 0,
		0,
	);
	const currentRejectedReviewPauseMs = getRejectedReviewPauseMs(
		invoicePayments,
	);
	const totalReviewPauseMs =
		carriedReviewPauseMs + currentRejectedReviewPauseMs;
	const effectiveDeadlineMs = deadline.getTime() + totalReviewPauseMs;
	const pendingSubmittedAtMs = pendingPayment
		? getTimestamp(pendingPayment?.submittedAt ?? pendingPayment?.createdAt)
		: null;
	const referenceNowMs = pendingSubmittedAtMs ?? nowMs;
	const delta = referenceNowMs - effectiveDeadlineMs;
	const overdue = delta > 0;
	const overdueMs = Math.max(delta, 0);
	const duration = getDurationParts(Math.abs(delta));
	const rejectedCount = invoicePayments.filter(
		(payment) =>
			normalizeStatus(payment?.status ?? payment?.verificationStatus) ===
			"rejected",
	).length;
	const suggestedPenalty = getSuggestedPenalty(overdueMs);
	const appliedPenaltyAmount = getInvoicePenaltyAmount(invoice);

	return {
		deadline,
		effectiveDeadline: new Date(effectiveDeadlineMs),
		effectiveDeadlineMs,
		duration,
		overdue,
		overdueMs,
		frozen: Boolean(pendingSubmittedAtMs),
		paymentLabel: "DP",
		rejectedCount,
		carriedReviewPauseMs,
		currentRejectedReviewPauseMs,
		totalReviewPauseMs,
		pendingPayment,
		penaltyDays: suggestedPenalty.days,
		suggestedPenaltyAmount: suggestedPenalty.amount,
		appliedPenaltyAmount,
		additionalPenaltyAmount: Math.max(
			0,
			suggestedPenalty.amount - appliedPenaltyAmount,
		),
	};
}