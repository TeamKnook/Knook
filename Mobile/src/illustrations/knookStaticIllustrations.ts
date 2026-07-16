import type { KnookIllustrationState } from './knookOoAnimations';

export interface KnookStaticIllustrationAsset {
  state: KnookIllustrationState;
  filename: string;
  productMoment: string;
  dark: boolean;
  lottieCandidate: boolean;
}

export const knookStaticIllustrations: Record<KnookIllustrationState, KnookStaticIllustrationAsset> = {
  sleepy: {
    state: 'sleepy',
    filename: 'knook-opening-splash.svg',
    productMoment: 'Opening splash',
    dark: false,
    lottieCandidate: true,
  },
  binoculars: {
    state: 'binoculars',
    filename: 'knook-private-circle.svg',
    productMoment: 'Empty Private Circle',
    dark: true,
    lottieCandidate: true,
  },
  hearts: {
    state: 'hearts',
    filename: 'knook-daily-reveal.svg',
    productMoment: 'Daily reveal',
    dark: true,
    lottieCandidate: true,
  },
  cupid: {
    state: 'cupid',
    filename: 'knook-anonymous-chat.svg',
    productMoment: 'Anonymous chat',
    dark: false,
    lottieCandidate: false,
  },
  surprise: {
    state: 'surprise',
    filename: 'knook-identity-reveal.svg',
    productMoment: 'Identity reveal',
    dark: true,
    lottieCandidate: true,
  },
  unhook: {
    state: 'unhook',
    filename: 'knook-unhook.svg',
    productMoment: 'Unhook',
    dark: false,
    lottieCandidate: true,
  },
  mirror: {
    state: 'mirror',
    filename: 'knook-profile.svg',
    productMoment: 'Profile',
    dark: false,
    lottieCandidate: false,
  },
};

export const knookStaticIllustrationDirectory = 'assets/illustrations/static';
