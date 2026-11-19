// 床板割付の計算ロジック（画面に依存しない純粋関数）

export const MAX_BOARDS = 1000;
export const STEP = 1; // 幅調整板の丸め単位(mm)。現場で最後の1枚は実寸を見て加工するため1mm刻み
const ZERO_TOL = 0.5; // 調整板なし（定尺のみ）とみなす許容差(mm)

// 両端の目地: both=両端にあり / one=片側のみ / none=なし
export const EDGE_MODES = ['both', 'one', 'none'];

export function jointCount(totalBoards, edgeMode) {
  if (edgeMode === 'both') return totalBoards + 1;
  if (edgeMode === 'one') return totalBoards;
  return totalBoards - 1;
}

const roundStep = (v) => Math.round(v / STEP) * STEP;

export const JOINT_EXTRA = 1; // 目地を調整するときの1か所あたりの増減幅(mm)
export const MAX_TWEAK_JOINTS = 10; // 調整する目地の最大箇所数
export const MIN_JOINT = 3; // 狭める場合の目地幅の下限(mm)

/**
 * 全パターンを調べる。目地は基本そのまま(jointAdjust=0)。そのままでは収まらないときに限り、
 * 必要最小限の箇所の目地を ±JOINT_EXTRA だけ調整した案を作る。
 * jointAdjust: 正=その数だけ目地を +JOINT_EXTRA(広げる)、負=その数だけ -JOINT_EXTRA(狭める)
 */
function enumerate({ W, B, J, Bmin, edgeMode }, maxTweak) {
  const solutions = [];
  const canNarrow = J - JOINT_EXTRA >= MIN_JOINT;

  for (let totalBoards = 1; totalBoards <= MAX_BOARDS; totalBoards++) {
    const jointNum = jointCount(totalBoards, edgeMode);
    const baseJointWidth = jointNum * J;
    const kLimit = Math.min(maxTweak, jointNum);
    // 最大限に狭めても定尺板だけで施工幅を超えるなら、これ以上枚数を増やしても無理
    const narrowest = baseJointWidth - (canNarrow ? kLimit * JOINT_EXTRA : 0);
    if (totalBoards * Bmin + narrowest > W + STEP) break;

    for (let adjustedBoards = 0; adjustedBoards <= totalBoards; adjustedBoards++) {
      const standardBoards = totalBoards - adjustedBoards;
      const rem0 = W - baseJointWidth - standardBoards * B;

      // 調整する箇所数を 0, +1, -1, +2, -2 ... の順に試し、最初に条件を満たすものを採用（＝最小）
      const order = [0];
      for (let k = 1; k <= kLimit; k++) {
        order.push(k);
        if (canNarrow) order.push(-k);
      }
      for (const d of order) {
        const remainingWidth = rem0 - d * JOINT_EXTRA;
        let adjustedWidth = null;

        if (adjustedBoards === 0) {
          // 定尺板のみ: 0.5mm 以内で収まる場合だけ
          if (Math.abs(remainingWidth) > ZERO_TOL) continue;
        } else {
          adjustedWidth = roundStep(remainingWidth / adjustedBoards);
          // 定尺幅と同じなら実質カット不要（調整板 0 枚の案と重複するので除外）
          if (adjustedWidth < Bmin || adjustedWidth >= B) continue;
        }

        const totalWidth = roundStep(
          standardBoards * B + adjustedBoards * (adjustedWidth ?? 0) + baseJointWidth + d * JOINT_EXTRA
        );
        solutions.push({
          totalBoards,
          standardBoards,
          adjustedBoards,
          adjustedWidth,
          widthDiff: adjustedBoards > 0 ? roundStep(B - adjustedWidth) : 0,
          totalWidth,
          gap: roundStep(totalWidth - W), // 丸めによる施工幅とのズレ
          jointAdjust: d,
        });
        break;
      }
    }
  }
  return solutions;
}

const widthOf = (s) => s.adjustedWidth ?? Infinity; // カット不要は最も良い扱い
const byQuality = (a, b) =>
  a.adjustedBoards !== b.adjustedBoards
    ? a.adjustedBoards - b.adjustedBoards
    : widthOf(b) !== widthOf(a)
      ? widthOf(b) - widthOf(a)
      : Math.abs(a.jointAdjust) - Math.abs(b.jointAdjust);

function onePerAdjusted(list) {
  const seen = new Set();
  return list.filter((s) => (seen.has(s.adjustedBoards) ? false : seen.add(s.adjustedBoards)));
}

/**
 * 施工幅 W に対する割付案（目地は設定どおり）を返す（最大5件）。
 * 調整枚数が少ない順、同数なら調整板の幅が広い順。同じ調整枚数は1案のみ。
 * 調整板 0 枚（定尺板だけで収まる）の案も含む。
 */
export function calculateBoards(params) {
  const normal = enumerate(params, 0).sort(byQuality);
  return onePerAdjusted(normal).slice(0, 5);
}

/**
 * 目地を少し調整すれば、設定どおりの案より加工が減る（または加工板が広くなる）案を返す（最大3件）。
 * 調整するのは必要最小限の箇所数。広げる(+)場合も狭める(-)場合もある。
 */
export function calculateTweaks(params) {
  const all = enumerate(params, MAX_TWEAK_JOINTS);
  const tweaks = all.filter((s) => s.jointAdjust !== 0);
  const better = (t, s) =>
    t.adjustedBoards <= s.adjustedBoards &&
    widthOf(t) >= widthOf(s) &&
    Math.abs(t.jointAdjust) <= Math.abs(s.jointAdjust) &&
    (t.adjustedBoards < s.adjustedBoards ||
      widthOf(t) > widthOf(s) ||
      Math.abs(t.jointAdjust) < Math.abs(s.jointAdjust));
  const useful = tweaks.filter((s) => !all.some((t) => t !== s && better(t, s)));
  // 設定どおりの最良案よりカット板の幅が狭くなる場合は、その差(mm)を narrowerBy に入れる（注意表示用）
  const bestNormal = all.filter((s) => s.jointAdjust === 0).sort(byQuality)[0];
  const withNote = useful.map((s) => ({
    ...s,
    narrowerBy:
      bestNormal && s.adjustedBoards > 0 && bestNormal.adjustedBoards > 0 && s.adjustedWidth < bestNormal.adjustedWidth
        ? bestNormal.adjustedWidth - s.adjustedWidth
        : 0,
  }));
  return onePerAdjusted(withNote.sort(byQuality)).slice(0, 3);
}

/** 入力値の検査。問題があればフィールド名 -> メッセージ を返す。 */
export function validateInputs({ installWidth, boardWidth, jointWidth, minBoardWidth }) {
  const errors = {};
  const W = parseFloat(installWidth);
  const B = parseFloat(boardWidth);
  const J = parseFloat(jointWidth);
  const Bmin = parseFloat(minBoardWidth);

  if (installWidth !== '' && !(W > 0)) errors.installWidth = '施工幅は0より大きい値を入力してください';
  if (boardWidth !== '' && !(B > 0)) errors.boardWidth = '床板幅は0より大きい値を入力してください';
  if (jointWidth !== '' && !(J >= 0)) errors.jointWidth = '目地幅は0以上の値を入力してください';
  if (minBoardWidth !== '' && !(Bmin > 0)) errors.minBoardWidth = '最低床板幅は0より大きい値を入力してください';
  if (!errors.minBoardWidth && minBoardWidth !== '' && boardWidth !== '' && Bmin > B) {
    errors.minBoardWidth = '最低床板幅は床板幅以下にしてください';
  }
  return errors;
}
