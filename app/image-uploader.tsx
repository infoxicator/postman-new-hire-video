import { Player } from "@remotion/player";
import { useEffect, useRef, useState } from "react";
import {
  DURATION_IN_FRAMES,
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
} from "./remotion/constants.mjs";
import "./app.css";
import { z } from "zod";
import { Main } from "./remotion/components/Main";
import { RenderControls } from "./components/RenderControls";
import { Spacing } from "./components/Spacing";
import { StoryResponse } from "./remotion/schemata";
import { Loading } from "./components/Loading";
import { Input } from "./components/Input";
import { Button } from "./components/Button";
import { ImageUpload, ImageUploadHandle } from "./components/ImageUpload";
import type { StoryData } from "./remotion/types";

type BlogLoaderData = {
  profilePic?: string | null;
  name?: string | null;
  role?: string | null;
  storyData?: StoryData | null;
  prompt?: string | null;
};

export async function clientLoader({ request }: { request: Request }): Promise<BlogLoaderData> {
  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  const role = url.searchParams.get("role");
  const prompt = url.searchParams.get("prompt");

  if (!name || !role) {
    return { profilePic: null, name: null, role: null, storyData: null, prompt: null };
  }
    return { profilePic: null, name, role, storyData: null, prompt: prompt ?? null };
}

export function HydrateFallback() {
  return (
    <div className="max-w-screen-md m-auto mb-5">
      <div className="overflow-hidden rounded-geist shadow-[0_0_200px_rgba(0,0,0,0.15)] mb-10 mt-16 bg-background">
        <div className="aspect-[9/16] flex items-center justify-center">
          <Loading compact title="Rendering welcome video…" subtitle="Preparing assets" />
        </div>
      </div>
    </div>
  );
}

