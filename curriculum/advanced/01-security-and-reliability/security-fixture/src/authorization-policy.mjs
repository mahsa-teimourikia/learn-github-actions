export function authorize(request) {
  const untrusted = request.event === "pull_request" && request.fork === true;

  if (untrusted && request.write) return { allow: false, reason: "untrusted-write" };
  if (untrusted && request.secrets) return { allow: false, reason: "untrusted-secret" };
  if (untrusted && request.runner === "self-hosted") return { allow: false, reason: "untrusted-self-hosted" };

  if (request.environment === "production") {
    if (!request.protectedEnvironment) return { allow: false, reason: "unprotected-production" };
    if (request.refType !== "tag") return { allow: false, reason: "untrusted-release-ref" };
    if (!request.artifactVerified) return { allow: false, reason: "unverified-artifact" };
    if (request.oidc && request.audience !== request.expectedAudience) {
      return { allow: false, reason: "oidc-audience-mismatch" };
    }
    return { allow: true, reason: "protected-release" };
  }

  return { allow: true, reason: "bounded-validation" };
}
