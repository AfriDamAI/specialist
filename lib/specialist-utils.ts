export function normalizeSpecialization(input?: string | null): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/[_\s]+/g, ' ')
    .toUpperCase();
}

const SPECIALIST_TYPE_BY_ROLE: Record<string, string> = {
  'REGISTERED NURSE': 'REGISTERED_NURSE',
  RN: 'REGISTERED_NURSE',
  'MEDICAL OFFICER': 'MEDICAL_OFFICER',
  MEDICALOFFICER: 'MEDICAL_OFFICER',
  'SKIN CARE CONSULTANT': 'SKINCARE_CONSULTANT',
  'SKINCARE CONSULTANT': 'SKINCARE_CONSULTANT',
  CONSULTANT: 'SKINCARE_CONSULTANT',
  DERMATOLOGIST: 'DERMATOLOGIST',
  DERMATOLOGY: 'DERMATOLOGIST',
};

export function normalizeSpecialistType(input?: string | null): string {
  const key = normalizeSpecialization(input);
  if (!key) return '';
//   return SPECIALIST_TYPE_BY_ROLE[key] || key.retype SpecialistTypeResolutionInput = {
//   backendType?: string | null;
//   cachedType?: string | null;
//   registeredType?: string | null;
//   registeredEmail?: string | null;
//   profileEmail?: string | null;
//   fallbackRole?: string | null;
//   context?: string;
// };

 function resolveSpecialistType({
  backendType,
  cachedType,
  registeredType,
  registeredEmail,
  profileEmail,
  fallbackRole,
  context = 'Specialist type sync',
}: {
  backendType?: string | null;
  cachedType?: string | null;
  registeredType?: string | null;
  registeredEmail?: string | null;
  profileEmail?: string | null;
  fallbackRole?: string | null;
  context?: string;
}): string {
  const backend = normalizeSpecialistType(backendType);
  const cached = normalizeSpecialistType(cachedType);
  const registered = normalizeSpecialistType(registeredType);
  const fallback = normalizeSpecialistType(fallbackRole);
  const normalizedRegisteredEmail = registeredEmail?.trim().toLowerCase();
  const normalizedProfileEmail = profileEmail?.trim().toLowerCase();
  const registrationMatchesProfile = Boolean(
    registered &&
    normalizedRegisteredEmail &&
    normalizedProfileEmail &&
    normalizedRegisteredEmail === normalizedProfileEmail,
  );

  if (registrationMatchesProfile && backend && backend !== registered) {
    console.warn(`${context}: backend type mismatch`, {
      backendType: backend,
      registeredType: registered,
      email: normalizedProfileEmail,
    });
    return registered;
  }

  return backend || cached || registered || fallback || '';
}

// type SpecialistTypeResoort function getSpecialistDisplayRole(input?: string | null): string {
  // const key = normalizeSpecialization(input);

  switch (key) {
    case 'REGISTERED NURSE':
    case 'REGISTERED_NURSE':
    case 'RN':
      return 'Registered Nurse';

    case 'MEDICAL OFFICER':
    case 'MEDICAL_OFFICER':
    case 'MEDICALOFFICER':
      return 'Medical Officer';

    case 'SKIN CARE CONSULTANT':
    case 'SKINCARE CONSULTANT':
    case 'SKINCARE_CONSULTANT':
    case 'CONSULTANT':
      return 'Skincare Consultant';

    case 'DERMATOLOGIST':
    case 'DERMATOLOGY':
      return 'Dermatologist';

    case 'NURSE':
      return 'Nurse';

    case 'SPECIALIST':
      return 'Specialist';

    default:
      if (!key) return 'Specialist';
      return key
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }
}

// export function getSpecialistDashboardTitle(input?: string | null): string {
//   const displayRole = getSpecialistDisplayRole(input);
//   return `${displayRole} Dashboard`;
// }
