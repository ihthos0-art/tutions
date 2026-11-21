import assert from 'node:assert/strict';
import test from 'node:test';
import { createMemoryCrossStore } from '../src/cross-store.js';

function fastStore() {
  return createMemoryCrossStore({ holdMs: 0, wrongMs: 0 });
}

async function ready(store) {
  const id = await store.createLobby(() => 0.42);
  await store.join(id, { id: 'a', name: 'A' }, 'sun');
  await store.join(id, { id: 'b', name: 'B' }, 'wave');
  return { id, game: await store.start(id) };
}

function pickerIds(game) {
  return {
    pickerId: game.pickerTeam === 'sun' ? 'a' : 'b',
    finderId: game.finderTeam === 'sun' ? 'a' : 'b'
  };
}

test('both teams are required to start', async () => {
  const store = fastStore();
  const id = await store.createLobby();
  await store.join(id, { id: 'a', name: 'A' }, 'sun');
  await assert.rejects(() => store.start(id), /both teams|two players/);
});

test('only the picking team sees and sets the secret', async () => {
  const store = fastStore();
  const { id, game } = await ready(store);
  const { pickerId, finderId } = pickerIds(game);
  const picker = await store.state(id, pickerId);
  const finder = await store.state(id, finderId);
  assert.equal(picker.numbers.length, 50);
  assert.equal(picker.canPick, true);
  assert.equal(finder.canPick, false);
  assert.equal(finder.numbers.length, 50, 'numbers visible to both teams');
  assert.equal(finder.secretNumber, null, 'no target yet before a pick');
  const picked = await store.pick(id, pickerId, 3, picker.version);
  assert.equal(picked.secretNumber, picker.numbers[3]);
  const finderAfter = await store.state(id, finderId);
  assert.equal(finderAfter.secretNumber, picked.secretNumber, 'target number visible to the hunter');
  assert.equal(finderAfter.phase, 'cross');
  assert.equal(finderAfter.numbers.length, 50, 'board visible once the hunt starts');
});

test('finder finds the secret and stops the crossing', async () => {
  const store = fastStore();
  const { id, game } = await ready(store);
  const { pickerId, finderId } = pickerIds(game);
  const pickerView = await store.state(id, pickerId);
  const picked = await store.pick(id, pickerId, 4, pickerView.version);
  const finderView = await store.state(id, finderId);
  const before = finderView.pickerTeam;
  const result = await store.guess(id, finderId, picked.secretCell);
  assert.equal(result.stopped, true);
  assert.notEqual(result.game.pickerTeam, before);
  assert.equal(result.game.phase, 'pick');
  assert.equal(result.game.round, 2);
});

test('a wrong guess fails and starts a cooldown', async () => {
  const store = createMemoryCrossStore({ holdMs: 0, wrongMs: 5000 });
  const { id, game } = await ready(store);
  const { pickerId, finderId } = pickerIds(game);
  const pickerView = await store.state(id, pickerId);
  const picked = await store.pick(id, pickerId, 4, pickerView.version);
  const wrong = picked.secretCell === 0 ? 1 : 0;
  await assert.rejects(() => store.guess(id, finderId, wrong), /wrong number/);
  await assert.rejects(() => store.guess(id, finderId, picked.secretCell), /wait a moment/);
});

test('picker crosses with a verified hold and reaches the win at 50', async () => {
  const store = fastStore();
  const { id, game } = await ready(store);
  const { pickerId } = pickerIds(game);
  let view = await store.state(id, pickerId);
  view = await store.pick(id, pickerId, 0, view.version);
  const team = view.pickerTeam;
  for (let cell = 0; cell < 50; cell += 1) {
    const start = await store.holdStart(id, pickerId, cell);
    const done = await store.completeHold(id, pickerId, cell, start.version);
    view = done;
    if (view.status === 'finished') break;
  }
  assert.equal(view.status, 'finished');
  assert.equal(view.winner, team);
  assert.equal(view.counts[team], 50);
});

test('a short hold is rejected', async () => {
  const store = createMemoryCrossStore({ holdMs: 200, wrongMs: 0 });
  const { id, game } = await ready(store);
  const { pickerId } = pickerIds(game);
  let view = await store.state(id, pickerId);
  view = await store.pick(id, pickerId, 0, view.version);
  const start = await store.holdStart(id, pickerId, 0);
  await assert.rejects(() => store.completeHold(id, pickerId, 0, start.version), /hold too short/);
});

test('kicking only works in the lobby', async () => {
  const store = fastStore();
  const id = await store.createLobby();
  await store.join(id, { id: 'a', name: 'A' }, 'sun');
  await store.join(id, { id: 'b', name: 'B' }, 'wave');
  const kicked = await store.kick(id, 'b');
  assert.equal(kicked.players.length, 1);
  await store.join(id, { id: 'c', name: 'C' }, 'wave');
  await store.start(id);
  await assert.rejects(() => store.kick(id, 'c'), /lobby/);
});

test('roles swap when the acting team goes offline', async () => {
  let clock = 5000000;
  const store = createMemoryCrossStore({ now: () => clock, holdMs: 0, wrongMs: 0 });
  const id = await store.createLobby();
  await store.join(id, { id: 'a', name: 'A' }, 'sun');
  await store.join(id, { id: 'b', name: 'B' }, 'wave');
  const started = await store.start(id);
  const picker = started.pickerTeam;
  const pickerId = picker === 'sun' ? 'a' : 'b';
  const onlineId = picker === 'sun' ? 'b' : 'a';
  await store.state(id, pickerId);
  clock += 40000;
  const view = await store.state(id, onlineId);
  assert.notEqual(view.pickerTeam, picker);
  assert.equal(view.phase, 'pick');
  assert.equal(view.canPick, true);
});
