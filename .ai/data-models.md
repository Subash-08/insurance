# InsureFlow Data Models (MongoDB)

## User
- `name` (String, required)
- `email` (String, unique, required)
- `passwordHash` (String, required)
- `role` (String: "admin" | "agent", default "agent")
- `agencyId` (ObjectId, optional)
- `profilePhoto` (String, URL)
- `irdaLicense` (String)
- `emailSignature` (String)
- `isActive` (Boolean, default true)
- `lastLogin` (Date)
- Timestamps

## Client
- `name` (String, required)
- `dateOfBirth` (Date)
- `gender` (String)
- `maritalStatus` (String)
- `occupation` (String)
- `annualIncome` (Number)
- `pan` (String)
- `aadhaar` (String)
- `bloodGroup` (String)
- `smoker` (Boolean)
- Contact: `mobile` (String), `email` (String), `address` (Object)
- `nominees` (Array of objects: name, relation, share)
- `medicalHistory` (Object)
- `documents` (Array of objects: title, url, type)
- `tags` (Array of strings)
- `notes` (Array of strings)
- `agentId` (ObjectId, ref User)
- Timestamps

## Policy
- `policyNumber` (String, unique)
- `clientId` (ObjectId, ref Client)
- `agentId` (ObjectId, ref User)
- `insurer` (ObjectId, ref Insurer)
- `planName` (String)
- `type` (String: Life, Health, Vehicle, etc.)
- `sumAssured` (Number)
- `basePremium` (Number)
- `gstAmount` (Number)
- `totalPremium` (Number)
- `frequency` (String: Monthly, Quarterly, Yearly)
- `commissionRate` (Number)
- `startDate` (Date)
- `endDate` (Date)
- `nextDueDate` (Date)
- `gracePeriod` (Number)
- `status` (String: Active, Lapsed, Surrendered, Matured)
- `typeSpecificData` (Object)
- `documents` (Array)
- Timestamps

## Premium
- `policyId` (ObjectId, ref Policy)
- `clientId` (ObjectId, ref Client)
- `dueDate` (Date)
- `amount` (Number)
- `status` (String: Pending, Paid, Overdue)
- `paidDate` (Date)
- `paymentMode` (String)
- `receiptNumber` (String)
- `utrNumber` (String)
- `bankName` (String)
- `chequeNumber` (String)
- `notes` (String)
- `receiptPhoto` (String, URL)
- Timestamps

## Claim
- `claimNumber` (String)
- `policyId` (ObjectId, ref Policy)
- `clientId` (ObjectId, ref Client)
- `agentId` (ObjectId, ref User)
- `claimType` (String)
- `incidentDate` (Date)
- `description` (String)
- `estimatedAmount` (Number)
- `hospitalName` (String)
- `documents` (Array of {title, url, isVerified})
- `status` (String: Filed, Review, Approved, Settled, Rejected)
- `settlementDetails` (Object)
- `timeline` (Array of {status, date, note})
- Timestamps

## Lead
- `name` (String)
- `mobile` (String)
- `email` (String)
- `city` (String)
- `source` (String)
- `interest` (Array of Strings)
- `estimatedSA` (Number)
- `budget` (Number)
- `stage` (String: New, Contacted, Proposal, Won, Lost)
- `assignedTo` (ObjectId, ref User)
- `followUpDate` (Date)
- `followUpLog` (Array of logs)
- `priority` (String: High, Medium, Low)
- `convertedClientId` (ObjectId, ref Client)
- `lostReason` (String)
- Timestamps

## Reminder
- `clientId` (ObjectId, ref Client)
- `policyId` (ObjectId, ref Policy)
- `type` (String: Renewal, Birthday, Premium)
- `scheduledDate` (Date)
- `channel` (String: Email)
- `templateId` (ObjectId, ref EmailTemplate)
- `status` (String: Pending, Sent, Failed)
- `sentAt` (Date)
- `deliveryStatus` (String)
- `openedAt` (Date)
- `createdBy` (ObjectId, ref User)
- `isAuto` (Boolean)
- Timestamps

## EmailTemplate
- `name` (String)
- `type` (String)
- `subject` (String)
- `bodyHtml` (String)
- `variables` (Array of Strings)
- `lastEditedBy` (ObjectId, ref User)
- `isActive` (Boolean)
- Timestamps

## Insurer
- `name` (String)
- `logo` (String, URL)
- `claimHelpline` (String)
- `website` (String)
- `contactPerson` (String)
- `commissionRate` (Number)
- `isActive` (Boolean)
- `policiesCount` (Number)
- Timestamps

## AuditLog
- `userId` (ObjectId, ref User)
- `action` (String)
- `module` (String)
- `details` (String)
- `ipAddress` (String)
- `userAgent` (String)
- Timestamps
