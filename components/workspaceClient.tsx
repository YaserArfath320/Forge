"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CodePanel } from "./CodePanel";
import ChatPanel from "./ChatPanel";
import { FileData, Message, StatusStep, WorkspaceData } from "@/types/workspace";
import { MIN_CREDITS_TO_GENERATE } from "@/lib/constants";
import { toast } from "sonner";

interface WorkspaceClientProps {
  initialPrompt: string | null;
  userCredits: number;
  userId: string;
  userPlan: string;
  workspace: WorkspaceData | null;
}

function parseMessages(raw: unknown): Message[] {
  if (!Array.isArray(raw)) return [];

  return raw.filter(
    (m): m is Message =>
      typeof m === "object" && m !== null && "role" in m && "content" in m,
  );
}

function parseFileData(raw: unknown): FileData | null {
  if (!raw || typeof raw !== "object") return null;

  const f = raw as Record<string, unknown>;

  if (
    typeof f.files !== "object" ||
    typeof f.dependencies !== "object"
  ) {
    return null;
  }

  return raw as FileData;
}

const WorkspaceClient = ({
  initialPrompt,
  userCredits,
  workspace,
  userId,
  userPlan,
}: WorkspaceClientProps) => {
  const [messages, setMessages] = useState<Message[]>(
    parseMessages(workspace?.messages),
  );
  const [credits, setCredits] = useState(userCredits);

  const [fileData, setFileData] = useState<FileData | null>(
    parseFileData(workspace?.fileData),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusLog, setStatusLog] = useState<StatusStep[]>([]);
  const [isImproving, setIsImproving] = useState(false);

  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const fileDataRef = useRef<FileData | null>(fileData);
  useEffect(() => {
    fileDataRef.current = fileData;
  }, [fileData]);

  const workspaceIdRef = useRef<string | null>(workspace?.id ?? null);
  useEffect(() => {
    workspaceIdRef.current = workspace?.id ?? null;
  }, [workspace?.id]);

  // AbortController refs - used to cancel in-flight streams
  const generateAbortRef = useRef<AbortController | null>(null);
  const improveAbortRef = useRef<AbortController | null>(null);

  const handleFilePatch = useCallback((patches: FileData) => {
    setFileData(patches);
  }, []);

  const pushStep = (label: string) => {
    setStatusLog((prev) => [
      ...prev.map((s, i) =>
        i === prev.length - 1 ? { ...s, status: "done" as const } : s,
      ),
      { label, status: "running" as const },
    ]);
  };

  const completeSteps = () => {
    setStatusLog((prev) =>
      prev.map((s, i) =>
        i === prev.length - 1 ? { ...s, status: "done" as const } : s,
      ),
    );
  };

  const handleImprove = useCallback(
    async (userRequest: string) => {
      if (isGenerating || isImproving) return;
      if (credits < MIN_CREDITS_TO_GENERATE) return;
      if (!workspaceIdRef.current) return;

      const currentFileData = fileDataRef.current;
      if (!currentFileData) return;

      setIsImproving(true);

      const timestamp = Date.now();

      setMessages((prev) => [
        ...prev,
        { id: timestamp, role: "user", content: userRequest },
        { id: timestamp + 1, role: "assistant", content: "" },
      ]);

      //Create a fresh AbortController for this request
      const abortController = new AbortController();
      improveAbortRef.current = abortController;
      try {
        const res = await fetch("/api/improve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            userId,
            workspaceId: workspaceIdRef.current,
            userRequest,
            fileData: currentFileData,
          }),
        });

        if (res.status === 403) {
          toast.error("Not enough credits.");
          setMessages((prev) => prev.slice(0, -2));
          return;
        }
        if (!res.ok || !res.body) throw new Error("Improve failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedThinking = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;

            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "thinking") {
                //Append to accumulated thinking text and update placeholder
                accumulatedThinking += event.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    id: Date.now(),
                    role: "assistant",
                    content: accumulatedThinking,
                  };
                  return updated;
                });
              } else if (event.type === "file_patch") {
                //file_patch events are received here but intentionally not applied
                // to state per-patch. The done event carries the complete final
                //finalData so per-patch state updates are unneccesary and would
                //cause Sandpack to recompile on every individual file update

              } else if (event.type === "done") {
                setFileData(event.fileData);
                setCredits(event.creditsRemaining);
                //Replace thinking text with clean final summary
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    id: Date.now(),
                    role: "assistant",
                    content: event.summary,
                  };
                  return updated;
                });
              } else if (event.type === "error") {
                throw new Error(event.message)
              }
            } catch (error) {
              console.log("Failed to parse improve event:", error)
            }
          }
        }

      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setMessages((prev) => prev.slice(0, -2))
          return;
        }
        toast.error(err instanceof Error ? err.message : "Improve failed.");
        setMessages((prev) => prev.slice(0, -2));
      } finally {
        improveAbortRef.current = null;
        setIsImproving(false);
      }
    },
    [credits, isGenerating, isImproving, userId]
  )

  const handleGenerate = useCallback(
    async (prompt: string, imageUrl?: string) => {
      if (isGenerating) return;
      if (credits < MIN_CREDITS_TO_GENERATE) return;

      const userMessage: Message = {
        role: "user",
        content: prompt,
        ...(imageUrl ? { imageUrl } : {}),
        id: 0,
      };

      const currentMessages = messagesRef.current;
      const currentWorkspaceId = workspaceIdRef.current;

      setMessages((prev) => [...prev, userMessage]);
      setIsGenerating(true);
      setStatusLog([{ label: "Thinking...", status: "running" }]);

      const abortController = new AbortController();
      generateAbortRef.current = abortController;

      try {
        const res = await fetch("/api/gen-ai-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: JSON.stringify({
            workspaceId: currentWorkspaceId,
            userId,
            messages: [...currentMessages, userMessage],
            fileData: fileDataRef.current,
          }),
        });

        if (res.status === 402) {
          toast.error("Not enough credits.");
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
        if (res.status === 429) {
          toast.error("Too many requests. Please slow down. ");
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
        if (!res.ok || !res.body) throw new Error("Generation failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by a blank line.
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const evt of events) {
            // Each event can contain multiple `data:` lines.
            const dataLines = evt
              .split("\n")
              .map((l) => l.trim())
              .filter((l) => l.startsWith("data:"));

            if (dataLines.length === 0) continue;

            const data = dataLines
              .map((l) => l.replace(/^data:\s?/, ""))
              .join("\n");

            try {
              const event = JSON.parse(data) as {
                type: "status" | "complete" | "error";
                message?: string;
                assistantMessage?: string;
                fileData?: FileData;
                credits?: number;
              };

              if (event.type === "status") {
                if (event.message) pushStep(event.message);
              } else if (event.type === "complete") {
                completeSteps();

                if (event.fileData) setFileData(event.fileData);
                if (typeof event.credits === "number") setCredits(event.credits);

                if (event.assistantMessage) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: Date.now(),
                      role: "assistant",
                      content: event.assistantMessage as string,
                    },
                  ]);
                }
              } else if (event.type === "error") {
                throw new Error(event.message ?? "AI error");
              }
            } catch {
              // ignore malformed SSE chunks
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setMessages((prev) => prev.slice(0, -1));
          return;
        }

        toast.error(err instanceof Error ? err.message : "Something went wrong.");
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        generateAbortRef.current = null;
        setIsGenerating(false);
        setStatusLog([]);
      }
    },
    [credits, isGenerating, userId],
  );

  const handleStop = useCallback(() => {
    generateAbortRef.current?.abort();
    improveAbortRef.current?.abort();
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0a0a]">
      <ChatPanel
        messages={messages}
        isGenerating={isGenerating}
        isImproving={isImproving}
        statusLog={statusLog}
        credits={credits}
        initialPrompt={initialPrompt}
        onStop={handleStop}
        onGenerate={handleGenerate}
        userId={userId}
        workspaceId={workspaceIdRef.current}
        appTitle={fileData?.title ?? workspace?.title ?? null}
      />

      <CodePanel
        fileData={fileData}
        isGenerating={isGenerating}
        statusLog={statusLog}
        onFilePatch={handleFilePatch}
        isImproving={isImproving}
        onFixError={(error) =>
          handleGenerate(
            `There is an error in the preview:\n\n\`\`\`\n${error}\n\`\`\`\n\nPlease fix it.`,
          )
        }
        appTitle={fileData?.title ?? workspace?.title ?? null}
        isProUser={userPlan === "pro"}
        onImprove={handleImprove}
      />
    </div>
  );
};

export default WorkspaceClient;

