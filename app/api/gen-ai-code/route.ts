import { CREDIT_COST_PER_GENERATION } from "@/lib/constants";
import { db } from "@/lib/prisma";
import { FileData, Message } from "@/types/workspace";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { detectPromptInjection } from "@arcjet/next";
import { aj } from "@/lib/arcjet";

function trimHistory(messages: Message[]): Message[] {
    if (messages.length <= 10) return messages;
    return [messages[0], ...messages.slice(-8)];
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});

function buildContents(messages: Message[], fileData: FileData | null) {
    const trimmed = trimHistory(messages);

    return trimmed.map((msg, idx) => {
        const role = msg.role === "assistant" ? "model" : "user";

        if (msg.role === "user") {
            const parts: object[] = [];

            let text = msg.content;

            if (msg.imageUrl) {
                text = `[The user has attached an image. Use this URL directly in the generated app where relevant (as img src, background-image, etc.): ${msg.imageUrl}

${text}]`;
            }

            const isLast = idx === trimmed.length - 1;

            if (isLast && fileData) {
                text +=
                    "\n\nCurrent project files for context:\n" +
                    JSON.stringify(fileData, null, 2);
            }

            parts.push({ text });

            return {
                role,
                parts,
            };
        }

        return {
            role,
            parts: [{ text: msg.content }],
        };
    });
}

const SYSTEM_PROMPT = `You are an expert React developer. Your job is to generate complete, working React applications based on user prompts.

RULES:
1. Always respond with a valid JSON object — no markdown fences, no extra text.
2. The JSON must match this exact shape:
{
  "assistantMessage": "<brief explanation>",
  "title": "<app title>",
  "files": {
    "/App.js": { "code": "<full file content>" }
  },
  "dependencies": {}
}
3. Use React functional components and hooks.
4. Use Tailwind CSS.
5. Entry point must be /App.js.
6. Include all required files.
`;

function extractThoughtLabel(text: string): string | null {
    const boldMatch = text.match(/\*\*([^*]{4,60})\*\*/);

    if (boldMatch) {
        return boldMatch[1].trim();
    }

    const sentence = text.split(/[.\n]/)[0].trim();

    if (sentence.length >= 8 && sentence.length <= 80) {
        return sentence;
    }

    return null;
}

function sseEvent(type: string, payload: unknown): string {
    return `data: ${JSON.stringify({
        type,
        ...(payload as object),
    })}\n\n`;
}

async function validateDependencies(
    deps: Record<string, string>
): Promise<Record<string, string>> {
    const valid: Record<string, string> = {};

    await Promise.all(
        Object.entries(deps).map(async ([packageName, version]) => {
            try {
                const res = await fetch(
                    `https://registry.npmjs.org/${packageName}/latest`,
                    {
                        signal: AbortSignal.timeout(1500),
                    }
                );

                if (res.ok) {
                    valid[packageName] = version;
                }
            } catch {
                // Ignore hallucinated packages
            }
        })
    );

    return valid;
}

