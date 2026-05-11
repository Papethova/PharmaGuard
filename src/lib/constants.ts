import { Schedule } from "../types";

export const MASTER_ADMIN_EMAIL = "allen32@gmail.com";
export const APP_VERSION = "v1.2.6-PHARMA-GUARD-SYNC";

export const SCHEDULES: Schedule[] = ['C-II', 'C-III', 'C-IV', 'C-V'];

export const TRANSACTION_REASONS = [
  "Prescription Filling",
  "Wholesaler Receipt",
  "Inventory Adjustment",
  "Expired/Damaged Disposal",
  "Transfer to Other Pharmacy",
  "Return to Stock",
];
