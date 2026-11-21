(function () {
  'use strict';

  var script = document.currentScript;
  var title = script.dataset.title || 'Homework';
  var pages = Number(script.dataset.pages || 0);
  var keyBase = script.dataset.key || title;

  var COLORS = ['#000000', '#ff4d6d', '#ffd166', '#4cc9f0', '#2ecc71', '#b388ff', '#ff9f1c', '#ffffff'];
  var mode = 'off'; // off | draw | erase | text | check
  var color = COLORS[1];
  var size = 4;
  var drawing = false;
  var activeCanvas = null;
  var pageState = {};

  function stateKey(page) { return 'hw-annot:' + keyBase + ':' + page; }

  function blank() { return { strokes: [], texts: [], checks: [], fills: [] }; }

  function load(page) {
    try {
      var raw = JSON.parse(localStorage.getItem(stateKey(page)) || 'null');
      if (raw && Array.isArray(raw.strokes)) {
        if (!Array.isArray(raw.fills)) raw.fills = [];
        return raw;
      }
    } catch (error) { /* ignore */ }
    return blank();
  }

  function save(page) {
    try { localStorage.setItem(stateKey(page), JSON.stringify(pageState[page])); }
    catch (error) { /* storage can be blocked */ }
  }

  function fillRegion(canvas, img, op) {
    if (!img || !img.complete || !img.naturalWidth) return;
    var scale = Math.min(1, 900 / img.naturalWidth);
    var off = document.createElement('canvas');
    off.width = Math.max(1, Math.round(img.naturalWidth * scale));
    off.height = Math.max(1, Math.round(img.naturalHeight * scale));
    var octx = off.getContext('2d');
    octx.drawImage(img, 0, 0, off.width, off.height);
    var data = octx.getImageData(0, 0, off.width, off.height);
    var px = Math.round(op.x * off.width);
    var py = Math.round(op.y * off.height);
    if (px < 0 || py < 0 || px >= off.width || py >= off.height) return;
    var W = off.width, H = off.height;
    var src = data.data;
    var start = (py * W + px) * 4;
    var target = [src[start], src[start + 1], src[start + 2]];
    var tolerance = 46;
    var seen = new Uint8Array(W * H);
    var stack = [py * W + px];
    var rgb = (function (hex) {
      var v = hex.replace('#', '');
      return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
    })(op.color);
    var out = octx.createImageData(W, H);
    var filled = 0;
    while (stack.length) {
      var index = stack.pop();
      if (seen[index]) continue;
      seen[index] = 1;
      var offset = index * 4;
      if (Math.abs(src[offset] - target[0]) > tolerance
        || Math.abs(src[offset + 1] - target[1]) > tolerance
        || Math.abs(src[offset + 2] - target[2]) > tolerance) continue;
      out.data[offset] = rgb[0];
      out.data[offset + 1] = rgb[1];
      out.data[offset + 2] = rgb[2];
      out.data[offset + 3] = 190;
      filled += 1;
      var x = index % W;
      var y = (index - x) / W;
      if (x > 0) stack.push(index - 1);
      if (x < W - 1) stack.push(index + 1);
      if (y > 0) stack.push(index - W);
      if (y < H - 1) stack.push(index + W);
    }
    if (!filled) return;
    var mask = document.createElement('canvas');
    mask.width = W;
    mask.height = H;
    mask.getContext('2d').putImageData(out, 0, 0);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
  }

  function redraw(canvas) {
    var page = Number(canvas.dataset.page);
    var ctx = canvas.getContext('2d');
    var rect = canvas.getBoundingClientRect();
    var ratio = canvas.width / Math.max(1, rect.width);
    var img = canvas.parentElement.querySelector('img');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    (pageState[page].fills || []).forEach(function (op) { fillRegion(canvas, img, op); });
    ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    (pageState[page].strokes || []).forEach(function (stroke) {
      ctx.strokeStyle = stroke.erase ? '#000' : stroke.color;
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

  function relPoint(wrap, event) {
    var rect = wrap.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100
    };
  }

  function renderItems(page) {
    var wrap = document.querySelector('.hw-page-wrap[data-page="' + page + '"]');
    if (!wrap) return;
    wrap.querySelectorAll('.hw-text, .hw-check').forEach(function (node) { node.remove(); });

    pageState[page].texts.forEach(function (item) {
      var input = document.createElement('input');
      input.className = 'hw-text';
      input.value = item.text;
      input.placeholder = 'type…';
      input.style.left = item.x + '%';
      input.style.top = item.y + '%';
      input.style.width = Math.max(14, item.w) + '%';
      input.addEventListener('input', function () {
        item.text = input.value;
        save(page);
      });
      wrap.appendChild(input);
    });

    pageState[page].checks.forEach(function (item) {
      var box = document.createElement('button');
      box.type = 'button';
      box.className = 'hw-check' + (item.checked ? ' is-checked' : '');
      box.style.left = item.x + '%';
      box.style.top = item.y + '%';
      box.setAttribute('aria-label', 'Checkbox');
      box.setAttribute('aria-pressed', String(Boolean(item.checked)));
      box.textContent = item.checked ? '✓' : '';
      box.addEventListener('click', function (event) {
        event.stopPropagation();
        item.checked = !item.checked;
        save(page);
        renderItems(page);
      });
      wrap.appendChild(box);
    });
  }

  function buildPage(page) {
    var figure = document.createElement('figure');
    figure.className = 'hw-page';
    var wrap = document.createElement('div');
    wrap.className = 'hw-page-wrap';
    wrap.dataset.page = String(page);
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

    pageState[page] = load(page);

    canvas.addEventListener('pointerdown', function (event) {
      if (mode === 'draw' || mode === 'erase') {
        event.preventDefault();
        canvas.setPointerCapture(event.pointerId);
        activeCanvas = canvas;
        drawing = true;
        pageState[page].strokes.push({
          color: color, size: size, erase: mode === 'erase',
          points: [[event.clientX - canvas.getBoundingClientRect().left,
            event.clientY - canvas.getBoundingClientRect().top]]
        });
        redraw(canvas);
        return;
      }
      if (mode === 'fill') {
        event.preventDefault();
        var wrapRect = wrap.getBoundingClientRect();
        var pointX = (event.clientX - wrapRect.left) / wrapRect.width;
        var pointY = (event.clientY - wrapRect.top) / wrapRect.height;
        pageState[page].fills.push({ x: pointX, y: pointY, color: color });
        save(page);
        redraw(canvas);
        return;
      }
      if (mode === 'text' || mode === 'check') {
        event.preventDefault();
        var point = relPoint(wrap, event);
        if (mode === 'text') {
          pageState[page].texts.push({ x: point.x, y: point.y, w: 26, text: '' });
        } else {
          pageState[page].checks.push({ x: point.x, y: point.y, checked: false });
        }
        save(page);
        renderItems(page);
        if (mode === 'text') {
          var inputs = wrap.querySelectorAll('.hw-text');
          var last = inputs[inputs.length - 1];
          if (last) last.focus();
        }
      }
    });
    canvas.addEventListener('pointermove', function (event) {
      if (!drawing || activeCanvas !== canvas) return;
      event.preventDefault();
      var stroke = pageState[page].strokes[pageState[page].strokes.length - 1];
      stroke.points.push([event.clientX - canvas.getBoundingClientRect().left,
        event.clientY - canvas.getBoundingClientRect().top]);
      redraw(canvas);
    });
    function endStroke() {
      if (!drawing) return;
      drawing = false;
      save(page);
      activeCanvas = null;
    }
    canvas.addEventListener('pointerup', endStroke);
    canvas.addEventListener('pointercancel', endStroke);

    renderItems(page);
    return figure;
  }

  var host = document.getElementById('hw-pages');
  for (var i = 1; i <= pages; i += 1) host.appendChild(buildPage(i));

  var bar = document.createElement('div');
  bar.className = 'hw-tools';
  bar.innerHTML = [
    '<button type="button" data-mode="off" class="is-active" id="hw-off">Read</button>',
    '<button type="button" data-mode="draw" id="hw-draw">Scribble</button>',
    '<button type="button" data-mode="erase" id="hw-erase">Eraser</button>',
    '<button type="button" data-mode="text" id="hw-text">Type</button>',
    '<button type="button" data-mode="check" id="hw-check">Checkbox</button>',
    '<button type="button" data-mode="fill" id="hw-fill">Fill</button>',
    COLORS.map(function (c, index) {
      return '<button type="button" class="hw-swatch" data-color="' + c + '" style="background:' + c + '" aria-label="Color ' + (index + 1) + '"></button>';
    }).join(''),
    '<label class="hw-picker" aria-label="Pick any color"><input type="color" id="hw-color" value="' + color + '" /></label>',
    '<label class="hw-size" aria-label="Brush size"><span>Size</span><input type="range" id="hw-size" min="1" max="40" value="' + size + '" /><output id="hw-size-out">' + size + '</output></label>',
    '<button type="button" data-act="undo">Undo</button>',
    '<button type="button" data-act="clear">Clear page</button>'
  ].join('');
  document.body.appendChild(bar);

  function setMode(next) {
    mode = next;
    document.body.classList.toggle('ink-on', next === 'draw' || next === 'erase' || next === 'fill');
    document.body.classList.toggle('place-on', next === 'text' || next === 'check');
    bar.querySelectorAll('[data-mode]').forEach(function (button) {
      button.classList.toggle('is-active', button.dataset.mode === next);
    });
  }

  function visiblePage() {
    var canvases = Array.from(document.querySelectorAll('.hw-ink'));
    var found = canvases.find(function (canvas) {
      var rect = canvas.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    });
    return found ? Number(found.dataset.page) : 1;
  }

  bar.addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.mode) { setMode(button.dataset.mode); return; }
    if (button.dataset.color) {
      color = button.dataset.color;
      bar.querySelectorAll('.hw-swatch').forEach(function (swatch) {
        swatch.classList.toggle('is-active', swatch === button);
      });
      return;
    }
    var page = visiblePage();
    var state = pageState[page];
    if (button.dataset.act === 'undo') {
      if (state.checks.length) state.checks.pop();
      else if (state.texts.length) state.texts.pop();
      else if (state.strokes.length) state.strokes.pop();
      else if (state.fills.length) state.fills.pop();
    } else if (button.dataset.act === 'clear') {
      state.strokes = [];
      state.texts = [];
      state.checks = [];
      state.fills = [];
    }
    save(page);
    var canvas = document.querySelector('.hw-ink[data-page="' + page + '"]');
    if (canvas) redraw(canvas);
    renderItems(page);
  });

  document.getElementById('hw-color').addEventListener('input', function (event) {
    color = event.target.value;
  });
  document.getElementById('hw-size').addEventListener('input', function (event) {
    size = Number(event.target.value);
    document.getElementById('hw-size-out').textContent = String(size);
  });

  window.addEventListener('resize', function () {
    document.querySelectorAll('.hw-ink').forEach(fit);
  });
})();
