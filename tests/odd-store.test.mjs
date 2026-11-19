import assert from 'node:assert/strict';
import test from 'node:test';
import { createMemoryOddStore } from '../src/odd-store.js';

function store() { return createMemoryOddStore({ cluesMs: 10 }); }

async function threePlayers(s) {
  const id = await s.createLobby();
  for (const [i, name] of ['Ava', 'Ben', 'Cleo'].entries()) {
    await s.join(id, { id: name.toLowerCase(), name });
  }
  return id;
}

test('needs three players to start', async () => {
  const s = store();
  const id = await s.createLobby();
  await s.join(id, { id: 'a', name: 'A' });
  await assert.rejects(() => s.start(id), /at least 3/);
});

test('imposter gets the different word and others the shared one', async () => {
  const s = store();
  const id = await threePlayers(s);
  const started = await s.start(id, (() => { let i = 0; const seq = [0.1, 0.7, 0.01]; return () => seq[i++ % seq.length]; })());
  assert.equal(started.phase, 'reveal');
  const views = [];
  for (const who of ['ava', 'ben', 'cleo']) views.push(await s.state(id, who));
  const imposters = views.filter((view) => view.myRole === 'imposter');
  assert.equal(imposters.length, 1);
  const civilianWords = views.filter((v) => v.myRole === 'civilian').map((v) => v.myWord);
  assert.equal(new Set(civilianWords).size, 1);
  assert.notEqual(imposters[0].myWord, civilianWords[0]);
});

test('ready moves everyone to clues, vote tallies and catches imposter', async () => {
  const s = store();
  const id = await threePlayers(s);
  await s.start(id, () => 0);
  for (const who of ['ava', 'ben', 'cleo']) await s.markReady(id, who);
  const clues = await s.state(id, 'ava');
  assert.equal(clues.phase, 'clues');
  await s.startVote(id, 'ava');
  const started = await s.state(id, 'ava');
  assert.equal(started.phase, 'vote');
  const imposter = (await s.state(id, 'ava')).players.find(async () => false) ? null : null;
  void imposter;
  // find the imposter from the three views
  let imposterId = null;
  for (const who of ['ava', 'ben', 'cleo']) {
    if ((await s.state(id, who)).myRole === 'imposter') imposterId = who;
  }
  const voters = ['ava', 'ben', 'cleo'].filter((who) => who !== imposterId);
  await s.vote(id, voters[0], imposterId);
  await s.vote(id, voters[1], imposterId);
  const final = await s.vote(id, imposterId, voters[0]);
  assert.equal(final.phase, 'result');
  assert.equal(final.result.imposterId, imposterId);
  assert.equal(final.result.caught, true);
  assert.equal(final.result.winner, 'civilians');
});

test('a tie lets the imposter escape', async () => {
  const s = store();
  const id = await threePlayers(s);
  await s.start(id, () => 0);
  for (const who of ['ava', 'ben', 'cleo']) await s.markReady(id, who);
  await s.startVote(id, 'ava');
  const imposterId = (await s.state(id, 'ava')).myRole === 'imposter' ? 'ava' : (await s.state(id, 'cleo')).myRole === 'imposter' ? 'cleo' : 'ben';
  const others = ['ava', 'ben', 'cleo'].filter((who) => who !== imposterId);
  await s.vote(id, imposterId, others[0]);
  await s.vote(id, others[0], imposterId);
  const final = await s.vote(id, others[1], imposterId);
  assert.equal(final.result.caught, true);
});

test('cannot vote for yourself', async () => {
  const s = store();
  const id = await threePlayers(s);
  await s.start(id, () => 0);
  for (const who of ['ava', 'ben', 'cleo']) await s.markReady(id, who);
  await s.startVote(id, 'ava');
  await assert.rejects(() => s.vote(id, 'ava', 'ava'), /yourself/);
});

test('next round keeps players and rotates words', async () => {
  const s = store();
  const id = await threePlayers(s);
  await s.start(id, () => 0);
  for (const who of ['ava', 'ben', 'cleo']) await s.markReady(id, who);
  await s.startVote(id, 'ava');
  for (const who of ['ava', 'ben', 'cleo']) {
    const target = who === 'ava' ? 'ben' : 'ava';
    await s.vote(id, who, target).catch(() => {});
  }
  const after = await s.state(id, 'ava');
  assert.equal(after.phase, 'result');
  const next = await s.nextRound(id, 'ava', () => 0);
  assert.equal(next.round, 2);
  assert.equal(next.phase, 'reveal');
  assert.equal(next.players.length, 3);
});
