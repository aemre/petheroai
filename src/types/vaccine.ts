export interface VaccineRecord {
  id: string;
  userId: string;
  petName: string;
  vaccineName: string;
  vaccineType: VaccineType;
  administeredDate: string; // ISO date string
  nextDueDate?: string | null; // ISO date string
  veterinarianName: string;
  clinicName: string;
  batchNumber?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum VaccineType {
  RABIES = "rabies",
  DHPP = "dhpp", // Distemper, Hepatitis, Parvovirus, Parainfluenza
  BORDETELLA = "bordetella",
  LYME = "lyme",
  FVRCP = "fvrcp", // Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia
  FeLV = "felv", // Feline Leukemia
  FIV = "fiv", // Feline Immunodeficiency Virus
  OTHER = "other",
}

export const VACCINE_LABELS: Record<VaccineType, string> = {
  [VaccineType.RABIES]: "Rabies",
  [VaccineType.DHPP]: "DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)",
  [VaccineType.BORDETELLA]: "Bordetella (Kennel Cough)",
  [VaccineType.LYME]: "Lyme Disease",
  [VaccineType.FVRCP]: "FVRCP (Feline Upper Respiratory)",
  [VaccineType.FeLV]: "FeLV (Feline Leukemia)",
  [VaccineType.FIV]: "FIV (Feline Immunodeficiency)",
  [VaccineType.OTHER]: "Other",
};

export const DOG_VACCINES: VaccineType[] = [
  VaccineType.RABIES,
  VaccineType.DHPP,
  VaccineType.BORDETELLA,
  VaccineType.LYME,
  VaccineType.OTHER,
];

export const CAT_VACCINES: VaccineType[] = [
  VaccineType.RABIES,
  VaccineType.FVRCP,
  VaccineType.FeLV,
  VaccineType.FIV,
  VaccineType.OTHER,
];

export interface VaccineFormData {
  petName: string;
  vaccineName: string;
  vaccineType: VaccineType;
  administeredDate: Date;
  nextDueDate?: Date;
  veterinarianName: string;
  clinicName: string;
  batchNumber?: string;
  notes?: string;
}
