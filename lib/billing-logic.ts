export type SpecialistRole = 'Dermatologist' | 'MedicalOfficer' | 'Nurse' | 'Consultant';
export type PlanTier = 'Instant' | 'Starter' | 'Standard' | 'Premium' | 'VIP';

interface PayoutRule {
  initial: number;
  followUp: number;
}

export const PAYOUT_MATRIX: Record<PlanTier, Record<SpecialistRole, PayoutRule>> = {
  Instant: {
    Consultant: { initial: 800, followUp: 0 },
    Nurse: { initial: 1000, followUp: 0 },
    MedicalOfficer: { initial: 1500, followUp: 0 },
    Dermatologist: { initial: 35000, followUp: 10000 }, // 70% of 50k
  },
  Starter: {
    Consultant: { initial: 800, followUp: 0 },
    Nurse: { initial: 1000, followUp: 0 },
    MedicalOfficer: { initial: 1500, followUp: 0 },
    Dermatologist: { initial: 0, followUp: 0 }, // Not available
  },
  Standard: {
    Consultant: { initial: 1200, followUp: 500 },
    Nurse: { initial: 2000, followUp: 800 },
    MedicalOfficer: { initial: 2500, followUp: 1000 },
    Dermatologist: { initial: 0, followUp: 0 }, // Not available
  },
  Premium: {
    Consultant: { initial: 2000, followUp: 1000 },
    Nurse: { initial: 3000, followUp: 1000 },
    MedicalOfficer: { initial: 4000, followUp: 1000 },
    Dermatologist: { initial: 0, followUp: 0 }, // Not available
  },
  VIP: {
    Consultant: { initial: 0, followUp: 0 },
    Nurse: { initial: 3000, followUp: 1000 },
    MedicalOfficer: { initial: 4000, followUp: 1000 },
    Dermatologist: { initial: 20000, followUp: 10000 },
  }
};