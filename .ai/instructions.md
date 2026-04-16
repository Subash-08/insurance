---
# InsureFlow — AI Working Instructions

## How To Work On This Codebase

### Starting a New Feature
1. Read .ai/context.md to understand the domain
2. Read .ai/constraints.md to know what NOT to do
3. Check src/types/index.ts for existing interfaces before creating new ones
4. Check src/models/ for existing Mongoose schemas before adding fields
5. Check src/components/shared/ for reusable components before creating new ones
6. Check docs/api-contracts.md for the expected API shape before building routes
7. Then implement, following the patterns in .ai/skills.md

### When Adding a New Module (e.g. new page + API)
Order of operations:
1. Add TypeScript interface to src/types/index.ts
2. Create/update Mongoose model in src/models/
3. Add Zod validation schema to src/lib/validations.ts
4. Create API route in src/app/api/[module]/route.ts
5. Create page component in src/app/(dashboard)/[module]/page.tsx
6. Create loading.tsx and error.tsx alongside the page
7. Add navigation link to src/components/layout/Sidebar.tsx
8. Update docs/api-contracts.md

### When Fixing a Bug
1. Reproduce the issue first — describe what you're seeing vs expected
2. Check src/lib/utils.ts for date/currency formatting bugs first (common source)
3. Check Zod schema if validation is failing unexpectedly
4. Check MongoDB query — add .lean() if you're getting Mongoose document methods on the result
5. Check role-based filter if data is not showing (agentId filter on API query)
6. Add the fix, then add a comment explaining what was wrong

### Code Review Checklist (before considering any task done)
- [ ] TypeScript: no `any`, all functions have return types, interfaces defined
- [ ] Security: session verified, role checked, input validated with Zod
- [ ] Error handling: try/catch on all async ops, user-facing errors use Sonner toast
- [ ] Loading state: loading.tsx or skeleton component shown while fetching
- [ ] Empty state: EmptyState component shown when list is empty
- [ ] Mobile: Agents use phones 50% of the time. Layouts MUST be audited at 375px. Sidebars collapse to hamburger, tables wrap/scroll horizontally (`overflow-x-auto`), forms stack vertically.
- [ ] Accessibility: form labels, ARIA attributes, keyboard navigation works
- [ ] Dates: formatted DD/MM/YYYY with formatDate()
- [ ] Currency: formatted ₹X,XX,XXX with formatCurrency()
- [ ] Audit log: AuditLog.create() called for any create/update/delete
- [ ] Data isolation: agentId filter applied on API query (unless admin)

### Common Patterns To Follow

#### API Route Pattern:
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  
  await dbConnect();
  
  try {
    const filter = session.user.role === "admin" ? {} : { agentId: session.user.id };
    const page = Number(req.nextUrl.searchParams.get("page") ?? 1);
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);
    const data = await Model.find(filter).skip((page - 1) * limit).limit(limit).lean();
    const total = await Model.countDocuments(filter);
    return NextResponse.json({ success: true, data, pagination: { page, limit, total } });
  } catch (error) {
    console.error("[MODULE_GET]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}
```

#### Server Component Data Fetch:
```typescript
// In page.tsx (Server Component)
import { getServerSession } from "next-auth";
async function getData(agentId: string) {
  await dbConnect();
  return Model.find({ agentId }).lean();
}
export default async function Page() {
  const session = await getServerSession(authOptions);
  const data = await getData(session!.user.id);
  return ;
}
```

#### Form Pattern (React Hook Form + Zod):
```typescript
const form = useForm>({
  resolver: zodResolver(clientSchema),
  defaultValues: { name: "", mobile: "", ... }
});
const onSubmit = async (values: z.infer) => {
  try {
    const res = await fetch("/api/clients", { method: "POST", body: JSON.stringify(values) });
    if (!res.ok) throw new Error("Failed");
    toast.success("Client added successfully");
    router.push("/clients");
  } catch {
    toast.error("Something went wrong. Please try again.");
  }
};
```

### Asking For Clarification
Ask before implementing if:
- A business rule involves financial calculation (commission, GST, premium schedule)
- A security decision could expose client PAN/Aadhaar data
- A feature touches the n8n automation workflow
- A schema change affects multiple models
- The user hasn't specified which policy type a feature applies to

### When User Says "Add XYZ Feature"
1. Confirm understanding: restate what you'll build in 2-3 sentences
2. List files you'll create or modify
3. Flag any constraints from .ai/constraints.md that apply
4. Implement in the correct order (types → model → API → component)
5. After completing, list what was created and any follow-up work needed
---
