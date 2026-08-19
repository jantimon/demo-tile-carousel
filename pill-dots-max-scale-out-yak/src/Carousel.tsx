import { css, keyframes, styled } from "next-yak";
import type { ReactNode } from "react";

/* These are plain numbers rather than custom properties so that yak can inline
   them into the extracted CSS at build time. */

/** Diameter of a dot at rest. */
const DOT_SIZE = 8;
/** Width the active dot grows to. */
const PILL_WIDTH = 28;
/** Space between two neighbouring dots. */
const DOT_GAP = 8;
/** Space above and below the dot row. */
const DOTS_PADDING = 16;
/** How many dots the window shows at once. */
const MAX_DOTS = 5;
/** The slot the pill rests on away from the ends: 3rd of 5. */
const CENTRE = (MAX_DOTS + 1) / 2;
/** How far apart two neighbouring dots sit, leading edge to leading edge. */
const PITCH = DOT_SIZE + DOT_GAP;
/** The extra room a pill takes over a plain dot. */
const EXTRA = PILL_WIDTH - DOT_SIZE;
/** Width of the window: MAX_DOTS slots, plus room for the pill among them. */
const WINDOW_WIDTH = MAX_DOTS * DOT_SIZE + (MAX_DOTS - 1) * DOT_GAP + EXTRA;

/**
 * The scroller, and the clock everything else runs on.
 *
 * --carousel reads 0% at the first slide and 100% at the last.
 */
const Track = styled.ul`
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;

  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  overscroll-behavior-inline: contain;

  scroll-timeline: --carousel inline;

  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &:focus-visible {
    outline: 2px solid #0b5cff;
    outline-offset: 2px;
  }
`;

/** One slide. Full width, and the snap target the scroll settles on. */
export const CarouselSlide = styled.li`
  flex: 0 0 100%;
  scroll-snap-align: center;

  display: grid;
  place-items: center;
  aspect-ratio: 3 / 2;
  background: #eee;
  font: 2rem/1 system-ui, sans-serif;
`;

/** Publishes --carousel to the whole subtree, so the dots can read it too. */
const Root = styled.div`
  timeline-scope: --carousel;
`;

/** A dot swells to a pill halfway through its window, then shrinks back. */
const pillAnimation = keyframes`
  50% {
    width: ${PILL_WIDTH}px;
    background: #555;
  }
`;

/** For the first dot, which starts at the peak: the scroll cannot run earlier. */
const pillOutAnimation = keyframes`
  from {
    width: ${PILL_WIDTH}px;
    background: #555;
  }
`;

/** For the last dot, which ends at the peak: the scroll cannot run later. */
const pillInAnimation = keyframes`
  to {
    width: ${PILL_WIDTH}px;
    background: #555;
  }
`;

/**
 * Steps a dot aside to make room for a pill on its left.
 *
 * It stands one EXTRA to the right for as long as the pill is anywhere to its
 * left, and gives that offset up exactly as the pill arrives on it.
 */
const pushAnimation = keyframes`
  from {
    translate: ${EXTRA}px;
  }
  to {
    translate: 0;
  }
`;

/**
 * Grows a dot in as it arrives at the window edge.
 *
 * This animates `scale` while fadeOut animates `transform`, on purpose: they are
 * two properties, so both can hold a value at once. Two animations on the same
 * property would not work — the later one wins outright, at every moment, not
 * just inside its own range.
 */
const fadeInAnimation = keyframes`
  from {
    scale: 0;
  }
`;

/** Shrinks a dot away once it has been pushed off the last slot. */
const fadeOutAnimation = keyframes`
  to {
    transform: scale(0);
  }
`;

/** Slides the strip left by --shift, which Strip works out from the count. */
const shiftAnimation = keyframes`
  to {
    translate: var(--shift);
  }
`;

/**
 * The window the strip slides under, with a margin of one gap on each side.
 *
 * A dot only starts shrinking once it has been pushed off the last slot, so that
 * margin is the one place a shrinking dot is ever seen. overflow clips at the
 * padding box, so whatever sits in the margin is still drawn.
 */
const Dots = styled.div`
  height: ${DOT_SIZE}px;
  margin-inline: auto;
  margin-block: ${DOTS_PADDING}px;
  padding-inline: ${DOT_GAP}px;
  overflow: hidden;
  width: ${WINDOW_WIDTH}px;
`;

/**
 * The full row of dots, sliding one pitch per slide under the window.
 *
 * It holds still until the pill has walked out to the centre slot, and holds
 * again once the last slots are in view. Those two holds are what put the first
 * two and the last two pills on the outer positions.
 */
