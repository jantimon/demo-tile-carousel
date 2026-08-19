import { css, keyframes, styled } from "next-yak";
import type { ReactNode } from "react";

/* Plain numbers, not custom properties: yak inlines them into the extracted
   CSS at build time. */
const DOT_SIZE = 8;
const PILL_WIDTH = 28;
const DOT_GAP = 8;
const DOTS_PADDING = 16;

/* how many dots the window shows at once, and the slot the pill rests on away
   from the ends: 3rd of 5 */
const MAX_DOTS = 5;
const CENTRE = (MAX_DOTS + 1) / 2;

/* how far apart two dots sit, and the extra room a pill asks for */
const PITCH = DOT_SIZE + DOT_GAP;
const EXTRA = PILL_WIDTH - DOT_SIZE;
const WINDOW_WIDTH = MAX_DOTS * DOT_SIZE + (MAX_DOTS - 1) * DOT_GAP + EXTRA;

/* The scroll position is the clock: --carousel runs 0% at the first slide to
   100% at the last. Root publishes the name with timeline-scope so the dots —
   siblings of the track, not children — can read it. */
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

export const CarouselSlide = styled.li`
  flex: 0 0 100%;
  scroll-snap-align: center;

  display: grid;
  place-items: center;
  aspect-ratio: 3 / 2;
  background: #eee;
  font: 2rem/1 system-ui, sans-serif;
`;

const Root = styled.div`
  timeline-scope: --carousel;
`;

/* A dot passes through the peak halfway through its window. The first and last
   dot only ever see half a window — the scroll stops there — so they start or
   end at the peak instead of passing through it. */
const pillAnimation = keyframes`
  50% {
    width: ${PILL_WIDTH}px;
    background: #555;
  }
`;

const pillOutAnimation = keyframes`
  from {
    width: ${PILL_WIDTH}px;
    background: #555;
  }
`;

const pillInAnimation = keyframes`
  to {
    width: ${PILL_WIDTH}px;
    background: #555;
  }
`;

/* A dot stands one EXTRA to the right for as long as the pill is somewhere to
   its left, and gives that offset up exactly as the pill arrives on it. */
const pushAnimation = keyframes`
  from {
    translate: ${EXTRA}px;
  }
  to {
    translate: 0;
  }
`;

/* fadeIn animates `scale` and fadeOut animates `transform`, on purpose: they
   are two properties, so both can hold a value at once. Two animations on the
   same property would not work — the later one wins outright, at every moment,
   not just inside its own range. */
const fadeInAnimation = keyframes`
  from {
    scale: 0;
  }
`;

const fadeOutAnimation = keyframes`
  to {
    transform: scale(0);
  }
`;

/* How far the strip travels depends on the slide count, and keyframes are
   static — so the distance arrives as a custom property. */
const shiftAnimation = keyframes`
  to {
    translate: var(--shift);
  }
`;

/* The window holds MAX_DOTS slots plus the room a pill needs, and a margin of one
   gap on each side. A dot only starts shrinking once it has been pushed off the
   last slot, so that margin is the one place a shrinking dot is ever seen.
   overflow clips at the padding box, so whatever sits in there is still drawn. */
const Dots = styled.div`
  height: ${DOT_SIZE}px;
  margin-inline: auto;
  margin-block: ${DOTS_PADDING}px;
  padding-inline: ${DOT_GAP}px;
  overflow: hidden;
  width: ${WINDOW_WIDTH}px;
`;

/* Holds still until the pill has walked out to the middle slot, then slides one
   pitch per slide, then holds again for the last slots. Those two holds are what
   put the first two and the last two pills on the outer positions. */
const Strip = styled.div<{ $slideCount: number }>`
  position: relative;
  height: ${DOT_SIZE}px;
  width: ${({ $slideCount }) =>
    `${$slideCount * DOT_SIZE + ($slideCount - 1) * DOT_GAP + EXTRA}px`};
  --shift: ${({ $slideCount }) => `${-($slideCount - MAX_DOTS) * PITCH}px`};

  animation: ${shiftAnimation} linear both;
  animation-timeline: --carousel;
  animation-range: ${({ $slideCount }) => {
    const step = 100 / ($slideCount - 1);
    return `${((CENTRE - 1) * step).toFixed(3)}% ${(($slideCount - CENTRE) * step).toFixed(3)}%`;
  }};
`;

/* One slide of scroll is one step, and indices are 0-based, so dot i peaks at i
   steps. Four ranges in the order the animations are listed below. The pill
   range clamps at both ends because the scroll cannot run past the first or last
   slide; the two fade ramps are one step long and sit outside the window, so a
   dot holds full size right up to the moment it is pushed off the last slot. */
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

/* Which animations a dot actually needs. The first MAX_DOTS dots are on screen
   from the very first slide, so they have no arrival to play; the last MAX_DOTS
   never leave. Nothing is ever left of the very first dot, so it is never
   pushed either. */
const startDot = css`
  animation-name: ${pillAnimation}, ${pushAnimation}, none, ${fadeOutAnimation};
`;

const endDot = css`
  animation-name: ${pillAnimation}, ${pushAnimation}, ${fadeInAnimation}, none;
`;

const firstDot = css`
  animation-name: ${pillOutAnimation}, none, none, ${fadeOutAnimation};
`;

const lastDot = css`
  animation-name: ${pillInAnimation}, ${pushAnimation}, ${fadeInAnimation}, none;
`;

type Role = "first" | "last" | "start" | "end" | "middle";

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

const roleOf = (index: number, slideCount: number): Role => {
  if (index === 0) return "first";
  if (index === slideCount - 1) return "last";
  if (index < MAX_DOTS) return "start";
  if (index >= slideCount - MAX_DOTS) return "end";
  return "middle";
};

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
