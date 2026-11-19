import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBoards, calculateTweaks, jointCount, validateInputs, JOINT_EXTRA } from '../src/calc.js';

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
  assert.ok(Math.abs(s.standardBoards * 150 + s.adjustedBoards * s.adjustedWidth + joints - 3000) <= 0.5 * s.adjustedBoards);
});

test('片側のみは目地数が枚数と同じ', () => {
  const r = calculateBoards({ ...base, W: 3000, edgeMode: 'one' });
  const s = r[0];
  assert.ok(Math.abs(s.standardBoards * 150 + s.adjustedBoards * s.adjustedWidth + s.totalBoards * 5 - 3000) <= 0.5 * s.adjustedBoards);
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

test('通常の案は目地を調整しない', () => {
  const r = calculateBoards({ ...base, W: 3123, edgeMode: 'both' });
  assert.ok(r.every((s) => s.jointAdjust === 0));
  assert.equal(r[0].adjustedBoards, 2);
});

test('施工幅が少し余るとき、最小箇所の目地を+1mmしてカット不要にする案が出る', () => {
  // 20枚・両端あり: 3000 + 5*21 = 3105。3112 は 7mm 余る → 7か所を6mmに
  const t = calculateTweaks({ ...base, W: 3112, edgeMode: 'both' });
  assert.equal(t[0].adjustedBoards, 0);
  assert.equal(t[0].standardBoards, 20);
  assert.equal(t[0].jointAdjust, 7);
  assert.equal(t[0].totalWidth, 3112);
});

test('施工幅が少し足りないとき、最小箇所の目地を-1mmしてカット不要にする案が出る', () => {
  // 3105 に対し 3101 は 4mm 足りない → 4か所を4mmに
  const t = calculateTweaks({ ...base, W: 3101, edgeMode: 'both' });
  assert.equal(t[0].adjustedBoards, 0);
  assert.equal(t[0].jointAdjust, -4);
  assert.equal(t[0].totalWidth, 3101);
});

test('1mmだけ切る案のように、目地調整で済む案に負ける案は出さない', () => {
  const t = calculateTweaks({ ...base, W: 3112, edgeMode: 'both' });
  assert.ok(!t.some((s) => s.adjustedBoards === 1 && s.adjustedWidth === 149));
});

test('設定どおりの案より良くならない目地調整は出さない', () => {
  for (const W of [3000, 3123, 4560]) {
    const n = calculateBoards({ ...base, W, edgeMode: 'both' })[0];
    for (const s of calculateTweaks({ ...base, W, edgeMode: 'both' })) {
      assert.ok(s.adjustedBoards < n.adjustedBoards || (s.adjustedWidth ?? 999) > (n.adjustedWidth ?? 999), `W=${W}`);
    }
  }
});

test('目地を狭める下限（3mm）を下回らない', () => {
  const t = calculateTweaks({ W: 3101, B: 150, J: 3, Bmin: 80, edgeMode: 'both' });
  assert.ok(t.every((s) => s.jointAdjust >= 0));
});

test('目地調整した案の寸法が施工幅に合う', () => {
  for (const W of [3010, 3047, 3101, 3123, 4560, 5011]) {
    for (const s of calculateTweaks({ ...base, W, edgeMode: 'both' })) {
      const joints = (s.totalBoards + 1) * 5 + s.jointAdjust * JOINT_EXTRA;
      const total = s.standardBoards * 150 + s.adjustedBoards * (s.adjustedWidth ?? 0) + joints;
      assert.ok(Math.abs(total - W) <= 0.5 * Math.max(1, s.adjustedBoards), `W=${W}`);
    }
  }
});

test('調整板の幅が定尺幅と同じ案（実質カットなし）は出さない', () => {
  for (const W of [3000, 3112, 3123, 4560]) {
    const r = [...calculateBoards({ ...base, W, edgeMode: 'both' }), ...calculateTweaks({ ...base, W, edgeMode: 'both' })];
    assert.ok(r.every((s) => s.adjustedBoards === 0 || s.adjustedWidth < 150), `W=${W}`);
  }
});

test('調整板の幅は0.5mm刻み', () => {
  for (const W of [3000, 3123, 4560, 3333]) {
    for (const s of [...calculateBoards({ ...base, W, edgeMode: 'both' }), ...calculateTweaks({ ...base, W, edgeMode: 'both' })]) {
      if (s.adjustedWidth != null) assert.equal(s.adjustedWidth * 2, Math.round(s.adjustedWidth * 2), `W=${W}`);
    }
  }
});

test('設定どおりの案よりカット板が狭くなる調整案には narrowerBy が付く', () => {
  const t = calculateTweaks({ ...base, W: 2033, edgeMode: 'both' });
  const s = t.find((x) => x.adjustedBoards === 2);
  assert.ok(s && s.narrowerBy > 0);
  const z = calculateTweaks({ ...base, W: 3112, edgeMode: 'both' })[0];
  assert.equal(z.adjustedBoards, 0);
  assert.equal(z.narrowerBy, 0);
});
