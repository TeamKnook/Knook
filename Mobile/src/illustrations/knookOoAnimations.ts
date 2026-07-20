import type { AnimationObject } from 'lottie-react-native';

type Color = [number, number, number, number];

const BLACK: Color = [0.067, 0.067, 0.067, 1];
const YELLOW: Color = [0.918, 0.702, 0.031, 1];
const WHITE: Color = [1, 1, 1, 1];

const value = <T,>(k: T) => ({ a: 0, k });
const transform = (overrides: Record<string, unknown> = {}) => ({
  ty: 'tr',
  p: value([0, 0]),
  a: value([0, 0]),
  s: value([100, 100]),
  r: value(0),
  o: value(100),
  sk: value(0),
  sa: value(0),
  ...overrides,
});

const animatedScale = (frames: { t: number; s: [number, number] }[]) => ({
  a: 1,
  k: frames.map((frame, index) => {
    const next = frames[index + 1];
    return next
      ? {
          t: frame.t,
          s: frame.s,
          e: next.s,
          i: { x: [0.67, 0.67], y: [1, 1] },
          o: { x: [0.33, 0.33], y: [0, 0] },
        }
      : { t: frame.t, s: frame.s };
  }),
});

const animatedPosition = (frames: { t: number; s: [number, number] }[]) => ({
  a: 1,
  k: frames.map((frame, index) => {
    const next = frames[index + 1];
    return next
      ? {
          t: frame.t,
          s: frame.s,
          e: next.s,
          i: { x: 0.67, y: 1 },
          o: { x: 0.33, y: 0 },
        }
      : { t: frame.t, s: frame.s };
  }),
});

const fill = (color: Color) => ({ ty: 'fl', c: value(color), o: value(100), r: 1 });
const stroke = (color: Color, width: number) => ({
  ty: 'st',
  c: value(color),
  o: value(100),
  w: value(width),
  lc: 2,
  lj: 2,
});

const ellipse = (
  name: string,
  position: [number, number],
  size: [number, number],
  options: { fill?: Color; stroke?: Color; strokeWidth?: number } = {},
) => ({
  ty: 'gr',
  nm: name,
  it: [
    { ty: 'el', p: value(position), s: value(size), nm: `${name} path` },
    ...(options.fill ? [fill(options.fill)] : []),
    ...(options.stroke ? [stroke(options.stroke, options.strokeWidth ?? 8)] : []),
    transform(),
  ],
});

const rectangle = (
  name: string,
  position: [number, number],
  size: [number, number],
  color: Color,
  radius = 0,
  rotation = 0,
) => ({
  ty: 'gr',
  nm: name,
  it: [
    { ty: 'rc', p: value([0, 0]), s: value(size), r: value(radius), nm: `${name} path` },
    fill(color),
    transform({ p: value(position), r: value(rotation) }),
  ],
});

const pathShape = (
  name: string,
  vertices: [number, number][],
  options: { closed?: boolean; fill?: Color; stroke?: Color; strokeWidth?: number },
) => ({
  ty: 'gr',
  nm: name,
  it: [
    {
      ty: 'sh',
      ks: value({
        i: vertices.map(() => [0, 0]),
        o: vertices.map(() => [0, 0]),
        v: vertices,
        c: options.closed ?? false,
      }),
      nm: `${name} path`,
    },
    ...(options.fill ? [fill(options.fill)] : []),
    ...(options.stroke ? [stroke(options.stroke, options.strokeWidth ?? 5)] : []),
    transform(),
  ],
});

const shapeLayer = (
  name: string,
  shapes: unknown[],
  layerTransform: Record<string, unknown> = {},
) => ({
  ddd: 0,
  ind: 1,
  ty: 4,
  nm: name,
  sr: 1,
  ks: {
    o: value(100),
    r: value(0),
    p: value([0, 0, 0]),
    a: value([0, 0, 0]),
    s: value([100, 100, 100]),
    ...layerTransform,
  },
  ao: 0,
  shapes,
  ip: 0,
  op: 120,
  st: 0,
  bm: 0,
});