const Strip = styled.div<{ $slideCount: number }>`
  position: relative;
  height: ${DOT_SIZE}px;

  /* Every dot but the last takes up one pitch; the last slot has to hold a full
     pill rather than a dot. */
  width: calc(
    (${({ $slideCount }) => $slideCount} - 1) * ${PITCH}px + ${PILL_WIDTH}px
  );

  /* Slides that don't fit in the window are the ones the strip has to travel
     past, one pitch each. Negative, because it moves left.

     It has to travel as a custom property: the distance belongs to the keyframes,
     and a keyframes block is static — it is written once for the whole document
     and cannot see any component's props. */
  --shift: calc((${MAX_DOTS} - ${({ $slideCount }) => $slideCount}) * ${PITCH}px);

  animation: ${shiftAnimation} linear both;
  animation-timeline: --carousel;

  /* One slide of scroll is 100% / (count - 1) of the timeline — call it a step.
     The strip waits while the pill walks out to the centre slot, which takes
     CENTRE - 1 steps, and stops again CENTRE steps from the end so the pill can
     walk the rest of the way to the last slot on its own. */
  animation-range:
    calc((${CENTRE} - 1) * 100% / (${({ $slideCount }) => $slideCount} - 1))
    calc(
      (${({ $slideCount }) => $slideCount} - ${CENTRE}) * 100% /
        (${({ $slideCount }) => $slideCount} - 1)
    );
`;

/**
 * The four animation ranges for one dot, in the order Dot lists its animations.
 *
 * One slide of scroll is one step and indices are 0-based, so dot i peaks at i
 * steps. The pill range clamps at both ends because the scroll cannot run past
 * the first or last slide. The two fade ramps are one step long and sit outside
 * the window, so a dot holds full size right up to the moment it is pushed off
 * the last slot.
 */
const ranges = (index: number, slideCount: number) => {
  const step = 100 / (slideCount - 1);
  const span = (from: number, to: number) =>
    `${(from * step).toFixed(3)}% ${(to * step).toFixed(3)}%`;
  return [
    span(Math.max(0, index - 1), Math.min(slideCount - 1, index + 1)),
    span(Math.max(0, index - 1), index),
    span(index + CENTRE - MAX_DOTS - 1, index + CENTRE - MAX_DOTS),
    span(index + CENTRE - 1, index + CENTRE),
  ].join(", ");
};

/** On screen from the very first slide, so it has no arrival to play. */
const startDot = css`
  animation-name: ${pillAnimation}, ${pushAnimation}, none, ${fadeOutAnimation};
`;

/** Still on screen at the last slide, so it never leaves. */
const endDot = css`
  animation-name: ${pillAnimation}, ${pushAnimation}, ${fadeInAnimation}, none;
`;

/** Starts at the peak, and is never pushed — nothing is ever to its left. */
const firstDot = css`
  animation-name: ${pillOutAnimation}, none, none, ${fadeOutAnimation};
`;

/** Ends at the peak, and never leaves the window. */
const lastDot = css`
  animation-name: ${pillInAnimation}, ${pushAnimation}, ${fadeInAnimation}, none;
`;

/** Where a dot sits in the run, which decides the animations it needs. */
type Role = "first" | "last" | "start" | "end" | "middle";

/** One dot. Absolutely placed, so no dot's width can shift another. */
const Dot = styled.div<{
  $index: number;
  $slideCount: number;
  $role: Role;
}>`
  position: absolute;
  top: 0;
  left: ${({ $index }) => `${$index * PITCH}px`};
  width: ${DOT_SIZE}px;
  height: ${DOT_SIZE}px;
  border-radius: ${DOT_SIZE}px;
  background: #dcdcdc;

  animation:
    ${pillAnimation} linear both,
    ${pushAnimation} linear both,
    ${fadeInAnimation} linear both,
    ${fadeOutAnimation} linear both;
  animation-timeline: --carousel, --carousel, --carousel, --carousel;
  animation-range: ${({ $index, $slideCount }) => ranges($index, $slideCount)};

  ${({ $role }) => $role === "start" && startDot};
  ${({ $role }) => $role === "end" && endDot};
  ${({ $role }) => $role === "first" && firstDot};
  ${({ $role }) => $role === "last" && lastDot};
`;

/** Works out a dot's role from its index. */
const roleOf = (index: number, slideCount: number): Role => {
  if (index === 0) return "first";
  if (index === slideCount - 1) return "last";
  if (index < MAX_DOTS) return "start";
  if (index >= slideCount - MAX_DOTS) return "end";
  return "middle";
};

/** A scroll-snapping carousel with a windowed pill indicator under it. */
export const Carousel = ({
  slideCount,
  children,
}: {
  slideCount: number;
  children: ReactNode;
}) => (
  <Root>
    <Track tabIndex={0} aria-label="Product images">
      {children}
    </Track>
    <Dots aria-hidden="true">
      <Strip $slideCount={slideCount}>
        {Array.from({ length: slideCount }, (_, i) => (
          <Dot
            key={i}
            $index={i}
            $slideCount={slideCount}
            $role={roleOf(i, slideCount)}
          />
        ))}
      </Strip>
    </Dots>
  </Root>
);
