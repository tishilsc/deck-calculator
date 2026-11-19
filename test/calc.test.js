import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBoards, jointCount, validateInputs } from '../src/calc.js';

const base = { B: 150, J: 5, Bmin: 80 };

test('目地の数', () => {
  assert.equal(jointCount(10, 'both'), 11);
  assert.equal(jointCount(10, 'one'), 10);
  assert.equal(jointCount(10, 'none'), 9);
});

test('定尺板だけでぴったりの案が最優先で出る（両端なし）', () => {
  // 10枚: 1500 + 9*5 = 1545
  const r = calculateBoards({ ...base, W: 1545, edgeMode: 'none' });
  assert.equal(r[0].adjustedBoards, 0);
  assert.equal(r[0].standardBoards, 10);
  assert.equal(r[0].gap, 0);
});

test('両端目地ありは目地が2か所増える', () => {
  const r = calculateBoards({ ...base, W: 3000, edgeMode: 'both' });
  const s = r[0];
  const joints = (s.totalBoards + 1) * 5;
  assert.ok(Math.abs(s.standardBoards * 150 + s.adjustedBoards * s.adjustedWidth + joints - 3000) <= 0.5);
});

test('片側のみは目地数が枚数と同じ', () => {
  const r = calculateBoards({ ...base, W: 3000, edgeMode: 'one' });
  const s = r[0];
  assert.ok(Math.abs(s.standardBoards * 150 + s.adjustedBoards * s.adjustedWidth + s.totalBoards * 5 - 3000) <= 0.5);
});

test('幅が広い現場（30枚超）でも案が出る', () => {
  const r = calculateBoards({ ...base, W: 10000, edgeMode: 'both' });
  assert.ok(r.length > 0);
  assert.ok(r[0].totalBoards > 30);
});

test('目地幅 0 でも計算できる', () => {
  const r = calculateBoards({ W: 1500, B: 150, J: 0, Bmin: 80, edgeMode: 'none' });
  assert.equal(r[0].adjustedBoards, 0);
  assert.equal(r[0].totalBoards, 10);
});

test('解なしは空配列', () => {
  assert.deepEqual(calculateBoards({ ...base, W: 50, edgeMode: 'none' }), []);
});

test('入力検査', () => {
  assert.deepEqual(validateInputs({ installWidth: '3000', boardWidth: '150', jointWidth: '0', minBoardWidth: '80' }), {});
  assert.ok(validateInputs({ installWidth: '3000', boardWidth: '150', jointWidth: '5', minBoardWidth: '200' }).minBoardWidth);
  assert.ok(validateInputs({ installWidth: '-1', boardWidth: '150', jointWidth: '5', minBoardWidth: '80' }).installWidth);
});
