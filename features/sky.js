// The sky (Beta v1.01.27): the sun rises in the east and sets in the west, glowing orange near the horizon; the moon
// comes up at night with the right phase for the Bay day; stars fill a clear night sky; clouds drift past · a few white
// ones when it is clear, many when it is cloudy, dark heavy ones in the rain and the monsoon. All of it follows the
// Bay clock and the weather.
window.BBFeatures.push(function (bb) {
  const T = bb.THREE; const R = 900;
  const g = new T.Group(); g.renderOrder = -10; bb.scene.add(g);
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return new T.CanvasTexture(c); };
  const spriteM = (map, op) => new T.SpriteMaterial({ map, transparent: true, depthWrite: false, fog: false, opacity: op == null ? 1 : op });
  // the sun: a bright disc with a soft halo
  const sunTex = tex(256, 256, (x, w) => { const gr = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,245,1)'); gr.addColorStop(.18, 'rgba(255,250,220,1)'); gr.addColorStop(.24, 'rgba(255,220,150,.55)'); gr.addColorStop(.5, 'rgba(255,190,120,.18)'); gr.addColorStop(1, 'rgba(255,170,90,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, w); });
  const sun = new T.Sprite(spriteM(sunTex)); sun.scale.set(150, 150, 1); g.add(sun);
  // the moon, drawn with its phase (redrawn once a Bay day)
  const mc = document.createElement('canvas'); mc.width = mc.height = 128; const moonTex = new T.CanvasTexture(mc); let moonDay = -1;
  function drawMoon(phase) { const x = mc.getContext('2d'); x.clearRect(0, 0, 128, 128); const gl = x.createRadialGradient(64, 64, 20, 64, 64, 64); gl.addColorStop(0, 'rgba(220,230,255,.35)'); gl.addColorStop(1, 'rgba(220,230,255,0)'); x.fillStyle = gl; x.fillRect(0, 0, 128, 128);
    x.save(); x.beginPath(); x.arc(64, 64, 26, 0, 6.283); x.clip(); x.fillStyle = '#f2efe4'; x.fillRect(0, 0, 128, 128); x.fillStyle = 'rgba(160,160,170,.35)'; for (const [a, b, r] of [[56, 56, 6], [72, 70, 5], [60, 76, 4], [74, 54, 3]]) { x.beginPath(); x.arc(a, b, r, 0, 6.283); x.fill(); }
    const k = Math.cos(phase * 6.283); x.fillStyle = 'rgba(15,20,54,.92)'; x.beginPath(); if (phase < .5) { x.arc(64, 64, 26, Math.PI / 2, -Math.PI / 2, false); x.ellipse(64, 64, Math.abs(k) * 26, 26, 0, -Math.PI / 2, Math.PI / 2, k < 0); } else { x.arc(64, 64, 26, -Math.PI / 2, Math.PI / 2, false); x.ellipse(64, 64, Math.abs(k) * 26, 26, 0, Math.PI / 2, -Math.PI / 2, k < 0); } x.fill(); x.restore(); moonTex.needsUpdate = true; }
  const moon = new T.Sprite(spriteM(moonTex)); moon.scale.set(90, 90, 1); g.add(moon);
  // stars on the dome
  const N = bb.GFX && bb.GFX.lvl === 'saver' ? 900 : 1600, sp = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const u = Math.random(), v = Math.random() * .92 + .08; const th = u * 6.283, ph = Math.acos(v); sp[i * 3] = Math.sin(ph) * Math.cos(th) * R; sp[i * 3 + 1] = Math.cos(ph) * R * .9; sp[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * R; }
  const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3)); const starM = new T.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }); const stars = new T.Points(sg, starM); g.add(stars);
  // clouds: soft puffy billboards
  const cloudTex = [0, 1, 2].map(k => tex(256, 128, (x, w, h) => { for (let i = 0; i < 9; i++) { const cx = w * (.18 + Math.random() * .64), cy = h * (.45 + Math.random() * .25), r = h * (.18 + Math.random() * .22); const gr = x.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.6, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, r, 0, 6.283); x.fill(); } }));
  const clouds = []; const NC = bb.GFX ? bb.GFX.clouds : 26; for (let i = 0; i < NC; i++) { const m = spriteM(cloudTex[i % 3], 0); const s = new T.Sprite(m); const sc = 120 + Math.random() * 160; s.scale.set(sc, sc * .45, 1); s.userData = { a: Math.random() * 6.283, r: 200 + Math.random() * 650, y: 170 + Math.random() * 90, on: 0 }; g.add(s); clouds.push(s); }
  const COVER = { clear: 5, cloudy: Math.min(18, NC), rain: Math.min(24, NC), monsoon: NC, fog: 8 }; const DARK = { clear: 1, cloudy: .85, rain: .55, monsoon: .42, fog: .8 };
  const C = new T.Color(), ORANGE = new T.Color('#ffb070'), WHITE = new T.Color('#ffffff');
  let wind = 0;
  bb.onUpdate(dt => { const cam = bb.camera; const indoor = !!bb.inside; g.visible = !indoor; if (indoor) return; g.position.set(cam.position.x, Math.max(0, cam.position.y * .2), cam.position.z);
    const h = bb.clock; const w = bb.weather || 'clear'; const cover = COVER[w] != null ? COVER[w] : 8; const dark = DARK[w] != null ? DARK[w] : .9;
    // the sun: up at 6, high at noon, down at 18; it travels from the east (+x) to the west (-x), a little to the south
    const sa = (h - 6) / 12 * Math.PI, el = Math.sin(sa), az = Math.cos(sa); const sunDir = new T.Vector3(az, Math.max(-.3, el), .35).normalize();
    sun.position.copy(sunDir).multiplyScalar(R * .95); sun.visible = el > -.08; const low = Math.max(0, 1 - el * 3); sun.material.color.copy(WHITE).lerp(ORANGE, low); sun.material.opacity = Math.min(1, (el + .08) * 6) * (w === 'rain' || w === 'monsoon' ? .15 : w === 'cloudy' ? .55 : w === 'fog' ? .35 : 1); sun.scale.setScalar(150 + low * 70);
    // the moon: opposite the sun, rising in the east in the evening
    const ma = (h - 18) / 12 * Math.PI, mel = Math.sin(ma >= 0 ? ma : ma + Math.PI * 2); const mdir = new T.Vector3(Math.cos(ma), Math.max(-.3, mel), -.25).normalize(); moon.position.copy(mdir).multiplyScalar(R * .93); moon.visible = mel > -.05 && (h >= 17 || h < 7.5);
    const day = bb.gameDay || 0; if (day !== moonDay) { moonDay = day; drawMoon(((day % 29.5) + 29.5) % 29.5 / 29.5); } moon.material.opacity = Math.min(1, (mel + .05) * 5) * (w === 'rain' || w === 'monsoon' ? .2 : w === 'cloudy' ? .6 : 1);
    // stars: only at night and fewer when cloudy
    const night = h >= 19.3 || h < 5 ? 1 : h >= 18.4 ? (h - 18.4) / .9 : h < 6 ? (6 - h) : 0; starM.opacity = Math.max(0, Math.min(1, night)) * (w === 'clear' ? .95 : w === 'cloudy' ? .35 : w === 'fog' ? .15 : .05); stars.visible = starM.opacity > .01; stars.rotation.y += dt * .002;
    // clouds
    wind += dt * (w === 'monsoon' ? 9 : w === 'rain' ? 6 : 3); const dayL = Math.max(.25, Math.min(1, el * 2 + .4)); C.setRGB(dayL * dark, dayL * dark, dayL * dark * (night > .5 ? 1.1 : 1));
    clouds.forEach((s, i) => { const U = s.userData; const want = i < cover ? (w === 'rain' || w === 'monsoon' ? .92 : .8) : 0; U.on += (want - U.on) * Math.min(1, dt * .3); s.visible = U.on > .02; if (!s.visible) return;
      const x = Math.cos(U.a) * U.r + ((wind * (.6 + i % 3 * .2)) % 1600) - 800, z = Math.sin(U.a) * U.r; s.position.set(((x + 1200) % 2400) - 1200, U.y - (w === 'rain' || w === 'monsoon' ? 40 : 0), z); s.material.opacity = U.on; s.material.color.copy(C); if (low > .3 && el > -.1) s.material.color.lerp(ORANGE, .25 * low); }); });
  bb.SKY = { sun, moon, stars, clouds };
});
