/**
 * Liquid Physics Button Engine
 * Adapted from CodePen — only active on hover, static otherwise.
 * No rAF loop runs until mouseenter; loop stops on mouseleave.
 */
(function () {
  'use strict';

  class Spring {
    constructor(val, tension, friction) {
      this.val = val;
      this.target = val;
      this.vel = 0;
      this.tension = tension;
      this.friction = friction;
    }
    update() {
      const force = (this.target - this.val) * this.tension;
      this.vel += force;
      this.vel *= this.friction;
      this.val += this.vel;
    }
  }

  class LiquidEngine {
    constructor(wrapper) {
      this.wrapper = wrapper;
      this.btn = wrapper.querySelector('.water-btn');
      if (!this.btn) return;

      this.displaceMap = document.getElementById('displace-map');

      // 9 Independent Springs
      this.tiltX = new Spring(0, 0.05, 0.82);
      this.tiltY = new Spring(0, 0.05, 0.82);
      this.scaleX = new Spring(1, 0.1, 0.72);
      this.scaleY = new Spring(1, 0.1, 0.72);
      this.glareX = new Spring(0, 0.06, 0.85);
      this.glareY = new Spring(0, 0.06, 0.85);
      this.causticX = new Spring(0, 0.04, 0.88);
      this.causticY = new Spring(0, 0.04, 0.88);
      this.wobble = new Spring(0, 0.08, 0.75);

      this.isHovering = false;
      this.isPressed = false;
      this.animating = false;

      this._onMouseMove = this.onMouseMove.bind(this);
      this._onMouseEnter = this.onMouseEnter.bind(this);
      this._onMouseLeave = this.onMouseLeave.bind(this);
      this._onMouseDown = this.onMouseDown.bind(this);
      this._onMouseUp = this.onMouseUp.bind(this);

      this.bindEvents();
    }

    bindEvents() {
      this.btn.addEventListener('mouseenter', this._onMouseEnter);
      this.btn.addEventListener('mouseleave', this._onMouseLeave);
      this.btn.addEventListener('mousedown', this._onMouseDown);
      window.addEventListener('mouseup', this._onMouseUp);
    }

    startLoop() {
      if (this.animating) return;
      this.animating = true;
      this.render();
    }

    stopLoop() {
      this.animating = false;
    }

    onMouseMove(e) {
      if (!this.isHovering) return;
      const rect = this.wrapper.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      if (!this.isPressed) {
        this.tiltX.target = -(dy / rect.height) * 20;
        this.tiltY.target = (dx / rect.width) * 20;
        this.glareX.target = (dx / rect.width) * 40;
        this.glareY.target = (dy / rect.height) * 40;
        this.causticX.target = -(dx / rect.width) * 25;
        this.causticY.target = -(dy / rect.height) * 25;
      }
    }

    onMouseEnter() {
      this.isHovering = true;
      if (!this.isPressed) {
        this.scaleX.target = 1.05;
        this.scaleY.target = 1.05;
      }
      document.addEventListener('mousemove', this._onMouseMove);
      this.startLoop();
    }

    onMouseLeave() {
      this.isHovering = false;
      if (!this.isPressed) {
        this.scaleX.target = 1;
        this.scaleY.target = 1;
        this.tiltX.target = 0;
        this.tiltY.target = 0;
        this.glareX.target = 0;
        this.glareY.target = 0;
        this.causticX.target = 0;
        this.causticY.target = 0;
      }
      document.removeEventListener('mousemove', this._onMouseMove);
      // Keep loop running briefly to animate back to rest
      // Stop after springs settle
    }

    onMouseDown() {
      if (!this.isHovering) return;
      this.isPressed = true;
      this.scaleX.target = 1.15;
      this.scaleY.target = 0.85;
      this.wobble.target = 15;
      this.scaleX.vel = 0.08;
      this.scaleY.vel = -0.08;
      this.wobble.vel = 12;
    }

    onMouseUp() {
      if (!this.isPressed) return;
      this.isPressed = false;
      if (this.isHovering) {
        this.scaleX.target = 1.05;
        this.scaleY.target = 1.05;
      } else {
        this.scaleX.target = 1;
        this.scaleY.target = 1;
        this.tiltX.target = 0;
        this.tiltY.target = 0;
        this.glareX.target = 0;
        this.glareY.target = 0;
        this.causticX.target = 0;
        this.causticY.target = 0;
      }
      this.wobble.target = 0;
      this.scaleX.vel = -0.15;
      this.scaleY.vel = 0.15;
      this.wobble.vel = -22;
    }

    render() {
      if (!this.animating) return;

      this.tiltX.update();
      this.tiltY.update();
      this.scaleX.update();
      this.scaleY.update();
      this.glareX.update();
      this.glareY.update();
      this.causticX.update();
      this.causticY.update();
      this.wobble.update();

      this.btn.style.setProperty('--tx', '0');
      this.btn.style.setProperty('--ty', '0');
      this.btn.style.setProperty('--sx', this.scaleX.val);
      this.btn.style.setProperty('--sy', this.scaleY.val);
      this.btn.style.setProperty('--tilt-x', this.tiltX.val);
      this.btn.style.setProperty('--tilt-y', this.tiltY.val);

      const glareRadial = this.btn.querySelector('.glare-radial');
      if (glareRadial) {
        glareRadial.style.setProperty('--glare-x', this.glareX.val);
        glareRadial.style.setProperty('--glare-y', this.glareY.val);
      }

      const glareSharp = this.btn.querySelector('.glare-sharp');
      if (glareSharp) {
        glareSharp.style.setProperty('--glare-x', this.glareX.val);
        glareSharp.style.setProperty('--glare-y', this.glareY.val);
      }

      if (this.displaceMap) {
        this.displaceMap.setAttribute('scale', this.wobble.val);
      }

      // Stop loop when not hovering and all springs are nearly at rest
      if (!this.isHovering && !this.isPressed) {
        const maxVel = Math.max(
          Math.abs(this.tiltX.vel), Math.abs(this.tiltY.vel),
          Math.abs(this.scaleX.vel), Math.abs(this.scaleY.vel),
          Math.abs(this.glareX.vel), Math.abs(this.glareY.vel),
          Math.abs(this.causticX.vel), Math.abs(this.causticY.vel),
          Math.abs(this.wobble.vel)
        );
        const maxDrift = Math.max(
          Math.abs(this.tiltX.val), Math.abs(this.tiltY.val),
          Math.abs(this.scaleX.val - 1), Math.abs(this.scaleY.val - 1),
          Math.abs(this.glareX.val), Math.abs(this.glareY.val),
          Math.abs(this.causticX.val), Math.abs(this.causticY.val),
          Math.abs(this.wobble.val)
        );
        if (maxVel < 0.001 && maxDrift < 0.001) {
          this.animating = false;
          return;
        }
      }

      requestAnimationFrame(() => this.render());
    }
  }

  // Initialize all liquid buttons on the page
  function init() {
    document.querySelectorAll('.water-wrapper').forEach(wrapper => {
      new LiquidEngine(wrapper);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();