export async function POST(request: NextRequest) {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        return Response.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    const body = await request.json();

    const {
        workspaceId,
        userId,
        messages,
        fileData,
    } = body as {
        workspaceId: string | null;
        userId: string;
        messages: Message[];
        fileData: FileData | null;
    };

    if (!messages?.length) {
        return Response.json(
            { message: "No messages provided" },
            { status: 400 }
        );
    }

    //Arcjet: rate limit, prompt injection, sensitive info----------
    const lastUserMessage =
        [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const decision = await aj.protect(request, {
        requested: 1,
        userId: clerkId,
        detectPromptInjectionMessage: lastUserMessage,
    });

    if (decision.isDenied()) {
        //Return the reason type as the message -- rateLimit, bot, promptInjection, etc.
        return Response.json(
            { message: decision.reason?.type ?? "Request blocked" },
            { status: 429 },
        )
    }

    const user = await db.user.findUnique({
        where: {
            clerkId
        },
        select: {
            id: true,
            credits: true,
        },
    });

    if (!user) {
        return Response.json(
            { message: "User not found" },
            { status: 404 }
        );
    }

    if (user.credits < CREDIT_COST_PER_GENERATION) {
        return Response.json(
            { message: "Insufficient credits" },
            { status: 402 }
        );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const enqueue = (chunk: string) => {
                controller.enqueue(encoder.encode(chunk));
            };

            try {
                const contents = buildContents(messages, fileData);

                const geminiStream = await ai.models.generateContentStream({
                    model: "gemini-2.5-flash",
                    contents,
                    config: {
                        systemInstruction: SYSTEM_PROMPT,
                        temperature: 0.7,
                        responseMimeType: "application/json",
                        thinkingConfig: {
                            includeThoughts: true,
                        },
                    },
                });

                let accumulated = "";
                let lastEmitTime = 0;

                for await (const chunk of geminiStream) {
                    const parts =
                        chunk.candidates?.[0]?.content?.parts ?? [];

                    for (const part of parts) {
                        if (!part.text) continue;

                        if (part.thought) {
                            const now = Date.now();
                            if (now - lastEmitTime > 600) {
                                const label = extractThoughtLabel(part.text);
                                if (label) {
                                    enqueue(
                                        sseEvent("status", {
                                            message: label,
                                        })
                                    );
                                    lastEmitTime = now;
                                }
                            }
                        } else {
                            accumulated += part.text;
                        }
                    }
                }

                let parsed: {
                    assistantMessage: string;
                    title?: string;
                    files: Record<string, { code: string }>;
                    dependencies: Record<string, string>;
                };

                try {
                    parsed = JSON.parse(accumulated);
                } catch {
                    enqueue(
                        sseEvent("error", {
                            message:
                                "AI returned invalid JSON. Please try again.",
                        })
                    );

                    controller.close();
                    return;
                }

                const {
                    assistantMessage,
                    title: aiTitle,
                    files,
                    dependencies,
                } = parsed;

                if (!files || typeof files !== "object") {
                    enqueue(
                        sseEvent("error", {
                            message:
                                "AI response missing files. Please try again.",
                        })
                    );

                    controller.close();
                    return;
                }

                enqueue(
                    sseEvent("status", {
                        message: "Validating packages...",
                    })
                );

                const validatedDeps = await validateDependencies(
                    dependencies ?? {}
                );

                const newFileData: FileData = {
                    files,
                    dependencies: validatedDeps,
                    title: aiTitle,
                };

                enqueue(
                    sseEvent("status", {
                        message: "Saving...",
                    })
                );

                const lastUserMsg = messages[messages.length - 1];
                const updatedMessages: Message[] = [
                    ...messages,
                    {
                        role: "assistant",
                        content: assistantMessage,
                        id: 0,
                    },
                ];

                await db.$transaction(
                    async (tx) => {
                        const ws = workspaceId
                            ? await tx.workspace.update({
                                where: {
                                    id: workspaceId,
                                    userId,
                                },
                                data: {
                                    title:
                                        aiTitle ??
                                        lastUserMsg.content.slice(0, 80),
                                    messages: updatedMessages as never,
                                    fileData: newFileData as never,
                                },
                            })
                            : await tx.workspace.create({
                                data: {
                                    userId,
                                    title:
                                        aiTitle ??
                                        lastUserMsg.content.slice(0, 80),
                                    messages: updatedMessages as never,
                                    fileData: newFileData as never,
                                },
                            });

                        await tx.user.update({
                            where: {
                                id: userId,
                            },
                            data: {
                                credits: {
                                    decrement: CREDIT_COST_PER_GENERATION,
                                },
                            },
                        });

                        return ws;
                    },
                    { timeout: 200000 }
                );

                const updatedUser = await db.user.findUnique({
                    where: {
                        id: userId,
                    },
                    select: {
                        credits: true,
                    },
                });

                enqueue(
                    sseEvent("complete", {
                        assistantMessage,
                        fileData: newFileData,
                        credits: updatedUser?.credits ?? 0,
                    })
                );

                controller.close();
            } catch (err) {
                console.error("[gen-ai-code] stream error:", err);

                enqueue(
                    sseEvent("error", {
                        message:
                            "Something went wrong. Please try again.",
                    })
                );

                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}

export const runtime = "nodejs";
export const maxDuration = 300;