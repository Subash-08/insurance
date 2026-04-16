---
# InsureFlow — Skills & Code Recipes

## Skill: Currency Formatting (Indian System)
```typescript
// Always use this — never format currency manually
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
// Result: ₹4,82,500 (Indian numbering: lakhs, crores)
```

## Skill: Date Formatting (Indian Format)
```typescript
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    timeZone: "Asia/Kolkata"
  }).format(new Date(date));
}
// Result: 15/06/2025
```

## Skill: PAN Masking
```typescript
export function maskPAN(pan: string): string {
  return pan.replace(/^(.{3})(.{2})(.{4})(.{1})$/, "$1XX$3$4");
}
// ABCDE1234F → ABCXX1234F
```

## Skill: Aadhaar Masking
```typescript
export function maskAadhaar(aadhaar: string): string {
  return "XXXX XXXX " + aadhaar.slice(-4);
}
// 123456781234 → XXXX XXXX 1234
```

## Skill: Next Premium Due Date Calculation
```typescript
export function calculateNextDueDate(lastPaidDate: Date, frequency: string): Date {
  const d = new Date(lastPaidDate);
  switch (frequency) {
    case "Monthly": d.setMonth(d.getMonth() + 1); break;
    case "Quarterly": d.setMonth(d.getMonth() + 3); break;
    case "Half-Yearly": d.setMonth(d.getMonth() + 6); break;
    case "Yearly": d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}
```

## Skill: BMI Calculation with Status
```typescript
export function calculateBMI(heightCm: number, weightKg: number) {
  const bmi = weightKg / ((heightCm / 100) ** 2);
  const rounded = Math.round(bmi * 10) / 10;
  const status = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  const color = bmi < 25 ? "text-green-600" : bmi < 30 ? "text-amber-600" : "text-red-600";
  return { bmi: rounded, status, color };
}
```

## Skill: Commission Calculation
```typescript
export function calculateCommission(totalPremium: number, commissionRate: number): number {
  return Math.round((totalPremium * commissionRate) / 100);
}
```

## Skill: ImageUpload Component Usage
```tsx
// In any form that needs image/document upload:
import ImageUpload from "@/components/shared/ImageUpload";

 setValue("profilePhoto", url)}
  shape="circle"           // or "square"
  maxSizeMB={5}
  acceptedTypes={["image/jpeg", "image/png"]}
  label="Profile Photo"
/>

// For document uploads (KYC, claim bills, receipts):
 setValue("aadharFront", url)}
  shape="square"
  maxSizeMB={5}
  acceptedTypes={["image/jpeg", "image/png", "application/pdf"]}
  label="Aadhaar Card (Front)"
  showFilename={true}
/>
```

## Skill: Multi-step Form
```tsx
const [step, setStep] = useState(1);
const totalSteps = 5;
// Step indicator component:


  {Array.from({length: totalSteps}).map((_, i) => (
    

  ))}


// Navigation:
const next = async () => {
  const valid = await trigger(fieldNamesForCurrentStep[step]);
  if (valid) setStep(s => s + 1);
};
```

## Skill: Status Badge Component
```tsx
const statusConfig = {
  Active: { label: "Active", className: "bg-green-100 text-green-800" },
  Lapsed: { label: "Lapsed", className: "bg-red-100 text-red-800" },
  "Expiring Soon": { label: "Expiring Soon", className: "bg-amber-100 text-amber-800" },
  Matured: { label: "Matured", className: "bg-blue-100 text-blue-800" },
  Surrendered: { label: "Surrendered", className: "bg-gray-100 text-gray-700" },
};
export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, className: "bg-gray-100 text-gray-700" };
  return {config.label};
}
```

## Skill: Audit Log Entry
```typescript
// Call this in every API route that creates/updates/deletes:
import AuditLog from "@/models/AuditLog";
await AuditLog.create({
  userId: session.user.id,
  action: "Created",         // Created | Updated | Deleted | StatusChanged
  module: "Policy",
  details: `New policy ${policyNumber} created for client ${clientId}`,
  ipAddress: req.headers.get("x-forwarded-for") ?? "unknown",
  userAgent: req.headers.get("user-agent") ?? "unknown",
});
```

## Skill: Cloudinary Upload (Server-side API route)
```typescript
import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Upload from base64 or URL:
const result = await cloudinary.uploader.upload(base64String, {
  folder: "insureflow/kyc-documents",
  resource_type: "auto",      // handles both images and PDFs
  allowed_formats: ["jpg", "jpeg", "png", "pdf", "webp"],
  transformation: [{ quality: "auto", fetch_format: "auto" }],
});
return result.secure_url;
```

## Skill: n8n Webhook Helper
```typescript
// src/lib/n8n.ts
export async function notifyN8n(event: string, payload: object) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.N8N_WEBHOOK_SECRET}`,
    },
    body: JSON.stringify({ event, ...payload }),
  });
}
// Usage: await notifyN8n("premium.paid", { clientId, policyId, amount });
```

## Skill: MongoDB Aggregation for Dashboard
```typescript
// Premium collection by month (for dashboard chart)
const monthlyData = await Premium.aggregate([
  { $match: { status: "Paid", paidDate: { $gte: twelveMonthsAgo } } },
  { $group: {
    _id: { year: { $year: "$paidDate" }, month: { $month: "$paidDate" } },
    total: { $sum: "$amount" },
    count: { $sum: 1 }
  }},
  { $sort: { "_id.year": 1, "_id.month": 1 } }
]);
```

## Skill: EmptyState Usage
```tsx
import EmptyState from "@/components/shared/EmptyState";
// When no data:
if (clients.length === 0) return (
  
);
```

## Skill: Zod Schema with Indian Validations
```typescript
export const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit Indian mobile number"),
  email: z.string().email("Enter valid email").optional().or(z.literal("")),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Enter valid PAN (e.g. ABCDE1234F)").optional(),
  aadhaar: z.string().regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits").optional(),
  pincode: z.string().regex(/^\d{6}$/, "Enter valid 6-digit pincode"),
  annualIncome: z.number().min(0).optional(),
  dateOfBirth: z.string().refine(val => {
    const age = Math.floor((Date.now() - new Date(val).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age >= 0 && age <= 100;
  }, "Enter valid date of birth"),
});
```
---
