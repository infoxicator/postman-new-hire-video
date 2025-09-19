import { Player } from "@remotion/player";
import { type FC } from "react";
import { Link } from "react-router-dom";
import {
  DURATION_IN_FRAMES,
  COMPOSITION_FPS,
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
} from "./remotion/constants.mjs";
import "./app.css";
import { z } from "zod";
import { Main } from "./remotion/components/Main";
import { StoryResponse } from "./remotion/schemata";
import { Loading } from "./components/Loading";
import { Spacing } from "./components/Spacing";
import { type MetaFunction } from "react-router";

interface SuccessLoaderData {
  status: "success";
  storyData: z.infer<typeof StoryResponse>;
  shareUrl: string;
  shareId: string;
}

interface ErrorLoaderData {
  status: "error";
  message: string;
  shareUrl: string;
}

type LoaderData = SuccessLoaderData | ErrorLoaderData;

export async function clientLoader({ params, request }: { params: { shareId?: string }; request: Request }) {
  const shareId = params.shareId;
  const currentUrl = new URL(request.url);

  if (!shareId) {
    return {
      status: "error",
      message: "Missing share identifier.",
      shareUrl: currentUrl.origin,
    } satisfies LoaderData;
  }

  try {
    const res = await fetch(`https://imageplustexttoimage.mcp-ui-flows-nanobanana.workers.dev/api/payloads/${shareId}`);
    if (!res.ok) {
      const message = res.status === 404 ? "We couldn't find that welcome video." : "Unable to load shared story.";
      return {
        status: "error",
        message,
        shareUrl: `${currentUrl.origin}/share/${shareId}`,
      } satisfies LoaderData;
    }
    const json = await res.json();
    if (json?.type === "error") {
      return {
        status: "error",
        message: typeof json.message === "string" ? json.message : "Unable to load shared story.",
        shareUrl: `${currentUrl.origin}/share/${shareId}`,
      } satisfies LoaderData;
    }

    const parsed = StoryResponse.safeParse(json?.payload);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Shared story data is corrupted.",
        shareUrl: `${currentUrl.origin}/share/${shareId}`,
      } satisfies LoaderData;
    }

    return {
      status: "success",
      storyData: parsed.data,
      shareId,
      shareUrl: `${currentUrl.origin}/share/${shareId}`,
    } satisfies LoaderData;
  } catch (error) {
    console.error("Failed to load shared story", error);
    return {
      status: "error",
      message: "Something glitched while loading this welcome video.",
      shareUrl: `${currentUrl.origin}/share/${shareId}`,
    } satisfies LoaderData;
  }
}

export const meta: MetaFunction<typeof clientLoader> = ({ data }) => {
  const defaultTitle = "Welcome to Postman";
  const defaultDescription = "We can't wait to start building with you.";
  const defaultImage = "https://voyager.postman.com/illustrations/postmanaut-cheers.png";

  if (!data || data.status === "error") {
    return [
      { title: defaultTitle },
      { name: "description", content: defaultDescription },
      { property: "og:title", content: defaultTitle },
      { property: "og:description", content: data?.message ?? defaultDescription },
      { property: "og:image", content: defaultImage },
      { property: "twitter:card", content: "summary_large_image" },
      { property: "twitter:title", content: defaultTitle },
      { property: "twitter:description", content: data?.message ?? defaultDescription },
      { property: "twitter:image", content: defaultImage },
    ];
  }

  const story = data.storyData;
  const mainImage = story.mainImage ?? story.slides?.[0]?.image ?? defaultImage;
  const newHire = story.newHireName?.trim();
  const title = newHire ? `${defaultTitle}, ${newHire}!` : defaultTitle;
  const description = defaultDescription;

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: mainImage },
    { property: "og:type", content: "website" },
    { property: "twitter:card", content: "summary_large_image" },
    { property: "twitter:title", content: title },
    { property: "twitter:description", content: description },
    { property: "twitter:image", content: mainImage },
  ];
};

export function HydrateFallback() {
  return (
    <div className="bg-[#f5f1ef] tbpn-body min-h-screen text-[#1b1c1d] pb-16">
      <div className="max-w-screen-lg m-auto px-6 md:px-10 pt-20">
        <div className="mx-auto w-full max-w-[360px]">
          <div className="relative overflow-hidden rounded-[28px] mb-12 mt-8 border border-[#ffd0bf] shadow-[0_35px_80px_rgba(119,77,54,0.18)] aspect-[9/16] bg-gradient-to-br from-[#fff7f3] via-[#fff4ef] to-[#ffe9df]">
            <div className="relative flex h-full w-full items-center justify-center">
              <Loading
                compact
                title="Loading shared welcome video…"
                subtitle="Preparing assets"
                titleClassName="text-[#1b1c1d]"
                subtitleClassName="text-[#6b7076]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ShareToTwitterButton: FC<{ shareUrl: string }> = ({ shareUrl }) => {
  const handleClick = () => {
    const tweetText = "Postman welcome video ready to share with the team.";
    const intentUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(tweetText)}`;
    window.parent.postMessage(
      {
        type: "link",
        payload: {
          url: intentUrl,
        },
      },
      "*"
    );
    window.open(intentUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full px-6 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6c37] bg-[#ff6c37] text-white border border-transparent shadow-[0_12px_30px_rgba(255,108,55,0.22)] hover:bg-[#ff814f]"
    >
      <div className="relative flex items-center gap-3 text-white">
        <span className="h-2.5 w-2.5 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
        <span className="tbpn-subheadline text-xs tracking-[0.26em] uppercase text-white">Share on Twitter</span>
      </div>
    </button>
  );
};

const CreateYourOwnButton: FC = () => {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-2 rounded-full border border-[#ff6c37] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#ff6c37] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6c37] hover:bg-[#ff6c37] hover:text-white"
    >
      <span className="h-2 w-2 rounded-full bg-[#ff6c37] shadow-[0_0_10px_rgba(255,108,55,0.65)] group-hover:bg-white" />
      <span className="tbpn-subheadline">Create your own welcome video</span>
    </Link>
  );
};

export default function SharedRumorReel({ loaderData }: { loaderData: LoaderData }) {
  if (loaderData.status === "error") {
    return (
      <div className="bg-[#f5f1ef] tbpn-body min-h-screen text-[#1b1c1d] pb-16">
        <div className="max-w-screen-md m-auto px-6 md:px-10 pt-24">
          <div className="mb-10 flex justify-start">
            <CreateYourOwnButton />
          </div>
          <div className="mx-auto max-w-md rounded-[28px] border border-[#f5b9aa] bg-[#fff4f0] px-6 py-8 shadow-[0_25px_55px_rgba(244,137,98,0.18)]">
            <h1 className="tbpn-headline text-2xl">Welcome video not available</h1>
            <p className="mt-4 text-sm text-[#6b7076]">{loaderData.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const inputProps: z.infer<typeof StoryResponse> = loaderData.storyData;

  return (
    <div className="bg-[#f5f1ef] tbpn-body min-h-screen text-[#1b1c1d] pb-16">
      <div className="max-w-screen-lg m-auto px-6 md:px-10 pt-20">
        <div className="mb-10 flex justify-start">
          <CreateYourOwnButton />
        </div>
        <div className="mx-auto w-full max-w-[360px]">
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
        </div>

        <div className="mx-auto w-full max-w-[360px]">
          <ShareToTwitterButton shareUrl={loaderData.shareUrl} />
        </div>

        <Spacing />
        <Spacing />
        <Spacing />
        <Spacing />
      </div>
    </div>
  );
}