const animation = (name: string, layers: unknown[]): AnimationObject => ({
  v: '5.12.2',
  fr: 60,
  ip: 0,
  op: 120,
  w: 120,
  h: 80,
  nm: name,
  ddd: 0,
  assets: [],
  layers,
});

const eyeArc = (name: string, offsetX: number, color: Color) => ({
  ty: 'gr',
  nm: name,
  it: [
    {
      ty: 'sh',
      ks: value({
        i: [[0, 0], [-9, 0], [-10, 9]],
        o: [[10, 9], [9, 0], [0, 0]],
        v: [[8 + offsetX, 33], [30 + offsetX, 45], [52 + offsetX, 33]],
        c: false,
      }),
      nm: `${name} path`,
    },
    stroke(color, 9),
    transform(),
  ],
});

const sleepy = animation('Knook sleepy', [
  shapeLayer(
    'Sleepy eyes',
    [eyeArc('Left eye', 0, BLACK), eyeArc('Right eye', 52, BLACK), transform()],
    {
      s: animatedScale([
        { t: 0, s: [100, 100] },
        { t: 45, s: [100, 100] },
        { t: 54, s: [100, 22] },
        { t: 64, s: [100, 100] },
        { t: 120, s: [100, 100] },
      ]),
    },
  ),
  shapeLayer('Sleepy z marks', [
    rectangle('Small z', [105, 29], [11, 4], YELLOW, 2, -18),
    rectangle('Large z', [113, 14], [14, 4], YELLOW, 2, -18),
    transform(),
  ]),
]);

const binoculars = animation('Knook binoculars', [
  shapeLayer(
    'Binocular focus',
    [
      rectangle('Bridge', [60, 40], [14, 9], YELLOW, 3),
      ellipse('Left barrel', [32, 40], [44, 44], { stroke: WHITE, strokeWidth: 9 }),
      ellipse('Right barrel', [88, 40], [44, 44], { stroke: WHITE, strokeWidth: 9 }),
      ellipse('Left lens', [32, 40], [18, 18], { stroke: WHITE, strokeWidth: 5 }),
      ellipse('Right lens', [88, 40], [18, 18], { stroke: WHITE, strokeWidth: 5 }),
      transform(),
    ],
    {
      s: animatedScale([
        { t: 0, s: [96, 96] },
        { t: 32, s: [104, 104] },
        { t: 64, s: [96, 96] },
        { t: 96, s: [104, 104] },
        { t: 120, s: [96, 96] },
      ]),
    },
  ),
]);

const heartShape = (cx: number, name: string) => ({
  ty: 'gr',
  nm: name,
  it: [
    {
      ty: 'sh',
      ks: value({
        v: [
          [cx, 62.26],
          [cx - 27.31, 33.58],
          [cx, 33.58],
          [cx + 27.31, 33.58],
        ],
        i: [
          [0, -15.03],
          [-1.36, 10.93],
          [0, -15.03],
          [0, -15.03],
        ],
        o: [
          [0, -15.03],
          [0, -15.03],
          [0, -15.03],
          [1.36, 10.93],
        ],
        c: true,
      }),
      nm: `${name} path`,
    },
    fill(YELLOW),
    transform(),
  ],
});

const hearts = animation('Knook hearts', [
  shapeLayer(
    'Heart pop',
    [heartShape(31, 'Left heart'), heartShape(88, 'Right heart'), transform()],
    {
      s: animatedScale([
        { t: 0, s: [30, 30] },
        { t: 18, s: [116, 116] },
        { t: 34, s: [100, 100] },
        { t: 92, s: [100, 100] },
        { t: 110, s: [108, 108] },
        { t: 120, s: [100, 100] },
      ]),
    },
  ),
]);

