import { z } from "zod";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorComp } from "./Error";
import { Spinner } from "./Spinner";
import { StoryResponse } from "~/remotion/schemata";

type ShareState = "idle" | "submitting" | "error";

export const RenderControls: React.FC<{
  inputProps: z.infer<typeof StoryResponse>;
}> = ({ inputProps }) => {
  const navigate = useNavigate();
  const [state, setState] = useState<ShareState>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    if (state === "submitting") return;
    setState("submitting");
    setError(null);

    try {
      const response = await fetch("/api/story-shares", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ storyData: inputProps }),
      });

      if (!response.ok) {
        throw new Error("Failed to create share link.");
      }

      const json = await response.json();
      if (json?.type !== "success" || typeof json?.data?.id !== "string") {
        throw new Error("Unexpected response from share service.");
      }

      navigate(`/share/${json.data.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setState("error");
      return;
    }

    setState("idle");
  }, [inputProps, navigate, state]);

  const isSubmitting = state === "submitting";

  return (
    <div className="mx-auto w-full max-w-[360px]">
      <button
        type="button"
        onClick={handleShare}
        disabled={isSubmitting}
        className={`group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full px-6 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6c37] ${
          isSubmitting
            ? "cursor-wait border border-[#ffc4af] bg-[#ffe5db] text-[#a04927]"
            : "border border-transparent bg-[#ff6c37] text-white shadow-[0_12px_30px_rgba(255,108,55,0.22)] hover:bg-[#ff814f]"
        }`}
      >
        {isSubmitting ? (
          <div className="relative flex items-center gap-3 text-inherit">
            <Spinner size={24} color="#ff6c37" />
            <span className="tbpn-subheadline text-xs tracking-[0.3em] uppercase">Preparing share link…</span>
          </div>
        ) : (
          <div className="relative flex items-center gap-3 text-inherit">
            <span className="h-2.5 w-2.5 rounded-full bg-white/70 shadow-[0_0_12px_rgba(255,255,255,0.5)]" />
            <span className="tbpn-subheadline text-xs tracking-[0.26em] uppercase">Share this welcome video</span>
          </div>
        )}
      </button>
      {error ? (
        <div className="mt-3">
          <ErrorComp message={error} />
        </div>
      ) : null}
    </div>
  );
};
