export function normalizeSpecialization(input?: string | null): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/[_\s]+/g, ' ')
    .toUpperCase();
}

export function getSpecialistDisplayRole(input?: string | null): string {
  const key = normalizeSpecialization(input);

  switch (key) {
    case 'REGISTERED NURSE':
    case 'REGISTERED_NURSE':
    case 'RN':
      return 'Registered Nurse';
    case 'DERMATOLOGIST':
    case 'DERMATOLOGY':
      return 'Dermatologist';
    case 'MEDICAL OFFICER':
    case 'MEDICAL_OFFICER':
    case 'MEDICALOFFICER':
      return 'Medical Officer';
    case 'CONSULTANT':
      return 'Consultant';
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

export function getSpecialistDashboardTitle(input?: string | null): string {
  const displayRole = getSpecialistDisplayRole(input);
  return `${displayRole} Dashboard`;
}
