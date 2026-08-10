export function getTermsSessionKey(uid) {
  return `rafi-picture:terms-session:${uid}`;
}

export function hasAcceptedTermsThisSession(uid) {
  if (typeof window === "undefined" || !uid) {
    return false;
  }

  return (
    window.sessionStorage.getItem(
      getTermsSessionKey(uid)
    ) === "accepted"
  );
}

export function markTermsAcceptedThisSession(uid) {
  if (typeof window === "undefined" || !uid) {
    return;
  }

  window.sessionStorage.setItem(
    getTermsSessionKey(uid),
    "accepted"
  );
}

export function clearTermsSession(uid) {
  if (typeof window === "undefined" || !uid) {
    return;
  }

  window.sessionStorage.removeItem(
    getTermsSessionKey(uid)
  );
}
