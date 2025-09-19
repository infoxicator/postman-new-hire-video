import {
  AbsoluteFill,
  Img,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface ImageTextSlideProps {
  image?: string;
  text?: string;
  slideIndex: number;
  totalSlides: number;
}

const accentColor = "#ff6c37";

export const ImageTextSlide: React.FC<ImageTextSlideProps> = ({
  image,
  text,
  slideIndex,
  totalSlides,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textLift = spring({
    frame,
    fps,
    from: 80,
    to: 0,
    config: {
      damping: 120,
      stiffness: 180,
    },
  });

  const placement = (() => {
    switch (slideIndex) {
      case 1:
        return {
          wrapper: {
            top: 120,
            bottom: "auto" as const,
            justifyContent: "flex-start" as const,
            alignItems: "flex-start" as const,
          },
          textAlign: "left" as const,
        };
      case 2:
        return {
          wrapper: {
            top: 120,
            bottom: "auto" as const,
            justifyContent: "flex-end" as const,
            alignItems: "flex-start" as const,
          },
          textAlign: "right" as const,
        };
      case 3:
        return {
          wrapper: {
            top: "50%" as const,
            left: 0,
            right: 0,
            bottom: "auto" as const,
            transform: "translateY(-50%)",
            justifyContent: "center" as const,
            alignItems: "center" as const,
          },
          textAlign: "center" as const,
          maxWidth: "70%",
        };
      default:
        return {
          wrapper: {
            justifyContent: "flex-end" as const,
            alignItems: "flex-end" as const,
          },
          textAlign: "left" as const,
        };
    }
  })();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#f5f1ef",
        overflow: "hidden",
        position: "relative",
        color: "#1b1c1d",
        fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
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
              console.warn(`Failed to load image: ${image}`);
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(180deg, #fff5ef 0%, #ffe3d2 100%)",
            }}
          />
        )}
      </AbsoluteFill>

      {/* Overlay tint */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(135deg, rgba(27,28,29,0.1), rgba(27,28,29,0.75))",
        }}
      />

      {/* Texture */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          opacity: 0.2,
          pointerEvents: "none",
        }}
      />

      {/* Text content */}
      {text && (
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            bottom: 120,
            display: "flex",
            zIndex: 5,
            ...placement.wrapper,
          }}
        >
          <div
            style={{
              transform: `translateY(${textLift}px)`,
              background: "rgba(255, 255, 255, 0.92)",
              borderRadius: 36,
              padding: "48px 54px",
              maxWidth: placement.maxWidth ?? "65%",
              border: "1px solid rgba(255,108,55,0.25)",
              boxShadow: "0 30px 60px rgba(81,46,29,0.22)",
            }}
          >
            <p
              style={{
                fontSize: 48,
                lineHeight: 1.32,
                margin: 0,
                fontWeight: 600,
                textAlign: placement.textAlign,
                color: "#1b1c1d",
              }}
            >
              {text}
            </p>
          </div>
        </div>
      )}

      {/* Slide indicator */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            zIndex: 6,
          }}
        >
          {Array.from({ length: totalSlides }).map((_, index) => (
            <div
              key={`indicator-${index}`}
              style={{
                width: 68,
                height: 6,
                backgroundColor:
                  index === slideIndex
                    ? accentColor
                    : "rgba(255, 255, 255, 0.55)",
                borderRadius: 12,
                boxShadow:
                  index === slideIndex
                    ? "0 0 18px rgba(255, 108, 55, 0.55)"
                    : undefined,
              }}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
