import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type TitleSlideProps = {
  title: string;
  image?: string;
};

const fallbackGradient = "linear-gradient(180deg, #fff5ef 0%, #ffe3d2 100%)";

export const TitleSlide: React.FC<TitleSlideProps> = ({ title, image }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = title.split(" ").map((word) => ` ${word} `);
  const appearFrame = Math.round(fps * 1);
  const titleFrame = Math.max(frame - appearFrame, 0);
  const overlayOpacity = interpolate(
    frame,
    [appearFrame - 2, appearFrame + 10],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const titleOpacity = interpolate(
    frame,
    [appearFrame, appearFrame + 10],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );
  const titleTranslate = interpolate(
    frame,
    [appearFrame, appearFrame + 10],
    [30, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill
      style={{
        background: fallbackGradient,
        position: "relative",
        overflow: "hidden",
        color: "#1b1c1d",
        fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      {image ? (
        <Img
          src={image}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          onError={() => {
            console.warn(`Failed to load main image: ${image}`);
          }}
        />
      ) : null}

      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(255,245,239,0.05), rgba(27,28,29,0.78))",
          opacity: overlayOpacity,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "72px 0 0 0",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            padding: "32px 80px",
            borderRadius: 0,
            background: "linear-gradient(90deg, rgba(27,28,29,0.75), rgba(27,28,29,0.35))",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 28px 60px rgba(81,46,29,0.28)",
            width: "100%",
            opacity: titleOpacity,
            transform: `translateY(${titleTranslate}px)`
          }}
        >
          <span
            style={{
              letterSpacing: 6,
              textTransform: "uppercase",
              fontWeight: 700,
              fontSize: 32,
              backgroundColor: "rgba(255, 108, 55, 0.18)",
              color: "#ffefe8",
              padding: "12px 36px",
              borderRadius: 999,
              border: "1px solid rgba(255,108,55,0.45)",
              boxShadow: "0 18px 32px rgba(81,46,29,0.2)",
            }}
          >
            Breaking News
          </span>

          <h1
            style={{
              margin: 0,
              fontSize: 120,
              lineHeight: 1,
              fontWeight: 900,
              textTransform: "uppercase",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 12,
              textAlign: "center",
              width: "100%",
              color: "#ffffff",
            }}
          >
            {words.map((word, index) => {
              const wordFrame = Math.max(titleFrame - index * 5, 0);
              const scale = spring({
                frame: wordFrame,
                fps,
                config: {
                  damping: 120,
                  stiffness: 200,
                  mass: 0.4,
                },
              });

              return (
                <span
                  key={`word-${index}`}
                  style={{
                    display: "inline-block",
                    transform: `scale(${scale})`,
                    textShadow:
                      "0 14px 28px rgba(81,46,29,0.55), 0 0 18px rgba(255,108,55,0.38)",
                  }}
                >
                  {word}
                </span>
              );
            })}
          </h1>
        </div>
      </div>
    </AbsoluteFill>
  );
};
