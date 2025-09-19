import { Player } from "@remotion/player";
import { useMemo } from "react";
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
import { useMcpUiInit } from "./utils/mcp";
import sampleResponse from "./remotion/components/Sample/response.json";
import { Loading } from "./components/Loading";

export async function clientLoader() {
  return sampleResponse;
}

export function HydrateFallback() {
  return (
    <div className="bg-[#f5f1ef] tbpn-body min-h-screen text-[#1b1c1d] pb-16">
      <div className="max-w-screen-lg m-auto px-6 md:px-10 pt-20">
        <div className="mx-auto w-full max-w-[360px]">
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
        </div>
      </div>
    </div>
  );
}

export default function Index({ loaderData }: { loaderData: z.infer<typeof StoryResponse> }) {
  const storyData = loaderData;
  useMcpUiInit();

  const inputProps: z.infer<typeof StoryResponse> = useMemo(() => {
    return storyData;
  }, [storyData]);

  return (
    <div className="bg-[#f5f1ef] tbpn-body min-h-screen text-[#1b1c1d] pb-16">
      <div className="max-w-screen-lg m-auto px-6 md:px-10 pt-20">
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
              loop
            />
          </div>
        </div>
        <RenderControls inputProps={inputProps} />
        <Spacing />
        <Spacing />
        <Spacing />
        <Spacing />
        {/* <Tips></Tips> */}
      </div>
    </div>
  );
}
