const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getHeaders() {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  getNonce: (data: { walletAddress: string }) => request<any>("/api/auth/nonce", { method: "POST", body: JSON.stringify(data) }),
  login: (data: any) => request("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => request("/api/auth/me"),

  // Organizations
  getOrganizations: () => request<any[]>("/api/organizations"),
  getOrganization: (id: string) => request<any>(`/api/organizations/${id}`),
  createOrganization: (data: any) => request<any>("/api/organizations", { method: "POST", body: JSON.stringify(data) }),
  updateOrganization: (id: string, data: any) => request<any>(`/api/organizations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Members
  getMembers: (organizationId?: string) => request<any[]>(`/api/members${organizationId ? `?organizationId=${organizationId}` : ""}`),
  addMember: (data: any) => request<any>("/api/members", { method: "POST", body: JSON.stringify(data) }),
  updateMember: (id: string, data: any) => request<any>(`/api/members/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  removeMember: (id: string) => request<any>(`/api/members/${id}`, { method: "DELETE" }),

  // Elections
  getElections: (params?: { status?: string; organizationId?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any[]>(`/api/elections${qs ? `?${qs}` : ""}`);
  },
  getElection: (id: string) => request<any>(`/api/elections/${id}`),
  createElection: (data: any) => request<any>("/api/elections", { method: "POST", body: JSON.stringify(data) }),
  updateElection: (id: string, data: any) => request<any>(`/api/elections/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  castVote: (electionId: string, data: any) => request<any>(`/api/elections/${electionId}/vote`, { method: "POST", body: JSON.stringify(data) }),
  hasVoted: (electionId: string, wallet: string) => request<any>(`/api/elections/${electionId}/has-voted?wallet=${wallet}`),
  addCandidate: (electionId: string, data: any) => request<any>(`/api/elections/${electionId}/candidates`, { method: "POST", body: JSON.stringify(data) }),

  // Proposals
  getProposals: (params?: { status?: string; organizationId?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any[]>(`/api/proposals${qs ? `?${qs}` : ""}`);
  },
  getProposal: (id: string) => request<any>(`/api/proposals/${id}`),
  createProposal: (data: any) => request<any>("/api/proposals", { method: "POST", body: JSON.stringify(data) }),
  updateProposal: (id: string, data: any) => request<any>(`/api/proposals/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  voteProposal: (id: string, data: any) => request<any>(`/api/proposals/${id}/vote`, { method: "POST", body: JSON.stringify(data) }),

  // Tenders
  getTenders: (params?: { status?: string; organizationId?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<any[]>(`/api/tenders${qs ? `?${qs}` : ""}`);
  },
  getTender: (id: string) => request<any>(`/api/tenders/${id}`),
  createTender: (data: any) => request<any>("/api/tenders", { method: "POST", body: JSON.stringify(data) }),
  updateTender: (id: string, data: any) => request<any>(`/api/tenders/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  commitBid: (tenderId: string, data: any) => request<any>(`/api/tenders/${tenderId}/commit`, { method: "POST", body: JSON.stringify(data) }),
  revealBid: (tenderId: string, data: any) => request<any>(`/api/tenders/${tenderId}/reveal`, { method: "POST", body: JSON.stringify(data) }),
  recordAward: (tenderId: string, data: any) => request<any>(`/api/tenders/${tenderId}/award`, { method: "POST", body: JSON.stringify(data) }),

  // Documents
  getDocuments: () => request<any[]>("/api/documents"),
  uploadDocument: (formData: FormData) => {
    const token = localStorage.getItem("auth_token");
    return fetch(`${API_BASE}/api/documents`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then((r) => r.json());
  },

  // AI
  analyzeProposal: (data: any) => request<any>("/api/ai/analyze-proposal", { method: "POST", body: JSON.stringify(data) }),
  analyzeTender: (data: any) => request<any>("/api/ai/analyze-tender", { method: "POST", body: JSON.stringify(data) }),
  chat: (data: any) => request<any>("/api/ai/chat", { method: "POST", body: JSON.stringify(data) }),

  // Audit
  getAuditEvents: (params?: any) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/api/audit${qs ? `?${qs}` : ""}`);
  },

  // Analytics
  getAnalytics: () => request<any>("/api/analytics"),
  getElectionAnalytics: (id: string) => request<any>(`/api/analytics/elections/${id}`),

  // Reputation
  getReputation: (wallet?: string) => request<any>(`/api/reputation${wallet ? `?walletAddress=${wallet}` : ""}`),
};
