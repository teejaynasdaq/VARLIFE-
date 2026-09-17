export const SA_INSTITUTIONS = [
  "University of Cape Town",
  "University of the Witwatersrand",
  "Stellenbosch University",
  "University of Pretoria",
  "University of Johannesburg",
  "Rhodes University",
  "University of KwaZulu-Natal",
  "North-West University",
  "University of the Free State",
  "Tshwane University of Technology",
  "Durban University of Technology",
  "Cape Peninsula University of Technology",
];

export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

export interface StudentVerificationSubmission {
  userId: string;
  institution: string;
  studentNumber?: string;
  studentEmail?: string;
  cardPhotoUrl: string;
  selfiePhotoUrl: string;
}
