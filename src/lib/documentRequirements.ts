export type PolicyType = 'health' | 'motor' | 'term' | 'ulip' | 'endowment' | 'general';

export const DOCUMENT_REQUIREMENTS: Record<PolicyType, string[]> = {
  health: ["identity", "address", "medical"],
  motor: ["identity", "rc_book", "previous_policy"],
  term: ["identity", "medical", "income_proof"],
  ulip: ["identity", "address", "income_proof"],
  endowment: ["identity", "address"],
  general: ["identity", "address"]
};

export function getMissingDocuments(policyType: PolicyType, currentTypes: string[]): string[] {
  const reqs = DOCUMENT_REQUIREMENTS[policyType] || [];
  return reqs.filter(req => !currentTypes.includes(req));
}

export function isDocumentComplete(policyType: PolicyType, currentTypes: string[]): boolean {
  return getMissingDocuments(policyType, currentTypes).length === 0;
}
