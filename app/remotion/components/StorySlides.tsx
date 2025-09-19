import { AbsoluteFill, Sequence, useVideoConfig, Audio, staticFile } from "remotion";
import { ImageTextSlide } from "./ImageTextSlide";
import { TitleSlide } from "./TitleSlide";
import { EndSlide } from "./EndSlide";
import { StoryData } from "../types";

interface StorySlidesProps {
  storyData: StoryData;
}

export const StorySlides: React.FC<StorySlidesProps> = ({ storyData }) => {
  const { durationInFrames, fps } = useVideoConfig();

  const slides = storyData.slides ?? [];
  const mainImage = storyData.mainImage ?? slides[0]?.image;
  const detailSlides = slides;
  const detailCount = detailSlides.length;

  const baseTitleDuration = Math.max(90, Math.floor(storyData.title.length * 1.5));
  const gapAfterTitle = detailCount > 0 ? Math.round(fps) : 0;
  const titleDuration = baseTitleDuration + gapAfterTitle;
  const endDuration = 90;
  const remainingFrames = durationInFrames - titleDuration - endDuration;
  const safeRemainingFrames = Math.max(0, remainingFrames);
  const timingSlideCount = Math.max(detailCount, 1);
  const slideDuration = Math.floor(safeRemainingFrames / timingSlideCount);
  const slideRemainder = safeRemainingFrames % timingSlideCount;

  const newHireName = storyData.newHireName?.trim() || undefined;
  const endCallToAction = newHireName ? `Welcome to Postman, ${newHireName}!` : "Welcome to Postman!";

  let sequenceOffset = titleDuration;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #fff5ef 0%, #ffe3d2 100%)",
        color: "#1b1c1d",
      }}
    >
      <Audio src={staticFile("seamles-horizons.mp3")}
        startFrom={0}
      />
      <Sequence durationInFrames={titleDuration}>
        <TitleSlide
          title={storyData.title}
          image={mainImage}
        />
      </Sequence>

      {detailSlides.map((slide, index) => {
        const extraFrame = index < slideRemainder ? 1 : 0;
        const durationForSlide = slideDuration + extraFrame;
        if (durationForSlide <= 0) {
          return null;
        }
        const from = sequenceOffset;
        sequenceOffset += durationForSlide;

        return (
          <Sequence key={`slide-${index}`} from={from} durationInFrames={durationForSlide}>
            <ImageTextSlide
              image={slide?.image}
              text={slide?.text}
              slideIndex={index}
              totalSlides={detailCount || 1}
            />
          </Sequence>
        );
      })}

      <Sequence from={durationInFrames - endDuration} durationInFrames={endDuration}>
        <EndSlide
          callToAction={endCallToAction}
          newHireName={newHireName}
          title="Thanks for watching!"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