const cupid = animation('Knook cupid', [
  shapeLayer('Cupid eyes', [
    ellipse('Left eye', [32, 40], [44, 44], { stroke: BLACK, strokeWidth: 9 }),
    ellipse('Right eye', [88, 40], [44, 44], { stroke: BLACK, strokeWidth: 9 }),
    transform(),
  ]),
  shapeLayer(
    'Cupid paper plane',
    [
      pathShape('Plane body', [[86, 12], [112, 4], [103, 30], [98, 19]], {
        closed: true,
        fill: YELLOW,
      }),
      pathShape('Plane fold', [[98, 19], [112, 4]], { stroke: WHITE, strokeWidth: 2 }),
      transform(),
    ],
    {
      p: animatedPosition([
        { t: 0, s: [0, 2] },
        { t: 48, s: [0, -2] },
        { t: 96, s: [0, 2] },
        { t: 120, s: [0, 2] },
      ]),
    },
  ),
]);

const surprise = animation('Knook surprise', [
  shapeLayer(
    'Surprise pop',
    [
      ellipse('Left halo', [32, 40], [58, 58], { stroke: YELLOW, strokeWidth: 3 }),
      ellipse('Right halo', [88, 40], [58, 58], { stroke: YELLOW, strokeWidth: 3 }),
      ellipse('Left eye', [32, 40], [42, 42], { stroke: WHITE, strokeWidth: 9 }),
      ellipse('Right eye', [88, 40], [42, 42], { stroke: WHITE, strokeWidth: 9 }),
      ellipse('Left pupil', [32, 40], [16, 16], { fill: YELLOW }),
      ellipse('Right pupil', [88, 40], [16, 16], { fill: YELLOW }),
      transform(),
    ],
    {
      s: animatedScale([
        { t: 0, s: [28, 28] },
        { t: 16, s: [122, 122] },
        { t: 34, s: [100, 100] },
        { t: 120, s: [100, 100] },
      ]),
    },
  ),
]);

const unhook = animation('Knook unhook', [
  shapeLayer(
    'Unhook eyes',
    [eyeArc('Left eye', 0, BLACK), eyeArc('Right eye', 52, BLACK), transform()],
    {
      p: animatedPosition([
        { t: 0, s: [0, -4] },
        { t: 42, s: [0, 6] },
        { t: 120, s: [0, 6] },
      ]),
      s: animatedScale([
        { t: 0, s: [100, 100] },
        { t: 42, s: [94, 94] },
        { t: 120, s: [94, 94] },
      ]),
    },
  ),
]);

const mirror = animation('Knook mirror', [
  shapeLayer('Mirror frames', [
    ellipse('Left mirror', [32, 36], [44, 44], { stroke: BLACK, strokeWidth: 9 }),
    ellipse('Right mirror', [88, 36], [44, 44], { stroke: BLACK, strokeWidth: 9 }),
    rectangle('Left handle', [32, 66], [10, 18], YELLOW, 5),
    rectangle('Right handle', [88, 66], [10, 18], YELLOW, 5),
    transform(),
  ]),
  shapeLayer(
    'Mirror glint',
    [
      rectangle('Left glint', [26, 31], [18, 4], WHITE, 2, 45),
      rectangle('Right glint', [82, 31], [18, 4], WHITE, 2, 45),
      transform(),
    ],
    {
      p: animatedPosition([
        { t: 0, s: [-8, -8] },
        { t: 48, s: [8, 8] },
        { t: 96, s: [-8, -8] },
        { t: 120, s: [-8, -8] },
      ]),
    },
  ),
]);

export const knookOoAnimations = {
  sleepy,
  binoculars,
  hearts,
  cupid,
  surprise,
  unhook,
  mirror,
} as const;

export type KnookIllustrationState = keyof typeof knookOoAnimations;

export const knookIllustrationDarkStates = new Set<KnookIllustrationState>([
  'binoculars',
  'surprise',
]);
