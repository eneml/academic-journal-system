import type { ReactElement } from "react";

// Editorial workflow has five canonical stages.
export const STAGES = ["Submission", "Review", "Editing", "Production", "Published"] as const;
export type Stage = (typeof STAGES)[number];
export type StageIndex = 0 | 1 | 2 | 3 | 4;

export interface StageStepperProps {
  /** Index of the current stage (0..4). Earlier stages render as "done". */
  stage: StageIndex;
  size?: "sm" | "lg";
  showLabels?: boolean;
}

export function StageStepper({
  stage,
  size = "sm",
  showLabels = false,
}: StageStepperProps): ReactElement {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
      <div className={`stage-stepper${size === "lg" ? " lg" : ""}`}>
        {STAGES.map((label, i) => {
          const cls = i < stage ? "done" : i === stage ? "current" : "";
          return <div key={label} className={`seg${cls ? ` ${cls}` : ""}`} aria-label={label} />;
        })}
      </div>
      {showLabels && (
        <div
          style={{
            display: "flex",
            gap: 2,
            fontSize: 10.5,
            color: "var(--muted)",
            fontFamily: "var(--sans)",
          }}
        >
          {STAGES.map((label, i) => (
            <div
              key={label}
              style={{
                width: size === "lg" ? 58 : 20,
                fontWeight: i === stage ? 600 : 400,
                color:
                  i === stage
                    ? "var(--amber-deep)"
                    : i < stage
                      ? "var(--cobalt)"
                      : "var(--muted-2)",
                letterSpacing: "0.02em",
                textAlign: "left",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
