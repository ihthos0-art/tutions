(function () {
  'use strict';

  var script = document.currentScript;
  var title = script.dataset.title || 'Homework';
  var pages = Number(script.dataset.pages || 0);
  var back = script.dataset.back || '/';
  var pdf = script.dataset.pdf || '';
  var keyBase = script.dataset.key || title;

  var COLORS = ['#ff4d6d', '#ffd166', '#4cc9f0', '#2ecc71', '#ffffff'];
  var drawing = false;
  var color = COLORS[0];
  var size = 4;
  var erasing = false;
  var activeCanvas = null;
  var strokes = {};

  function storeKey(page) { return 'hw-ink:' + keyBase + ':' + page; }

  function load(page) {
    try { return JSON.parse(localStorage.getItem(storeKey(page)) || '[]'); }
    catch (error) { return []; }
  }

  function save(page) {
    try { localStorage.setItem(storeKey(page), JSON.stringify(strokes[page] || [])); }
    catch (error) { /* storage can be blocked */ }
  }

  function redraw(canvas) {
    var page = Number(canvas.dataset.page);
    var ctx = canvas.getContext('2d');
    var rect = canvas.getBoundingClientRect();
    var ratio = canvas.width / Math.max(1, rect.width);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    (strokes[page] || []).forEach(function (stroke) {
      ctx.strokeStyle = stroke.erase ? 'rgba(0,0,0,1)' : stroke.color;
      ctx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over';
      ctx.lineWidth = stroke.size * ratio * (stroke.erase ? 6 : 1);
      ctx.beginPath();
      stroke.points.forEach(function (point, index) {
        var x = point[0] * ratio;
        var y = point[1] * ratio;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';
  }

  function fit(canvas) {
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    redraw(canvas);
  }

  function buildPage(page) {
    var figure = document.createElement('figure');
    figure.className = 'hw-page';
    var wrap = document.createElement('div');
    wrap.className = 'hw-page-wrap';
    var img = document.createElement('img');
    img.loading = page <= 2 ? 'eager' : 'lazy';
    img.src = 'page-' + page + '.jpg';
    img.alt = title + ' page ' + page;
    var canvas = document.createElement('canvas');
    canvas.className = 'hw-ink';
    canvas.dataset.page = String(page);
    wrap.append(img, canvas);

    var caption = document.createElement('figcaption');
    caption.className = 'hw-page-cap';
    caption.textContent = 'Page ' + page + ' of ' + pages;

    figure.append(wrap, caption);
    img.addEventListener('load', function () { fit(canvas); });
    strokes[page] = load(page);
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    return figure;
  }

  function pointFrom(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return [(event.clientX - rect.left), (event.clientY - rect.top)];
  }

  function down(event) {
    if (!document.body.classList.contains('ink-on')) return;
    event.preventDefault();
    var canvas = event.currentTarget;
    canvas.setPointerCapture(event.pointerId);
    activeCanvas = canvas;
    drawing = true;
    var page = Number(canvas.dataset.page);
    strokes[page] = strokes[page] || [];
    strokes[page].push({ color: color, size: size, erase: erasing, points: [pointFrom(canvas, event)] });
    redraw(canvas);
  }

  function move(event) {
    if (!drawing || !activeCanvas) return;
    event.preventDefault();
    var page = Number(activeCanvas.dataset.page);
    var stroke = strokes[page][strokes[page].length - 1];
    stroke.points.push(pointFrom(activeCanvas, event));
    redraw(activeCanvas);
  }

  function up(event) {
    if (!drawing) return;
    drawing = false;
    if (activeCanvas) {
      var page = Number(activeCanvas.dataset.page);
      save(page);
      activeCanvas = null;
    }
    void event;
  }

  var host = document.getElementById('hw-pages');
  for (var i = 1; i <= pages; i += 1) host.appendChild(buildPage(i));

  var bar = document.createElement('div');
  bar.className = 'hw-tools';
  bar.innerHTML = [
    '<button type="button" data-act="toggle" id="hw-toggle">Scribble: off</button>',
    COLORS.map(function (c, i) {
      return '<button type="button" class="hw-swatch" data-color="' + c + '" style="background:' + c + '" aria-label="Color ' + (i + 1) + '"></button>';
    }).join(''),
    '<button type="button" data-act="eraser">Eraser</button>',
    '<button type="button" data-act="undo">Undo</button>',
    '<button type="button" data-act="clear">Clear page</button>'
  ].join('');
  document.body.appendChild(bar);

  bar.addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (!button) return;
    var act = button.dataset.act;
    if (button.dataset.color) {
      color = button.dataset.color;
      erasing = false;
      bar.querySelectorAll('.hw-swatch').forEach(function (s) { s.classList.toggle('is-active', s === button); });
      return;
    }
    if (act === 'toggle') {
      var on = !document.body.classList.contains('ink-on');
      document.body.classList.toggle('ink-on', on);
      button.textContent = 'Scribble: ' + (on ? 'on' : 'off');
      button.classList.toggle('is-active', on);
    } else if (act === 'eraser') {
      erasing = !erasing;
      button.classList.toggle('is-active', erasing);
    } else if (act === 'undo' || act === 'clear') {
      var current = document.querySelector('.hw-ink');
      var page = 1;
      var visible = Array.from(document.querySelectorAll('.hw-ink')).find(function (canvas) {
        var rect = canvas.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight;
      });
      if (visible) { page = Number(visible.dataset.page); }
      strokes[page] = strokes[page] || [];
      if (act === 'undo') strokes[page].pop();
      else strokes[page] = [];
      save(page);
      if (visible) redraw(visible);
      void current;
    }
  });

  window.addEventListener('resize', function () {
    document.querySelectorAll('.hw-ink').forEach(fit);
  });
})();
