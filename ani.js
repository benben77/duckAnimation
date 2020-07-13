const { slice } = [];
const { BezierEasing } = window;

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

const handlerMap = {
  left: function($elms, [from, to], ratio) {
    $elms.style.left = `${from + (to - from) * ratio}px`;
  },
  rotate: function($elms, [from, to], ratio) {
    // TODO: 不要影响其他transform属性
    $elms.style.transform = `rotate(${from + (to - from) * ratio}deg)`;
  },
  backgroundColor: function($elms, [from, to], ratio) {
    const fr = parseInt(from.substr(0, 2), 16);
    const fg = parseInt(from.substr(2, 2), 16);
    const fb = parseInt(from.substr(4, 2), 16);
    const tr = parseInt(to.substr(0, 2), 16);
    const tg = parseInt(to.substr(2, 2), 16);
    const tb = parseInt(to.substr(4, 2), 16);
    const color = [
      Math.floor((fr + (tr - fr) * ratio)).toString(16),
      Math.floor((fg + (tg - fg) * ratio)).toString(16),
      Math.floor((fb + (tb - fb) * ratio)).toString(16),
    ].join('');
    $elms.style.backgroundColor = `#${color}`;
  },
};

class Animation {
  constructor($elms, obj, { duration, cb, easing = Easings.linear, animationGroup }) {
    if ($elms instanceof NodeList || $elms instanceof Array) {
      $elms = slice.call($elms);
    } else {
      $elms = [$elms];
    }
    this.$elms = $elms;
    this.obj = obj;
    this.keys = Object.keys(obj);
    this.duration = duration;
    this.cb = cb;
    this.easing = easing;
    this.isPlaying = false;
    this.passedTime = 0;
    this.aniId = 0;
    this.isReversed = false;
    if (animationGroup) animationGroup.add(this);
  }

  play() {
    const { duration } = this;
    this.isPlaying = true;
    this.start = +new Date - this.passedTime;
    this.end = this.start + duration;
    cancelAnimationFrame(this.aniId);
    this.aniId = requestAnimationFrame(() => this._step());
  }

  pause() {
    cancelAnimationFrame(this.aniId);
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

  destroy() {
    // TODO
  }

  _step() {
    const { duration, start, end } = this;
    const now = +new Date;
    const passedTime = Math.min((now - start), duration);
    const timeRatio = passedTime / duration;
    this._render(timeRatio);
    this.passedTime = Math.min(passedTime, duration);
    if (this.isPlaying && timeRatio < 1) {
      this.aniId = requestAnimationFrame(() => this._step());
    } else {
      this.isPlaying = false;
    }
  }

  _render(timeRatio) {
    const { $elms, obj, keys, cb, easing, isReversed } = this;
    if (isReversed) timeRatio = 1 - timeRatio;
    const ratio = easing(timeRatio);
    keys.forEach(key => {
      const handler = handlerMap[key];
      if (handler) $elms.forEach($elm => handler($elm, obj[key], ratio));
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
['play', 'pause', 'reset', 'reverse'].forEach(method => {
  AnimationGroup.prototype[method] = function(...params) {
    this.aniList.forEach(x => x[method](...params));
  };
});

/**
 * TODO
 * 单一定时器
 * handler实例化
 * 多段动画
 * 速度控制
 * 循环播放
 * BezierEasing as dependency
 * documentation
 */
