const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const scales = [];
const drawing = new Proxy({
  createLinearGradient: () => ({ addColorStop() {} }),
  createRadialGradient: () => ({ addColorStop() {} }),
  scale: (x, y) => scales.push([x, y]),
}, { get: (o, k) => k in o ? o[k] : () => {} });
const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    getContext: () => drawing, clientWidth: 1200, clientHeight: 790,
    style: {}, checked: false, classList: { add() {}, remove() {}, toggle() {} },
  });
  return elements.get(id);
}
const context = {
  document: { getElementById: element, querySelectorAll: () => [],
    querySelector: () => element('arena'), createElement: () => element('photoCache'), addEventListener() {} },
  window: { addEventListener() {} }, Image: class { complete = true; naturalWidth = 1672; naturalHeight = 940; },
  requestAnimationFrame() {}, devicePixelRatio: 1, URL: {},
};
vm.createContext(context);
for (const file of ['game.js', 'renderer.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
}
const run = code => vm.runInContext(code, context);
const begin = (mode = 2) => run(`setMode(${mode}); reset(); update(3.6); update(.01);`);
begin();
run("foot('left', 0); update(.1)");
assert(run('players[0].distance') > 0);
assert.equal(run('players[1].distance'), 0, '1P input must not move 2P');
run('jump(1); update(.2)');
assert(run('players[1].jumpHeight') > 50);
assert.equal(run('players[0].jumpHeight'), 0, '2P jump must not jump 1P');
assert.equal(run("inputFor('KeyA')[0]"), 1);
begin(1);
assert.equal(run("inputFor('KeyA')[0]"), 0, 'single player preserves A/D aliases');
assert.equal(run("inputFor('KeyW')[0]"), 0);
begin();
run('players[1].distance=LENGTH-.1; players[1].speed=8; players[1].targetSpeed=8; update(.1)');
assert.equal(run('state'), 'result');
assert.match(element('resultTitle').textContent, /2P 승리/);
begin();
run('for(const p of players){p.distance=LENGTH-.1;p.speed=8;p.targetSpeed=8} update(.1)');
assert.equal(element('resultTitle').textContent, '무승부!');
begin();
run('players[0].distance=100;players[1].distance=120;remaining=.01;update(.02)');
assert.match(element('resultTitle').textContent, /2P 승리/);
run("$('jumpMode').checked=true"); begin();
assert.equal(run('JSON.stringify(players[0].items)'), run('JSON.stringify(players[1].items)'), 'same course for both players');
run("foot('left',0)"); const effort = run('players[0].targetSpeed');
run("foot('left',0)"); assert.equal(run('players[0].targetSpeed'), effort);
run('jump(0);update(.2);pause()'); const height = run('players[0].jumpHeight');
run('update(.2)'); assert.equal(run('players[0].jumpHeight'), height);
run('pause();'); for (let i = 0; i < 100; i++) run('update(.01)');
assert.equal(run('players[0].jumpHeight'), 0);
scales.length = 0;
run('players[0].distance=0;drawCherryBackground(600,790,players[0])');
const before = scales.at(-1)[0];
run('players[0].distance=11;drawCherryBackground(600,790,players[0])');
assert(scales.at(-1)[0] > before * 1.2, 'photo movement must be visibly stronger than old 4% zoom');
for (const value of [0, 10, 21.99, 22, 22.01, 44, 100]) run(`players[0].distance=${value};render()`);
console.log('PASS: independent movement/jump, controls, 2P winner, tie, timeout, fair obstacles, pause, landing, moving photo and split rendering');

for(const length of [100,150,200]){
  run(`setDistance(${length})`);begin(1);
  assert.equal(run('LENGTH'),length);
  assert(run('players[0].items.every(o=>o.at<LENGTH)'));
  let ticks=0;
  while(run('state')==='running'&&ticks<600){
    if(ticks%5===0)run(`foot('${ticks%10===0?'left':'right'}',0)`);
    run('if(players[0].items.some(o=>o.type==="cone"&&!o.done&&o.at-players[0].distance>0&&o.at-players[0].distance<4))jump(0);update(.05)');
    ticks++;
  }
  assert.equal(run('state'),'result');
  assert.equal(run('players[0].distance'),length);
  console.log(`PASS: ${length}m selectable course finished in ${(ticks*.05).toFixed(1)} seconds`);
}
run('setDistance(175)');assert.equal(run('LENGTH'),200,'unsupported distance must be rejected');
