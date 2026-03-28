"use client";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import toast from "react-hot-toast";

const fetcher = (url: string) =>
  fetch(url).then((r) => { if (!r.ok) throw new Error("Request failed"); return r.json(); });

export function useAgents() {
  const { data, error, isLoading, mutate } = useSWR("/api/agents", fetcher, {
    refreshInterval: 30_000,
  });

  return {
    agents: data?.agents ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useAgent(id: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/agents/${id}` : null, fetcher);
  return { agent: data, isLoading, error, refresh: mutate };
}

export function useRegisterAgent() {
  const { trigger, isMutating } = useSWRMutation(
    "/api/agents",
    async (url: string, { arg }: { arg: unknown }) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Registration failed");
      }
      return res.json();
    }
  );
  return { register: trigger, isRegistering: isMutating };
}

export function useSuspendAgent() {
  return async (agentId: string, reason: string) => {
    const res = await fetch(`/api/agents/${agentId}/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error("Failed to suspend agent");
    toast.success("Agent suspended");
    return res.json();
  };
}

export function useReinstateAgent() {
  return async (agentId: string) => {
    const res = await fetch(`/api/agents/${agentId}/reinstate`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to reinstate agent");
    toast.success("Agent reinstated");
    return res.json();
  };
}
