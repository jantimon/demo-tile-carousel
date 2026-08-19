import { keyframes, styled } from "next-yak";
import type { ReactNode } from "react";

/* Plain numbers, not custom properties: yak inlines them into the extracted
   CSS at build time. */
const DOT_SIZE = 8;
const PILL_WIDTH = 28;
const DOT_GAP = 8;
const DOTS_PADDING = 16;
const SLIDESHOW_LOOP = "4.5s";

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

/* A dot passes through the peak halfway through its window. */
const pillAnimation = keyframes`
  50% {
    width: ${PILL_WIDTH}px;
    background: #555;
  }
`;

/* The first and last dot only ever see half a window — the scroll stops there —
   so they start at the peak instead of passing through it. The last dot is the
   same curve played backwards, which is what animation-direction is for. */
const halfPillAnimation = keyframes`
  from {
    width: ${PILL_WIDTH}px;
    background: #555;
  }
`;

const Dots = styled.div`
  display: flex;
  align-items: center;
  gap: ${DOT_GAP}px;
  width: fit-content;
  margin-inline: auto;
  padding-block: ${DOTS_PADDING}px;

  /* Pointer devices don't swipe, so the dots have nothing to report. */
  @media (hover: hover) and (pointer: fine) {
    display: none;
  }
`;

/* Every dot runs the same keyframes off the same timeline. Only the range
   differs — the slice of the scroll this dot reacts to. Outside it the fill
   mode holds the dot small, and because the shrinking dot and the growing one
   cross at the same rate, the row never changes width. */
const Dot = styled.div<{ $index: number; $slideCount: number }>`
  flex: none;
  width: ${DOT_SIZE}px;
  height: ${DOT_SIZE}px;
  border-radius: ${DOT_SIZE}px;
  background: #dcdcdc;

  /* Animations changes the width from dot to pill to dot */
  animation: ${pillAnimation} linear both;
  animation-timeline: --carousel;
  /* One step is one slide of scroll, as a share of the whole scrollable range.
     Dot i peaks at i steps; both ends clamp, because the scroll cannot run past
     the first or last slide. */
  animation-range: ${({ $index, $slideCount }) => {
    const step = 100 / ($slideCount - 1);
    return `${Math.max(0, ($index - 1) * step).toFixed(3)}% ${Math.min(100, ($index + 1) * step).toFixed(3)}%`;
  }};

  &:first-child {
    /* The first dot starts as expanded pill not as a growing dot */
    animation-name: ${halfPillAnimation};
  }

  &:last-child {
    /* The last dot ends as expanded pill not as a shrinking dot */
    animation-name: ${halfPillAnimation};
    animation-direction: reverse;
  }
`;

/* Three holds, three moves. The last move runs past the third slide onto the
   first slide, which by then sits at the end, so the restart at 0% lands on
   identical pixels. */
const slideshowAnimation = keyframes`
  0%, 22% { translate: 0; }
  33.33%, 55.5% { translate: -100%; }
  66.66%, 88.8% { translate: -200%; }
  100% { translate: -300%; }
`;

/* Slide 1 hops to the far end while it sits off-screen left, so the track can
   keep moving in the same direction into it. step-start makes the hop instant —
   interpolating would sweep it back across the viewport. */
const firstSlideToEndAnimation = keyframes`
  0% { translate: 0; }
  40% { translate: 0; animation-timing-function: step-start; }
  100% { translate: 300%; }
`;

/* Pointer devices only: no swiping, no dots. Hover — or a tab into the track,
   which is the same thing to a keyboard user — previews the first three images
   in a loop. Keyed on the pointer rather than the viewport, so a narrow desktop
   window still previews and a wide tablet still swipes.

   The preview assumes at least three slides. */
const Root = styled.div`
  timeline-scope: --carousel;

  @media (hover: hover) and (pointer: fine) {
    overflow: hidden;

    /* the track stops being a scroll container: slides overflow into Root,
       which clips them */
    ${Track} {
      overflow: visible;
      scroll-snap-type: none;
    }

    /* Only the first three take part. Hiding the rest frees the slot at 300%
       that the first slide hops into. */
    ${Track} > ${CarouselSlide}:nth-child(n + 4) {
      display: none;
    }

    /* Asking for the animation only when motion is welcome beats declaring it
       and overriding it later: an override has to win a specificity race
       against these selectors, and quietly loses if it doesn't. */
    @media (prefers-reduced-motion: no-preference) {
      &:is(:hover, :focus-within) ${Track} {
        animation: ${slideshowAnimation} ${SLIDESHOW_LOOP} ease-in-out infinite;
      }

      &:is(:hover, :focus-within) ${Track} > ${CarouselSlide}:first-child {
        animation: ${firstSlideToEndAnimation} ${SLIDESHOW_LOOP} infinite;
      }
    }
  }
`;

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
      {Array.from({ length: slideCount }, (_, i) => (
        <Dot key={i} $index={i} $slideCount={slideCount} />
      ))}
    </Dots>
  </Root>
);
