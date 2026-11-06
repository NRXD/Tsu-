// ツcore — Fake Deafen (own button, top-left). Press = ON, press again = OFF.
// Others in the call see you deafened + muted. You still hear everyone and your mic keeps working locally.
(function () {
  'use strict';
  if (window.__N7R_FAKEDEAFEN__) return;
  window.__N7R_FAKEDEAFEN__ = true;

  let fake = false;
  let gw = null;          // Discord gateway socket
  let last = null;        // last voice-state the Discord client itself wanted (un-rewritten)
  const realSend = WebSocket.prototype.send;

  function isGateway(ws) { try { return /gateway\.discord\.gg|gateway/i.test(ws.url || ''); } catch (e) { return false; } }

  WebSocket.prototype.send = function (data) {
    try {
      if (typeof data === 'string' && data.charCodeAt(0) === 123 && data.indexOf('"op":4') !== -1 && isGateway(this)) {
        const m = JSON.parse(data);
        if (m && m.op === 4 && m.d) {
          gw = this;
          if (m.d.channel_id) {
            last = JSON.parse(JSON.stringify(m.d));            // remember what Discord really wanted
            if (fake) { m.d.self_deaf = true; m.d.self_mute = true; data = JSON.stringify(m); }
          } else {
            last = null;                                         // left voice
          }
        }
      }
    } catch (e) {}
    return realSend.call(this, data);
  };

  function pushState(deaf, mute) {
    if (!gw || gw.readyState !== 1 || !last) return false;
    const d = Object.assign({}, last, { self_deaf: deaf, self_mute: mute });
    try { realSend.call(gw, JSON.stringify({ op: 4, d })); return true; } catch (e) { return false; }
  }

  // ── button (top-left, opposite of the ツcore button) ──
  const btn = document.createElement('button');
  btn.id = 'n7r-fakedeafen';
  btn.type = 'button';
  const css = document.createElement('style');
  css.textContent = `
#n7r-fakedeafen{position:fixed;top:calc(18px + env(safe-area-inset-top,0px));left:18px;z-index:999999;display:flex;align-items:center;gap:10px;
padding:14px 24px;border-radius:50px;border:2px solid rgba(255,255,255,.5);color:#fff;font:800 16px 'Segoe UI',system-ui,sans-serif;letter-spacing:.03em;
background:linear-gradient(135deg,#2b2f3a,#12141a);box-shadow:0 8px 24px rgba(0,0,0,.7);cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
#n7r-fakedeafen.on{background:linear-gradient(135deg,#ff3b4e,#a00a1c);border-color:#fff;box-shadow:0 0 22px rgba(255,59,78,.75),0 8px 24px rgba(0,0,0,.7)}
#n7r-fakedeafen .st{font-size:12px;padding:3px 8px;border-radius:20px;background:rgba(255,255,255,.18)}
#n7r-fd-toast{position:fixed;top:calc(78px + env(safe-area-inset-top,0px));left:18px;z-index:999999;max-width:260px;padding:10px 14px;border-radius:12px;background:#000d;color:#fff;font:600 13px system-ui,sans-serif;display:none}`;
  function render() {
    btn.classList.toggle('on', fake);
    btn.innerHTML = '<span>🎧 Fake Deafen</span><span class="st">' + (fake ? 'ON' : 'OFF') + '</span>';
  }
  let tt = null;
  function toast(msg) {
    let t = document.getElementById('n7r-fd-toast');
    if (!t) { t = document.createElement('div'); t.id = 'n7r-fd-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.style.display = 'block';
    clearTimeout(tt); tt = setTimeout(() => { t.style.display = 'none'; }, 3500);
  }
  btn.addEventListener('click', () => {
    if (!fake) {
      if (!last) { toast('Join a voice channel first, then press the mute button once in Discord so I can see the channel. Then press again.'); return; }
      fake = true; render();
      toast(pushState(true, true) ? '🎧 Fake Deafen ON — others see you deafened' : '⚠ Could not reach Discord, press again');
    } else {
      fake = false; render();
      toast(pushState(!!(last && last.self_deaf), !!(last && last.self_mute)) ? '🎧 Fake Deafen OFF' : '🎧 OFF');
    }
  });

  function mount() {
    if (!document.body) return setTimeout(mount, 300);
    document.head.appendChild(css); document.body.appendChild(btn); render();
  }
  mount();
})();
