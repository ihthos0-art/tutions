(function () {
  'use strict';

  var ctx = null;
  var buffer = null;
  var loading = null;
  var URL_SOUND = 'assets/audio/boom.wav';

  function context() {
    if (ctx) return ctx;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    loading = fetch(URL_SOUND)
      .then(function (response) { return response.arrayBuffer(); })
      .then(function (data) { return ctx.decodeAudioData(data); })
      .then(function (decoded) { buffer = decoded; return decoded; })
      .catch(function (error) {
        console.warn('Boom sample failed to load, using synth fallback:', error);
        return null;
      });
    return ctx;
  }

  function synth() {
    if (!ctx) return;
    try {
      var t = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.5);
      gain.gain.setValueAtTime(0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.65);
      var frames = Math.floor(ctx.sampleRate * 0.35);
      var buf = ctx.createBuffer(1, frames, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
      var noise = ctx.createBufferSource();
      var ng = ctx.createGain();
      ng.gain.value = 0.3;
      noise.buffer = buf;
      noise.connect(ng).connect(ctx.destination);
      noise.start(t);
    } catch (error) {
      console.warn('Synth boom failed:', error);
    }
  }

  function playBuffer() {
    if (!buffer) return false;
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var gain = ctx.createGain();
    gain.gain.value = 1.0;
    src.connect(gain).connect(ctx.destination);
    src.start();
    return true;
  }

  function play() {
    try {
      if (!context()) { return; }
      var run = function () {
        if (playBuffer()) return;
        if (loading) loading.then(function () { if (!playBuffer()) synth(); });
        else synth();
      };
      if (ctx.state === 'running') run();
      else ctx.resume().then(run).catch(synth);
    } catch (error) {
      console.warn('Boom unavailable:', error);
    }
  }

  function unlock() {
    try {
      if (!context()) return;
      if (ctx.state === 'suspended') ctx.resume();
    } catch (error) { /* optional */ }
  }

  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('click', unlock, { passive: true });
  window.LearnFlowBoom = { play: play, unlock: unlock };
})();
