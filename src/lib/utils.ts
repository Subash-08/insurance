import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatCurrency(amount: number): string { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount); }
export function formatDate(date: Date | string): string { return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(date)); }
export function maskPAN(pan: string): string { return pan.replace(/^(.{3})(.{2})(.{4})(.{1})$/, "$1XX$3$4"); }
export function maskAadhaar(aadhaar: string): string { return "XXXX XXXX " + aadhaar.slice(-4); }
export function calculateNextDueDate(lastPaidDate: Date, frequency: string): Date { const d = new Date(lastPaidDate); if(frequency==="Monthly") d.setMonth(d.getMonth() + 1); if(frequency==="Yearly") d.setFullYear(d.getFullYear() + 1); return d; }
