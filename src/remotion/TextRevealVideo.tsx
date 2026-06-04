/**
 * TextRevealVideo — drop ONE animated title into a video.
 * ──────────────────────────────────────────────────────────────────────────
 * A parameterized composition: choose a `variant` (any id from the registry),
 * set `text` / `subtitle`, and optionally flip to the dark theatrical palette,
 * all from the Remotion Studio sidebar. Use this when you just want a single
 * heading reveal; see TextShowcase for the full catalogue reel.
 */
import { AbsoluteFill } from 'remotion';
import { getTextAnim, TEXT_ANIM_IDS } from './textAnimations';
import { PALETTE, DARK_PALETTE } from './text/shared';
import { Fonts } from './fonts';

export type TextRevealProps = {
  variant: string;
  text: string;
  subtitle?: string;
  dark?: boolean;
};

/** Long enough to cover any single variant's enter + a comfortable hold. */
export const TEXT_REVEAL_DURATION = 120;

/** All selectable technique ids — handy for tooling / the Studio. */
export const TEXT_REVEAL_VARIANTS = TEXT_ANIM_IDS;

export const TextRevealVideo: React.FC<TextRevealProps> = ({ variant, text, subtitle, dark = false }) => {
  const anim = getTextAnim(variant);
  const Comp = anim.Component;
  return (
    <AbsoluteFill>
      <Fonts />
      <Comp text={text} subtitle={subtitle} palette={dark ? DARK_PALETTE : PALETTE} />
    </AbsoluteFill>
  );
};
