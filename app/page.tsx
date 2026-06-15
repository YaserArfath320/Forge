"use client";

import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import { BlueTitle, GrayTitle, SectionHeading, SectionLabel } from "@/components/reusables";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FEATURES, PLACEHOLDERS, STEPS, SUGGESTIONS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { PricingTable, SignInButton, useAuth } from "@clerk/nextjs";
import { ArrowRight, ChevronRight, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prompt, setPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused || prompt) return;

    const t = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);

    return () => clearInterval(t);
  }, [isFocused, prompt]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [prompt]);

  const handleSubmit = () => {
    if (!prompt.trim() || !isSignedIn) return;

    router.push(
      `/workspace?prompt=${encodeURIComponent(prompt.trim())}`
    );
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestion = (s: string) => {
    setPrompt(s);
    textareaRef.current?.focus();
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] selection:bg-white/20">

      {/* HERO */}
      <section className="relative flex flex-col items-center px-4 pb-24 pt-40 text-center">
        <StarsBackground className="absolute inset-0 h-full w-full" />

        <Badge
          variant="outline"
          className="gap-2 p-4 backdrop-blur-sm relative z-10"
        >
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Powered by Gemini 3.5 Flash
        </Badge>

        <h1 className="relative z-10 mx-auto max-w-3xl text-balance font-serif text-5xl leading-tight tracking-tight sm:text-5xl lg:text-7xl">
          <GrayTitle>Forge your dream</GrayTitle>
          <br />
          <BlueTitle>from a single prompt</BlueTitle>
        </h1>

        <p className="relative z-10 mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-white/40">
          Describe what you want to build. AI writes the code, picks the
          packages, and renders a live preview all inside your browser.
        </p>

        {/* Prompt Box */}
        <div className="relative z-10 mx-auto mt-12 w-full max-w-2xl">
          <div
            className={cn(
              "rounded-2xl border bg-[#111111] duration-200",
              isFocused
                ? "border-white/20 ring-1 ring-white/8"
                : "border-white/8"
            )}
          >
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={PLACEHOLDERS[placeholderIndex]}
              rows={1}
              className="w-full resize-none bg-transparent px-5 pb-4 pt-5 text-sm placeholder:text-white/20 focus:outline-none sm:text-base"
              style={{ minHeight: 56, maxHeight: 200 }}
            />

            <div className="flex items-center justify-between border-t border-white/6 px-4 py-2.5">
              <span className="text-xs text-white/20">
                Press ⏎ to generate · Shift+⏎ for new line
              </span>

              {isSignedIn ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!prompt.trim()}
                  className="h-8 rounded-full px-5 font-semibold"
                  variant={prompt.trim() ? "default" : "secondary"}
                >
                  Generate
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <SignInButton mode="modal">
                  <Button className="h-8 rounded-full bg-white px-5 font-semibold">
                    Generate
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </SignInButton>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestion(s)}
                className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs text-white/40 transition-all hover:border-white/15 hover:bg-white/8 hover:text-white/70"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <p className="relative z-10 mt-10 text-xs text-white/50">
          No credit card required · 10 free generations on sign up
        </p>
      </section>

      <section className="relative z-10 px-4 pb-32">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f0f] shadow-[0_0_80px_rgba(59,130,246,0.15)]">

          {/* Browser Header */}
          <div className="flex items-center border-b border-white/10 px-4 py-3">
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
            </div>

            <div className="mx-auto rounded-lg bg-white/5 px-5 py-1">
              <span className="text-xs text-white/40">
                forge.app/workspace
              </span>
            </div>
          </div>

          <div className="flex h-[700px]">

            {/* CHAT */}
            <div className="w-[350px] border-r border-white/10 bg-[#0d0d0d]">

              <div className="border-b border-white/10 px-4 py-4">
                <h3 className="font-medium text-white">AI Builder</h3>
                <p className="text-xs text-white/40">
                  Build apps from prompts
                </p>
              </div>

              <div className="space-y-4 p-4">

                <div className="flex justify-end">
                  <div className="max-w-[260px] rounded-2xl rounded-br-sm bg-blue-500 px-4 py-3">
                    <p className="text-sm text-white">
                      Build a Kanban board with drag and drop support
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
                    ⚡
                  </div>

                  <div className="rounded-2xl rounded-tl-sm bg-white/5 px-4 py-3">
                    <p className="text-sm text-white/70">
                      Creating Kanban board...
                    </p>

                    <div className="mt-3 space-y-2">
                      <div className="h-2 w-full animate-pulse rounded bg-white/10" />
                      <div className="h-2 w-4/5 animate-pulse rounded bg-white/10" />
                      <div className="h-2 w-2/3 animate-pulse rounded bg-white/10" />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div className="flex flex-1 flex-col">

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button className="border-b-2 border-blue-500 px-5 py-3 text-sm text-white">
                  Preview
                </button>

                <button className="px-5 py-3 text-sm text-white/40">
                  Code
                </button>

                <button className="px-5 py-3 text-sm text-white/40">
                  Files
                </button>
              </div>

              <div className="flex flex-1">

                {/* File Explorer */}
                <div className="w-64 border-r border-white/10 bg-[#111111] p-4">
                  <p className="mb-4 text-xs uppercase text-white/30">
                    Project
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="text-white/80">📁 app</div>
                    <div className="pl-4 text-white/50">page.tsx</div>
                    <div className="pl-4 text-white/50">layout.tsx</div>

                    <div className="text-white/80">📁 components</div>
                    <div className="pl-4 text-white/50">Board.tsx</div>
                    <div className="pl-4 text-white/50">Card.tsx</div>

                    <div className="text-white/80">📄 package.json</div>
                  </div>
                </div>

                {/* Preview */}
                <div className="flex-1 bg-[#171717] p-6">

                  <div className="mx-auto h-full max-w-4xl rounded-2xl border border-white/10 bg-[#1c1c1c] p-5">

                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="font-semibold text-white">
                        Kanban Board
                      </h3>

                      <button className="rounded-lg bg-blue-500 px-3 py-1 text-xs text-white">
                        New Task
                      </button>
                    </div>

                    <div className="grid h-[450px] grid-cols-3 gap-4">

                      {["Todo", "In Progress", "Done"].map((col) => (
                        <div
                          key={col}
                          className="rounded-xl bg-black/20 p-3"
                        >
                          <h4 className="mb-3 text-sm font-medium text-white">
                            {col}
                          </h4>

                          <div className="space-y-3">
                            <div className="rounded-lg bg-white/5 p-3">
                              <div className="h-3 w-24 rounded bg-white/20" />
                              <div className="mt-2 h-2 w-16 rounded bg-white/10" />
                            </div>

                            <div className="rounded-lg bg-white/5 p-3">
                              <div className="h-3 w-20 rounded bg-white/20" />
                              <div className="mt-2 h-2 w-12 rounded bg-white/10" />
                            </div>
                          </div>
                        </div>
                      ))}

                    </div>

                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="px-4 pb-32">
        <div className="mx-auto mb-14 max-w-5xl text-center">
          <SectionLabel>Everything you need</SectionLabel>
          <SectionHeading gray="From prompt" blue="to production." />
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/6 bg-white/6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="group bg-[#0a0a0a] p-7 hover:bg-[#0f0f0f]"
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-white/4 group-hover:border-white/15 group-hover:bg-white/8">
                <Icon className="h-4 w-4 text-white/60 group-hover:text-blue-400/70" />
              </div>
              <p className="mb-2 text-sm font-semibold">{label}</p>
              <p className="text-sm leading-relaxed text-white/40">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 pb-32">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <SectionLabel>How it works</SectionLabel>
          <SectionHeading gray="Four steps" blue="to a working app." />
        </div>

        <div className="mx-auto max-w-3xl">
          {STEPS.map((step, i) => (
            <div key={step.number} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4">
                  <span className="font-mono text-xs font-semibold text-white/50">
                    {step.number}
                  </span>
                </div>

                {i < STEPS.length - 1 && (
                  <div className="mt-2 h-full w-px bg-white/6" />
                )}
              </div>

              <div className="pb-10 pt-1.5">
                <p className="mb-1.5 text-sm font-semibold sm:text-base">
                  {step.label}
                </p>

                <p className="text-sm leading-relaxed text-white/40">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="px-4 pb-32">
        <div className="mx-auto mb-14 max-w-5xl text-center">
          <SectionLabel>Simple pricing</SectionLabel>
          <SectionHeading gray="Start free," blue="scale when ready." />

          <p className="mx-auto mt-4 max-w-sm text-sm text-white/35">
            No credit card required. Upgrade or downgrade anytime.
          </p>
        </div>
        <div className="mx-auto max-w-5xl">
          <PricingTable
            checkoutProps={{
              appearance: {
                elements: {
                  drawerRoot: {
                    zIndex: 2000,
                  },
                },
              },
            }}
          />
        </div>
      </section>


      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="relative mx-auto mb-32 max-w-5xl overflow-hidden rounded-2xl border border-white/8 px-10 py-24 text-center">
        <StarsBackground className="absolute inset-0 h-full w-full" />

        <div className="relative z-10">
          <SectionHeading gray="Start building," blue="for free." />

          <p className="mt-4 mb-8 text-sm leading-relaxed text-white/40">
            Get 10 free generations on sign up. No credit card required.
            <br />
            Upgrade when you&apos;re ready.
          </p>

          <SignInButton mode="modal">
            <Button
              size="lg"
              className="h-11 rounded-full bg-white px-8 text-black"
            >
              Get started free
              <ChevronRight className="h-4 w-4" />
            </Button>
          </SignInButton>
        </div>
      </section>
      <footer className="relative z-10 border-t border-white/7 py-12 mx-auto px-6 flex flex-wrap items-center justify-center text-stone-400">
        Made with ❤️ by Yaser_Arfath
      </footer>

    </main>
  );
}

