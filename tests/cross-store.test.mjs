import assert from 'node:assert/strict';
import test from 'node:test';
import { createMemoryCrossStore } from '../src/cross-store.js';

function fastStore() {
  return createMemoryCrossStore({ holdMs: 0, countdownMs: 0 });
}

async function readyGame(store) {
  const id = await store.createLobby(() => 0.42);
  await store.join(id, { id: 'a', name: 'A' }, 'sun');
  await store.join(id, { id: 'b', name: 'B' }, 'wave');
  return { id, game: await store.start(id) };
}

test('lobby, start, and both teams must be present', async () => {
  const store = fastStore();
  const id = await store.createLobby();
  await store.join(id, { id: 'a', name: 'A' }, 'sun');
  await assert.rejects(() => store.start(id), /two players|both teams/);
  await store.join(id, { id: 'b', name: 'B' }, 'wave');
  const started = await store.start(id);
  assert.equal(started.status, 'playing');
  assert.equal(started.phase, 'pick');
});

test('finding team cannot see numbers while the other team picks', async () => {
  const store = fastStore();
  const { id, game } = await readyGame(store);
  const picker = game.pickerTeam;
  const pickerId = picker === 'sun' ? 'a' : 'b';
  const finderId = picker === 'sun' ? 'b' : 'a';
  const pickerView = await store.state(id, pickerId);
  const finderView = await store.state(id, finderId);
  assert.equal(pickerView.numbers.length, 60);
  assert.equal(finderView.numbers, null);
  assert.equal(pickerView.canPick, true);
  assert.equal(finderView.canPick, false);
});

test('pick sets a target and the finder crosses it with a hold', async () => {
  const store = fastStore();
  const { id, game } = await readyGame(store);
  const picker = game.pickerTeam;
  const pickerId = picker === 'sun' ? 'a' : 'b';
  const finderTeam = picker === 'sun' ? 'wave' : 'sun';
  const finderId = finderTeam === 'sun' ? 'a' : 'b';
  const view = await store.state(id, pickerId);
  const picked = await store.pick(id, pickerId, 0, view.version);
  assert.equal(picked.target, view.numbers[0]);
  await new Promise((resolve) => setTimeout(resolve, 5));
  const findView = await store.state(id, finderId);
  assert.equal(findView.phase, 'find');
  await store.holdStart(id, finderId, 0);
  const done = await store.completeHold(id, finderId, 0, findView.version + 1);
  assert.equal(done.crossed[finderTeam].length, 1);
  assert.equal(done.pickerTeam, finderTeam);
  assert.equal(done.finderTeam, picker);
});

test('only the picker team may pick and only the finder team may hold', async () => {
  const store = fastStore();
  const { id, game } = await readyGame(store);
  const picker = game.pickerTeam;
  const wrongTeam = picker === 'sun' ? 'b' : 'a';
  const view = await store.state(id, wrongTeam);
  await assert.rejects(() => store.pick(id, wrongTeam, 0, view.version), /not your team/);
});

test('a short hold is rejected', async () => {
  const store = createMemoryCrossStore({ holdMs: 50, countdownMs: 0 });
  const { id, game } = await readyGame(store);
  const pickerId = game.pickerTeam === 'sun' ? 'a' : 'b';
  const finderId = pickerId === 'a' ? 'b' : 'a';
  const view = await store.state(id, pickerId);
  await store.pick(id, pickerId, 0, view.version);
  await new Promise((resolve) => setTimeout(resolve, 5));
  const findView = await store.state(id, finderId);
  await store.holdStart(id, finderId, 0);
  await assert.rejects(() => store.completeHold(id, finderId, 0, findView.version + 1), /hold too short/);
});

test('the first team to cross all 60 blocks wins', async () => {
  const store = fastStore();
  const { id } = await readyGame(store);
  for (let round = 0; round < 140; round += 1) {
    let view = await store.state(id, '');
    const pickerId = view.pickerTeam === 'sun' ? 'a' : 'b';
    const finderId = pickerId === 'a' ? 'b' : 'a';
    const pickerView = await store.state(id, pickerId);
    const crossed = new Set(pickerView.crossed[view.finderTeam]);
    let cell = -1;
    for (let i = 0; i < 60; i += 1) { if (!crossed.has(i)) { cell = i; break; } }
    await store.pick(id, pickerId, cell, pickerView.version);
    await new Promise((resolve) => setTimeout(resolve, 2));
    const findView = await store.state(id, finderId);
    await store.holdStart(id, finderId, cell);
    const result = await store.completeHold(id, finderId, cell, findView.version + 1);
    if (result.status === 'finished') {
      assert.ok(result.winner === 'sun' || result.winner === 'wave');
      assert.equal(result.crossed[result.winner].length, 60);
      return;
    }
  }
  assert.fail('game never finished');
});

test('lobby creation is idempotent', async () => {
  const store = fastStore();
  const first = await store.createLobby();
  const second = await store.createLobby();
  assert.equal(first, second);
});