export default function Blog({ loaderData }: { loaderData: BlogLoaderData }) {
  
  const [pending, setPending] = useState(false);
  const [nameInput, setNameInput] = useState(loaderData.name ?? "");
  const [roleInput, setRoleInput] = useState(loaderData.role ?? "");
  const [promptInput, setPromptInput] = useState("");

  const [storyData, setStoryData] = useState<StoryData | undefined>(loaderData.storyData ?? undefined);
  const [selectedProfileFile, setSelectedProfileFile] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    loaderData.profilePic ?? null
  );
  const [profileUrlInput, setProfileUrlInput] = useState(loaderData.profilePic ?? "");
  const [imageMode, setImageMode] = useState<"upload" | "url">(() => {
    const incoming = loaderData.profilePic ?? "";
    return incoming && incoming.startsWith("http") ? "url" : "upload";
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const imageUploadRef = useRef<ImageUploadHandle | null>(null);

  const inputProps = storyData;

  useEffect(() => {
		window.parent.postMessage({ type: 'ui-lifecycle-iframe-ready' }, '*')

		const height = document.documentElement.scrollHeight
		const width = document.documentElement.scrollWidth

		window.parent.postMessage(
			{ type: 'ui-size-change', payload: { height, width } },
			'*',
		)
	}, [storyData])

  // Keep the input prefilled with the latest query param and clear pending after load
  useEffect(() => {
    setNameInput(loaderData.name ?? "");
    setSelectedProfileFile(null);
    const incomingPic = loaderData.profilePic ?? null;
    const nextMode = incomingPic && incomingPic.startsWith("http") ? "url" : incomingPic ? "upload" : "upload";
    setImageMode(nextMode);
    setProfileImageUrl(nextMode === "upload" ? incomingPic : null);
    setProfileUrlInput(incomingPic ?? "");
    setRoleInput(loaderData.role ?? "");
    setStoryData(loaderData.storyData ?? undefined);
    setPromptInput(loaderData.prompt ?? "");
    setError(null);
    setUploadingImage(false);
    setPending(false);
  }, [loaderData.name, loaderData.profilePic, loaderData.role, loaderData.storyData, loaderData.prompt]);

  useEffect(() => {
    if (!pending && inputProps) {
      playerContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [pending, inputProps]);

  const handleImageModeChange = (
    mode: "upload" | "url",
    options: { openDialog?: boolean } = {},
  ) => {
    if (mode === imageMode) {
      if (mode === "upload" && options.openDialog) {
        imageUploadRef.current?.openFileDialog();
      }
      return;
    }
    setImageMode(mode);
    setError(null);
    if (mode === "upload") {
      setProfileImageUrl(null);
    } else {
      setSelectedProfileFile(null);
      setProfileImageUrl(null);
      setUploadingImage(false);
    }

    if (mode === "upload" && options.openDialog) {
      setTimeout(() => {
        imageUploadRef.current?.openFileDialog();
      }, 0);
    }
  };

  async function handleSubmit() {
    setError(null);
    const trimmedName = nameInput.trim();
    const trimmedRole = roleInput.trim();
    const trimmedPrompt = promptInput.trim();
    if (!trimmedName || !trimmedRole) {
      setError("Please add the new hire's name and team before generating the video.");
      return;
    }
    if (uploadingImage) {
      setError("Image upload is still in progress. Wait until the file is ready.");
      return;
    }

    const resolvedProfilePic = imageMode === "upload" ? profileImageUrl : profileUrlInput.trim();

    if (!resolvedProfilePic) {
      setError("Add a headshot by uploading a file or linking to a hosted image.");
      return;
    }
    if (imageMode === "url" && !/^https?:\/\//i.test(resolvedProfilePic)) {
      setError("Image URLs must start with http:// or https://.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(
        "https://postman.flows.pstmn.io/api/default/new-hire-video",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            profilePic: resolvedProfilePic,
            role: trimmedRole,
            ...(trimmedPrompt ? { prompt: trimmedPrompt } : {}),
          }),
        }
      );
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();

      const content = Array.isArray(data?.content) ? data.content : [];
      const initial = content
        .map((item: any) => item?.resource?._meta?.["mcpui.dev/ui-initial-render-data"])
        .find((val: any) => Boolean(val));

      const parsed = StoryResponse.safeParse(initial);
      if (!parsed.success) throw parsed.error;
      const story: StoryData = { ...parsed.data, newHireName: trimmedName };
      setStoryData(story);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : "Failed to load story";
      setError(`We couldn't generate the draft: ${errMessage}`);
      setStoryData(undefined);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="bg-[#f5f1ef] tbpn-body min-h-screen text-[#1b1c1d] pb-16">
      <div className="max-w-screen-lg m-auto px-6 md:px-10">
        {/* Story input form */}
        <div className="mt-14 mb-10">
          <div className="tbpn-panel px-7 py-9 md:px-12 md:py-12 flex flex-col gap-7 text-[#1b1c1d]">
            <div>
              <p className="tbpn-chip">Welcome Video Assets</p>
              <h2 className="tbpn-headline text-3xl md:text-4xl mt-4">Provide the final image</h2>
              <p className="text-sm md:text-base text-[#6b7076] mt-4 max-w-2xl">
                The name and team are already set from your flow inputs. Add a high-quality headshot to complete the welcome video preview.
              </p>
            </div>

            <Input type="hidden" disabled={pending} text={nameInput} setText={setNameInput} />
            <Input type="hidden" disabled={pending} text={roleInput} setText={setRoleInput} />

            <div>
              <label className="tbpn-label">Highlight details (optional)</label>
              <Input
                disabled={pending}
                text={promptInput}
                setText={setPromptInput}
                placeholder="Include milestones, background, or fun facts to mention in the video"
                className="mt-3"
              />
              <p className="text-xs text-[#6b7076] mt-3">Add a personal touch so colleagues can greet them with context.</p>
            </div>

            <div>
              <label className="tbpn-label">Upload a headshot</label>
              <p className="text-xs text-[#6b7076] mt-3">Attach a square photo or share a link to a hosted image.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className={`px-4 py-2 text-xs tbpn-subheadline rounded-full border transition-colors duration-150 tracking-[0.18em] ${
                    imageMode === "upload"
                      ? "border-[#ff6c37] bg-[#ff6c37] text-white shadow-[0_12px_24px_rgba(255,108,55,0.18)]"
                      : "border-[#e6e1dd] bg-white text-[#6b7076] hover:border-[#ff6c37] hover:text-[#ff6c37]"
                  }`}
                  onClick={() => handleImageModeChange("upload", { openDialog: true })}
                  aria-pressed={imageMode === "upload"}
                >
                  Upload file
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-xs tbpn-subheadline rounded-full border transition-colors duration-150 tracking-[0.18em] ${
                    imageMode === "url"
                      ? "border-[#ff6c37] bg-[#ff6c37] text-white shadow-[0_12px_24px_rgba(255,108,55,0.18)]"
                      : "border-[#e6e1dd] bg-white text-[#6b7076] hover:border-[#ff6c37] hover:text-[#ff6c37]"
                  }`}
                  onClick={() => handleImageModeChange("url")}
                  aria-pressed={imageMode === "url"}
                >
                  Paste a URL
                </button>
              </div>

              {imageMode === "upload" ? (
                <div className="mt-5">
                  <ImageUpload
                    ref={imageUploadRef}
                    disabled={pending}
                    initialImageUrl={profileImageUrl}
                    onFileSelect={setSelectedProfileFile}
                    onImageUploaded={setProfileImageUrl}
                    onUploadingChange={setUploadingImage}
                    selectedFile={selectedProfileFile}
                  />
                </div>
              ) : null}

              {imageMode === "url" ? (
                <div className="mt-5 space-y-3">
                  <Input
                    disabled={pending}
                    text={profileUrlInput}
                    setText={setProfileUrlInput}
                    placeholder="https://example.com/new-hire-headshot.jpg"
                    type="url"
                  />
                  {profileUrlInput.trim() ? (
                    <div>
                      <img
                        src={profileUrlInput.trim()}
                        alt="Profile preview"
                        className="max-h-48 rounded-[18px] object-cover border border-[#ffcbb8]"
                      />
                    </div>
                  ) : null}
                  <p className="text-xs text-[#6b7076]">Ensure the link is accessible without authentication.</p>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="rounded-[18px] border border-[#f5b9aa] bg-[#fff4f0] text-[#7c2f1c] text-sm px-5 py-4 shadow-[0_12px_25px_rgba(244,137,98,0.12)]">
                {error}
              </div>
            ) : null}

            <div className="flex justify-center">
              <Button
                type="button"
                onClick={handleSubmit}
                loading={pending || uploadingImage}
                disabled={pending || uploadingImage}
                className="tbpn-headline text-sm h-12 px-8"
              >
                Generate welcome video
              </Button>
            </div>
          </div>
        </div>

        {/* Only render the player once we have story data */}
        <div ref={playerContainerRef} className="mx-auto w-full max-w-[360px]">
          {pending ? (
            <div className="relative overflow-hidden rounded-[28px] mb-12 mt-8 border border-[#ffd0bf] shadow-[0_35px_80px_rgba(119,77,54,0.18)] aspect-[9/16] bg-gradient-to-br from-[#fff7f3] via-[#fff4ef] to-[#ffe9df]">
              <div className="relative flex h-full w-full items-center justify-center">
                <Loading
                  compact
                  title="Rendering welcome video…"
                  subtitle="Assembling graphics and narration"
                  titleClassName="text-[#1b1c1d]"
                  subtitleClassName="text-[#6b7076]"
                />
              </div>
            </div>
          ) : null}

          {!pending && inputProps ? (
            <div className="overflow-hidden rounded-[28px] shadow-[0_30px_80px_rgba(81,46,29,0.18)] border border-[#f0c9bd] mb-12 mt-8 aspect-[9/16] bg-white">
              <Player
                component={Main}
                inputProps={inputProps}
                durationInFrames={DURATION_IN_FRAMES}
                fps={COMPOSITION_FPS}
                compositionHeight={COMPOSITION_HEIGHT}
                compositionWidth={COMPOSITION_WIDTH}
                style={{ width: "100%", height: "100%" }}
                controls
                autoPlay
                loop
              />
            </div>
          ) : null}

        </div>
        {inputProps ? (
          <RenderControls inputProps={inputProps} />
        ) : null}
        <Spacing />
        <Spacing />
        <Spacing />
        <Spacing />
      </div>
    </div>
  );
}
