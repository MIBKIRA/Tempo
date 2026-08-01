export interface PolicyConfig {
  version: string;
  effectiveDate: string;
}

export interface LegalVersions {
  termsOfService: PolicyConfig;
  privacyPolicy: PolicyConfig;
  cookiePolicy: PolicyConfig;
  acceptableUsePolicy: PolicyConfig;
  accountDeletionPolicy: PolicyConfig;
}

/**
 * Single source of truth for legal policy version tracking.
 * When a policy version is bumped here, active users will be prompted
 * to review and accept the updated terms upon logging in.
 */
export const LEGAL_VERSIONS: LegalVersions = {
  termsOfService: {
    version: '1.0.0',
    effectiveDate: '2026-08-01',
  },
  privacyPolicy: {
    version: '1.0.0',
    effectiveDate: '2026-08-01',
  },
  cookiePolicy: {
    version: '1.0.0',
    effectiveDate: '2026-08-01',
  },
  acceptableUsePolicy: {
    version: '1.0.0',
    effectiveDate: '2026-08-01',
  },
  accountDeletionPolicy: {
    version: '1.0.0',
    effectiveDate: '2026-08-01',
  },
};
