// The exact data from the reference design (WhatsApp mockup), used by the "Sample layout" pages.
import type { InvoiceData } from "@/components/docs/InvoiceDoc";
import type { RxData } from "@/components/docs/RxDoc";
import type { Patient } from "./data";

export const samplePatient: Patient = {
  mr: "B-00128",
  name: "Ali Khan",
  phone: "03xx 1234567",
  age: 32,
  gender: "Male",
  address: "Bahria Town, Islamabad",
  branch: "Bahria",
  first_visit: "2024-10-15",
};

export const sampleInvoice: InvoiceData = {
  invoice_no: "B-2024-1015-0128",
  date: "2024-10-15",
  total_charges: 17500,
  discount: 2500,
  net: 15000,
  paid_cash: 10000,
  paid_card: 0,
  payment_method: "Cash",
  remarks: "RCT completed. Patient to return for crown.",
  items: [
    { procedure: "Consultation", tooth: "", qty: 1, rate: 1000, amount: 1000 },
    { procedure: "Root Canal Treatment (RCT)", tooth: "#46", qty: 1, rate: 15000, amount: 15000 },
    { procedure: "Temporary Filling", tooth: "#46", qty: 1, rate: 1500, amount: 1500 },
    { procedure: "Prescription", tooth: "", qty: 1, rate: 0, amount: 0 },
  ],
};

export const sampleRx: RxData = {
  date: "2024-10-15",
  diagnosis: "Mild sensitivity in lower right molar. RCT completed. Advised crown.",
  treatment_done: "Root Canal Treatment – #46 (Completed)\nTemporary Filling",
  advice:
    "Take medicines as prescribed.\nAvoid very hot or cold food.\nMaintain good oral hygiene.\nFollow up after 1 week or if pain persists.",
  items: [
    { medicine: "Tab. Ibuprofen 400 mg", dose: "1 tablet", instructions: "After meals, if needed for pain", days: "3 days" },
    { medicine: "Tab. Amoxicillin 500 mg", dose: "1 capsule", instructions: "Twice daily after meals", days: "5 days" },
    { medicine: "Tab. Metronidazole 400 mg", dose: "1 tablet", instructions: "Twice daily after meals", days: "5 days" },
    { medicine: "Mouthwash (Chlorhexidine 0.12%)", dose: "10 ml", instructions: "Rinse twice daily", days: "7 days" },
  ],
};
