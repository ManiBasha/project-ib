// Speedboats (Beta v2.04.00): an original fibreglass speedboat for the story's water missions (harbour chases, river
// runs, the crossing to the Andamans). It moves only on water (core-3 checks spec.boat) and bobs on the waves.
window.BBFeatures.push(function (bb) {
  const T = bb.THREE; if (!bb.SPEC || !bb.SPEC.speedboat) return;
  const L = c => bb.LMat(c);
  bb.SPEC.speedboat.build = (colorMat) => { const g = new T.Group(); const hullM = colorMat || L('#f4f1ea'), stripe = L('#1f6fb5'), dark = L('#1b1b1f'), seat = L('#c9a27a');
    const hull = new T.Mesh(new T.BoxGeometry(2.2, .8, 4.6), hullM); hull.position.set(0, .35, -.4); g.add(hull);
    const bow = new T.Mesh(new T.CylinderGeometry(0, 1.1, 1.8, 4, 1), hullM); bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.scale.set(1, 1, .45); bow.position.set(0, .45, 2.75); g.add(bow);
    const st = new T.Mesh(new T.BoxGeometry(2.24, .12, 4.62), stripe); st.position.set(0, .55, -.4); g.add(st);
    const deck = new T.Mesh(new T.BoxGeometry(1.9, .08, 3.6), seat); deck.position.set(0, .78, -.6); g.add(deck);
    const ws = new T.Mesh(new T.BoxGeometry(1.8, .5, .06), new T.MeshPhongMaterial({ color: 0x9fd3e8, transparent: true, opacity: .6 })); ws.position.set(0, 1.05, .9); ws.rotation.x = -.5; g.add(ws);
    const wheel = new T.Mesh(new T.TorusGeometry(.18, .03, 6, 12), dark); wheel.position.set(-.4, 1.05, .45); wheel.rotation.x = -.6; g.add(wheel);
    const motor = new T.Mesh(new T.BoxGeometry(.5, .9, .5), dark); motor.position.set(0, .45, -2.8); g.add(motor);
    for (const sx of [-.5, .5]) { const s = new T.Mesh(new T.BoxGeometry(.6, .35, .6), seat); s.position.set(sx, .98, -.3); g.add(s); }
    g.userData.wheels = []; g.userData.boat = true; return g; };
  // bob on the water and leave a little white wake
  const wakeM = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .28, depthWrite: false }); const wakeG = new T.CircleGeometry(2.5, 3); wakeG.scale(.5, 1.6, 1); wakeG.rotateX(-Math.PI / 2);
  bb.onUpdate((dt, now) => { for (const v of bb.vehicles) { if (!v.spec || !v.spec.boat) continue; const U = v.m.userData; if (!U.wake) { U.wake = new T.Mesh(wakeG, wakeM); U.wake.position.set(0, .05, -5); v.m.add(U.wake); }
      U.wake.visible = Math.abs(v.v) > 3; U.wake.scale.z = Math.min(2.5, Math.abs(v.v) / 8); v.m.rotation.x = -Math.min(.12, Math.abs(v.v) * .004) + Math.sin(now * 2.1 + v.pos.x) * .02; v.m.rotation.z = Math.sin(now * 1.7 + v.pos.z) * .03; } });
  bb.BOATS = { waterSpotNear(x, z, r) { for (let rr = 10; rr < (r || 1500); rr += 15) for (let a = 0; a < 6.28; a += .25) { const px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr; if (bb.isWater(px, pz) && bb.isWater(px + 6, pz) && bb.isWater(px - 6, pz) && bb.isWater(px, pz + 6) && bb.isWater(px, pz - 6) && !(bb.isForeign && bb.isForeign(px, pz))) return { x: px, z: pz }; } return null; } };
});
