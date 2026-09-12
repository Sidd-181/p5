import { apiFetch } from "@/lib/api";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function listThreads(token) {
  return apiFetch("/api/agent/threads", {
    token,
  });
}

export async function loadThread(token, threadId) {
  return apiFetch(`/api/agent/threads/${threadId}`, { token });
}

export async function streamAgentChat(token, input, onEvent) {
  const res = await fetch(`${API_URL}/api/agent/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(input),
  });

  if (!res.ok || !res.body) {
    throw new Error("Agent request failed");
  }

  const reader = res.body.getReader();

  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    buffer += decoder.decode(value, { stream: !done });

    const blocks = buffer.split(/\n\n/);
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      for (const line of block.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();

        if (data) onEvent(JSON.parse(data));
      }
    }

    if (done) break;
  }
}
