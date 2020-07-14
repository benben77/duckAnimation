const { slice } = [];
const { BezierEasing } = window;

let animationId = 0;
let animationList = new Set();
const startAnimation = function(animate) {
  if (!animationId) animationId = requestAnimationFrame(updateAnimations);
  animationList.add(animate);
};
const stopAnimation = function(animate) {
  animationList.delete(animate);
  if (animationList.size === 0) {
    cancelAnimationFrame(animationId);
    animationId = 0;
  }
};
const updateAnimations = function() {
  animationList.forEach(animate => {
    animate._step();
  });
  animationId = requestAnimationFrame(updateAnimations);
};

const Easings = {
  linear(x) {
    return x;
  },
  easeInQuad(x) {
    return x * x;
  },
  easeOutQuad(x) {
    return 1 - (1 - x) * (1 - x);
  },
  easeOutBounce(x) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (x < 1 / d1) {
      return n1 * x * x;
    } else if (x < 2 / d1) {
      return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
      return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
      return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }
  },
  cubicBezier(x1, y1, x2, y2) {
    const easing = BezierEasing(x1, y1, x2, y2);
    return function(x) {
      return easing(x);
    };
  },
};

class Handler {
  constructor($elms, [from, to]) {
    this.$elms = $elms;
    this.from = from;
    this.to = to;
  }
}
class HanlderLeft extends Handler {
  render(ratio) {
    const { from, to } = this;
    this.$elms.forEach($el => $el.style.left = `${from + (to - from) * ratio}px`);
  }
}
class HanlderRotate extends Handler {
  render(ratio) {
    const { from, to } = this;
    // TODO: 不要影响其他transform属性
    this.$elms.forEach($el => $el.style.transform = `rotate(${from + (to - from) * ratio}deg)`);
  }
}
class HanlderBackGround extends Handler {
  constructor($elms, [from, to]) {
    super($elms, [from, to]);
    this.fr = parseInt(from.substr(0, 2), 16);
    this.fg = parseInt(from.substr(2, 2), 16);
    this.fb = parseInt(from.substr(4, 2), 16);
    this.tr = parseInt(to.substr(0, 2), 16);
    this.tg = parseInt(to.substr(2, 2), 16);
    this.tb = parseInt(to.substr(4, 2), 16);
  }
  render(ratio) {
    const { fr, fg, fb, tr, tg, tb } = this;
    const color = [
      Math.floor((fr + (tr - fr) * ratio)).toString(16),
      Math.floor((fg + (tg - fg) * ratio)).toString(16),
      Math.floor((fb + (tb - fb) * ratio)).toString(16),
    ].join('');
    this.$elms.forEach($el => $el.style.backgroundColor = `#${color}`);
  }
}

const handlerMap = {
  left: HanlderLeft,
  rotate: HanlderRotate,
  backgroundColor: HanlderBackGround,
};

class Animation {
  constructor($elms, obj, { duration, cb, easing = Easings.linear, animationGroup }) {
    if ($elms instanceof NodeList || $elms instanceof Array) {
      $elms = slice.call($elms);
    } else {
      $elms = [$elms];
    }

    this.handlers = Object.keys(obj).reduce((handlers, key) => {
      const handlerCls = handlerMap[key];
      if (handlerCls) {
        handlers.push(new handlerCls($elms, obj[key]));
      }
      return handlers;
    }, []);
    this.duration = duration;
    this.cb = cb;
    this.easing = easing;
    this.isPlaying = false;
    this.passedTime = 0;
    this.isReversed = false;
    this.speed = 1;
    if (animationGroup) animationGroup.add(this);
  }

  play() {
    stopAnimation(this);
    this.isPlaying = true;
    this.start = +new Date - this.passedTime;
    this.breakPoint = this.passedTime;
    startAnimation(this);
  }

  pause() {
    stopAnimation(this);
    this.isPlaying = false;
    return true;
  }
  
  reset(time = 0, stop = true) {
    this.pause();
    if (this.isReversed) this._reverseData();
    this._render(time / this.duration);
    this.passedTime = time;
    if (!stop) this.play();
  }

  reverse() {
    this._reverseData();
    const { isPlaying } = this;
    this.pause();
    if (isPlaying) this.play();
  }

  setSpeed(speed) {
    const { isPlaying } = this;
    this.pause();
    this.speed = speed;
    if (isPlaying) this.play();
  }

  destroy() {
    // TODO
  }

  _step() {
    const { duration, start, speed, breakPoint } = this;
    const now = +new Date;
    const passedTime = Math.min((now - start - breakPoint) * speed + breakPoint, duration);
    const timeRatio = passedTime / duration;
    this._render(timeRatio);
    this.passedTime = Math.min(passedTime, duration);
    if (this.isPlaying && timeRatio < 1) {
      //
    } else {
      this.isPlaying = false;
      stopAnimation(this);
    }
  }

  _render(timeRatio) {
    const { cb, easing, isReversed } = this;
    if (isReversed) timeRatio = 1 - timeRatio;
    const ratio = easing(timeRatio);
    this.handlers.forEach(handler => {
      handler.render(ratio);
    });
    cb && cb(ratio, timeRatio);
  }

  _reverseData() {
    this.passedTime = this.duration - this.passedTime;
    this.isReversed = !this.isReversed;
  }
}

const animate = function($elms, obj, opts) {
  return new Animation($elms, obj, opts);
};

window.animate = animate;

class AnimationGroup {
  constructor() {
    this.aniList = [];
  }
  add(animation) {
    this.aniList.push(animation);
  }
  destroy() {
    this.aniList.forEach(x => x.destroy());
    this.aniList.length = 0;
  }
}
['play', 'pause', 'reset', 'reverse', 'setSpeed'].forEach(method => {
  AnimationGroup.prototype[method] = function(...params) {
    this.aniList.forEach(x => x[method](...params));
  };
});

/**
 * TODO
 * 多段动画
 * 循环播放
 * BezierEasing as dependency
 * documentation
 */
