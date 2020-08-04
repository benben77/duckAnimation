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
  constructor($elms, list, { cb, repeated = false, animationGroup }) {
    if ($elms instanceof NodeList || $elms instanceof Array) {
      $elms = slice.call($elms);
    } else {
      $elms = [$elms];
    }

    let totalDuration = 0;
    this.list = list.map(({ easing = Easings.linear, duration, ...obj }) => {
      totalDuration += duration;
      const handlers = Object.keys(obj).reduce((handlers, key) => {
        const handlerCls = handlerMap[key];
        if (handlerCls) handlers.push(new handlerCls($elms, obj[key]));
        return handlers;
      }, []);
      return { easing, duration, handlers };
    });
    this.totalDuration = totalDuration;

    this.cb = cb;
    this.isPlaying = false;
    this.passedTime = 0;
    this.isReversed = false;
    this.speed = 1;
    this.repeated = repeated;
    this.currentPhase = null;
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
    this.currentPhase = null;
    this._render(time);
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

  destroy(removeElms) {
    this.pause();
    if (this.animationGroup) this.animationGroup.remove(this);
    if (removeElms) {
      this.$elms.forEach($elm => {
        $elm.remove(); // $elm.parentNode.removeChild($elm);
      });
    }
    this.$elms.length = 0;
  }

  _step() {
    const { totalDuration, start, speed, breakPoint, repeated } = this;
    const now = +new Date;
    let passedTime;
    if (repeated) {
      passedTime = ((now - start - breakPoint) * speed + breakPoint) % totalDuration;
    } else {
      passedTime = Math.min((now - start - breakPoint) * speed + breakPoint, totalDuration);
    }
    this.passedTime = Math.min(passedTime, totalDuration);
    this._render(passedTime);
    if (repeated || (this.isPlaying && passedTime < totalDuration)) {
      //
    } else {
      this.isPlaying = false;
      stopAnimation(this);
    }
  }

  _render(time) {
    const { isReversed, cb } = this;
    const list = isReversed ? this.list.slice().reverse() : this.list;
    const len = list.length - 1;
    let index = 0;
    list.forEach(({ easing, duration, handlers }, i) => {
      if (time < 0) return;
      index = i;
      let timeRatio = time > duration ? 1 : (time / duration);
      if (isReversed) timeRatio = 1 - timeRatio;
      const ratio = easing(timeRatio);
      handlers.forEach(handler => handler.render(ratio));
      cb && cb(ratio, timeRatio, isReversed ? len - i : i);
      time -= duration;
    });
    if (this.currentPhase !== index) { // 调整各个阶段的初始/结束状态
      list.forEach(({ handlers }, i) => {
        if (i > index) {
          handlers.forEach(handler => handler.render(isReversed ? 1: 0));
        } else if (i > index) {
          handlers.forEach(handler => handler.render(isReversed ? 0: 1));
        }
      });
      this.currentPhase = index;
    }
  }

  _reverseData() {
    this.passedTime = this.totalDuration - this.passedTime;
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
    if (animation.animationGroup) throw new Error('animation can only be added to one group'); // animation.animationGroup.remove(animation);
    this.aniList.push(animation);
    animation.animationGroup = this;
  }
  remove(animation) {
    const index = this.aniList.indexOf(animation);
    if (index !== -1) this.aniList.splice(index, 1);
  }
  destroy(removeElms = false) {
    this.aniList.forEach(x => {
      x.animationGroup = null;
      x.destroy(removeElms);
    });
    this.aniList.length = 0;
  }
}
['play', 'pause', 'reset', 'reverse', 'setSpeed'].forEach(method => {
  AnimationGroup.prototype[method] = function(...params) {
    this.aniList.forEach(x => x[method](...params));
  };
});

export {
  animate,
  AnimationGroup,
};

/**
 * TODO
 * BezierEasing as dependency
 * documentation
 */
