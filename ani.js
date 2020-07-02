const $box = document.querySelector('.box');
const $value = document.querySelector('.value');
const $time = document.querySelector('.time');
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
  left: function($el, [from, to], ratio) {
    $el.style.left = `${from + (to - from) * ratio}px`;
  },
  backgroundColor: function($el, [from, to], ratio) {
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
    $el.style.backgroundColor = `#${color}`;
  },
};

class Animation {
  constructor($el, obj, { duration, cb, easing = Easings.linear }) {
    this.$el = $el;
    this.obj = obj;
    this.keys = Object.keys(obj);
    this.duration = duration;
    this.cb = cb;
    this.easing = easing;
    this.isPlaying = false;
    this.passedTime = 0;
    this.aniId = 0;
    this.isReversed = false;
  }

  play(reset = true) {
    const { duration } = this;
    if (reset) {
      this.passedTime = 0;
      this.isReversed = false;
    }
    this.isPlaying = true;
    this.start = +new Date - this.passedTime;
    this.end = this.start + duration;
    cancelAnimationFrame(this.aniId);
    this.aniId = requestAnimationFrame(() => this.step());
  }

  step() {
    const { duration, start, end } = this;
    const now = +new Date;
    const passedTime = Math.min((now - start), duration);
    const timeRatio = passedTime / duration;
    this.render(timeRatio);
    this.passedTime = Math.min(passedTime, duration);
    if (this.isPlaying && timeRatio < 1) {
      this.aniId = requestAnimationFrame(() => this.step());
    } else {
      this.isPlaying = false;
    }
  }

  render(timeRatio) {
    const { $el, obj, keys, cb, easing, isReversed } = this;
    if (isReversed) timeRatio = 1 - timeRatio;
    const ratio = easing(timeRatio);
    keys.forEach(key => {
      const handler = handlerMap[key];
      if (handler) handler($el, obj[key], ratio);
    });
    cb && cb(ratio, timeRatio);
  }

  pause() {
    if (!this.isPlaying) return false;
    if (this.isReversed) this.reverseData();
    cancelAnimationFrame(this.aniId);
    this.isPlaying = false;
    return true;
  }

  resume() {
    if (this.isPlaying) return false;
    if (this.isReversed) this.reverseData();
    this.play(false);
  }

  stop() {
    this.pause();
    cancelAnimationFrame(this.aniId);
    this.render(0);
  }

  reverseData() {
    this.passedTime = this.duration - this.passedTime;
    this.isReversed = !this.isReversed;
  }

  reverse() {
    if (this.isReversed) return false;
    this.reverseData();
    cancelAnimationFrame(this.aniId);
    this.play(false);
  }
}

const animate = function($el, obj, opts) {
  return new Animation($el, obj, opts);
};

const ani = animate(
  $box,
  {
    left: [0, 1000],
    backgroundColor: ['ee3366', '99ee33'],
  },
  {
    easing: Easings.cubicBezier(0.5, 0, 0.5, 1),
    duration: 6000,
    cb: (ratio, timeRatio) => {
      $value.innerText = ratio.toFixed(2)
      $time.innerText = timeRatio.toFixed(2)
    },
  }
);

document.querySelector('.playBtn').addEventListener('click', () => {
  if (ani.isPlaying) {
    ani.pause();
  } else {
    ani.resume();
  }
});

document.querySelector('.replayBtn').addEventListener('click', () => {
  ani.play();
});

document.querySelector('.stopBtn').addEventListener('click', () => {
  ani.stop();
});

document.querySelector('.reverseBtn').addEventListener('click', () => {
  ani.reverse();
});


/**
 * TODO
 * mutli target
 * multi animation
 * BezierEasing as dependency
 * documentation
 * use animation api if supported
 */
