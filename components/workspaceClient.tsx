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
  )
}

function parseFileData(raw: unknown): FileData | null {
  if (!raw || typeof raw !== "object") return null;

  const f = raw as Record<string, unknown>;

  if (!f.files || !f.dependencies) return null;

  return raw as FileData
}

const WorkspaceClient = ({
  initialPrompt,
  userCredits,
  workspace,
  userId,
  userPlan,
}: WorkspaceClientProps) => {
  const [workspaceId, setWorkspaceId] = useState<string | null>(
    workspace?.id ?? null,
  );
  const [messages, setMessages] = useState<Message[]>(
    parseMessages(workspace?.messages),
  );
  const [credits, setCredits] = useState(userCredits);

  const [fileData, setFileData] = useState<FileData | null>(
    parseFileData(workspace?.fileData),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusLog, setStatusLog] = useState<StatusStep[]>([]);

  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const fileDataRef = useRef<FileData | null>(fileData);
  useEffect(() => {
    fileDataRef.current = fileData;
  }, [fileData]);

  const workspaceIdRef = useRef<string | null>(workspaceId);
  useEffect(() => {
    workspaceIdRef.current = workspaceId;
  }, [workspaceId]);

  const handleFilePatch = useCallback((patches: FileData) => {
    setFileData(patches);
  }, []);

  const pushStep = (label: string) => {
    setStatusLog((prev) => [
      ...prev.map((s, i) =>
        i === prev.length - 1 ? { ...s, status: "done" as const } : s,
      ),
      { label, status: "running" as const },
    ])
  }

  const completeSteps = () => {
    setStatusLog((prev) =>
      prev.map((s, i) =>
        i === prev.length - 1 ? { ...s, status: "done" as const } : s
      ),
    );
  };

  const handleGenerate = useCallback(
    async (prompt: string, imageUrl?: string) => {
      if (isGenerating) return;
      if (credits < MIN_CREDITS_TO_GENERATE) return;

      const userMessage: Message = {
        role: "user",
        content: prompt,
        ...(imageUrl ? { imageUrl } : {}),
        id: 0
      };

      const currentMessages = messagesRef.current;
      const currentWorkspaceId = workspaceIdRef.current;

      setMessages((prev) => [...prev, userMessage]);
      setIsGenerating(true);
      setStatusLog([{ label: "Thinking...", status: "running" }]);

      try {
        const res = await fetch("/api/gen-ai-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
          const lines = buffer.split("\n\n");
          //Example buffer after a few chunks might look like:
          // "data" :
          //After split:
          // ["data"]:
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;

            try {
              //strip the "data"
              const event = JSON.parse(line.slice(6));

              if (event.type === "status") {
                //gemini thought label -- adds a new step to the status log
                // eg: "designing layout"
                pushStep(event.message);
              } else if (event.type === "complete") {
                completeSteps();

                // Server sends: { assistantMessage, fileData, credits }
                setFileData(event.fileData);
                setCredits(event.credits);

                // Append assistant message to chat
                setMessages((prev) => [
                  ...prev,
                  {
                    id: Date.now(),
                    role: "assistant",
                    content: event.assistantMessage,
                  },
                ]);

                // If a new workspace was created (workspaceId can be null on request),
                // the server currently does not return workspaceId in the SSE payload.
                // Keep the existing URL/workspaceId.
              } else if (event.type === "error") {
                throw new Error(event.message);
              }

            } catch (error) {//skip malformed sse lines

            }
          }
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong.",
        );
        setMessages((prev) => prev.slice(0, -1))
      } finally {
        setIsGenerating(false);
        setStatusLog([]);
      }
    },
    [credits, isGenerating, userId]
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0a0a]">
      {/* Chat panel - left */}
      <ChatPanel
        messages={messages}
        isGenerating={isGenerating}
        isImproving={false}
        statusLog={statusLog}
        credits={credits}
        initialPrompt={initialPrompt}
        onGenerate={handleGenerate}
        userId={userId}
        workspaceId={workspaceId} onStop={function (): void {
          throw new Error("Function not implemented.");
        }} appTitle={fileData?.title ?? workspace?.title ?? null} />

      {/* Code panel - right */}
      <CodePanel
        fileData={fileData}
        isGenerating={isGenerating}
        statusLog={statusLog}
        onFilePatch={handleFilePatch}
      />
    </div>
  );
};

export default WorkspaceClient;