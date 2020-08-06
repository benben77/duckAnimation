# duckAnimation

duckAnimation is a animation library.

## how use

```
// clone the repo
https://github.com/benben77/duckAnimation.git

// install deps & build
npm i
npm run build

// demo
npm run demo
```

## Basic usage

```
import { Easings, animate } from duckAnimation;

const animation = animate(
  elms,
  [
    {
      easing,
      duration,
      ...obj,
    }
  ],
  {
    cb,
    repeated,
    animationGroup,
  },
)
```

Parameters:

- elms: Node or NodeList. eg. `elms = document.querySelect('.box')`
- easing: Easing functions. eg. `easing = Easings.easeInQuad`. Default as `Easings.linear`
- duration: duration in ms. eg. `duration = 3000`
- ...obj: See *supported attributes* for more details. eg. `obj = { left: [0, 1000], rotate: [0, 360] }`
- cb: a callback function which accepts time ratio and animation ratio. eg. `cb = function(timeRatio, ratio) { console.log(timeRatio, ratio); }`
- repeated: Reapeats the animations or not. Default as `false`
- animationGroup: See *animation group* for more details

## Easing

TODO

## Custom Easing

Easing is just a function which takes an input number as time ratio which grows from 0 to 1, and returns 0 for 0, returns 1 for 1.

For example, you can support custom easing with [cubic bezier](https://github.com/gre/bezier-easing):

```
function cubicBezier(x1, y1, x2, y2) {
  const easing = BezierEasing(x1, y1, x2, y2);
  return function(x) {
    return easing(x);
  };
}

easing = cubicBezier(0.5, 0, 0.5, 1)
```

## Support attributes

TODO

## Api

`play & pause`:

```
function playOrPause() {
  if (animation.isPlaying) {
    animation.pause();
  } else {
    animation.play();
  }
}
```

`reset` jumps the animation to a certain time point:

```
const keepPlaying = true;
animation.reset(6000, !keepPlaying);
```

`reverse` reverse the animation:

```
if (!animation.isReversed) animation.reverse();
```

User `setSpeed` for speed control:

```
animation.setSpeed(animation.speed * 2);
```

## Animation Group

Animation group is just a proxy for a set of animations:

```
const animationGroup = new AnimationGroup();
const animation1 = animate(
  elms1,
  animationList1,
  { animationGroup },
);
const animation2 = animate(
  elms2,
  animationList2,
  { animationGroup },
);

animationGroup.play();
```

`play, pause, reset, reverse, setSpeed` can be called on animation group.

## TODO

- 扩展css动画属性
- 扩展默认缓动
- demo
