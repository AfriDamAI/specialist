'use client';

export const ROLE_LABELS: Record<string, string> = {
  SKINCARE_CONSULTANT: 'Skin Care Consultant',
  DERMATOLOGIST: 'Dermatologist',
  MEDICAL_OFFICER: 'Medical Officer',
  REGISTERED_NURSE: 'Registered Nurse',
  SPECIALIST: 'Specialist',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  CONSULTANT: 'Consultant',
};

export function mapSpecializationToLabel(value?: string | null): string {
  if (!value) return 'Specialist';
  const normalized = value
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  return ROLE_LABELS[normalized] || ROLE_LABELS[normalized.replace(/_/g, '')] || value.toString().trim();
}

export function dashboardTitleFromSpec(value?: string | null): string {
  const label = mapSpecializationToLabel(value);
  return label.endsWith('Dashboard') ? label : `${label} Dashboard`;
}
