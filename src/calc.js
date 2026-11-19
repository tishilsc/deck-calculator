// 床板割付の計算ロジック（画面に依存しない純粋関数）

export const MAX_BOARDS = 1000;
export const STEP = 0.5; // 幅調整板の丸め単位(mm)

// 両端の目地: both=両端にあり / one=片側のみ / none=なし
export const EDGE_MODES = ['both', 'one', 'none'];

export function jointCount(totalBoards, edgeMode) {
  if (edgeMode === 'both') return totalBoards + 1;
  if (edgeMode === 'one') return totalBoards;
  return totalBoards - 1;
}

const roundStep = (v) => Math.round(v / STEP) * STEP;

export const JOINT_EXTRA = 1; // 目地を広げるときの加算幅(mm)。1か所あたり

/**
 * 施工幅 W に対する割付案を返す（最大5件）。
 * 調整枚数が少ない順、同数なら調整板の幅が広い順、同じなら目地を広げる箇所が少ない順。
 * 同じ調整枚数は1案のみ。調整板 0 枚（定尺板だけで収まる）の案も含む。
 *
 * maxWidenedJoints > 0 のときは、設定どおりの目地では収まらない（施工幅が少し余る）場合に限り、
 * 目地のうち必要最小限の箇所を JOINT_EXTRA(mm) 広げた案も候補にする。
 * 目地を広げるのは調整板の幅が定尺幅を超えてしまう場合だけで、広げても余りがなくなるまでの最小箇所数。
 */
export function calculateBoards({ W, B, J, Bmin, edgeMode = 'both', maxWidenedJoints = 0 }) {
  const solutions = [];

  for (let totalBoards = 1; totalBoards <= MAX_BOARDS; totalBoards++) {
    const jointNum = jointCount(totalBoards, edgeMode);
    const baseJointWidth = jointNum * J;
    // 定尺板だけでも施工幅を超えるなら、これ以上枚数を増やしても無理
    if (totalBoards * Bmin + baseJointWidth > W + STEP) break;
    const kLimit = Math.min(maxWidenedJoints, jointNum);

    for (let adjustedBoards = 0; adjustedBoards <= totalBoards; adjustedBoards++) {
      const standardBoards = totalBoards - adjustedBoards;
      const rem0 = W - baseJointWidth - standardBoards * B;

      // 広げる箇所数 k を 0 から増やし、最初に条件を満たすものを採用（＝最小箇所数）
      for (let k = 0; k <= kLimit; k++) {
        const jointWidth = baseJointWidth + k * JOINT_EXTRA;
        const remainingWidth = rem0 - k * JOINT_EXTRA;
        let adjustedWidth = null;

        if (adjustedBoards === 0) {
          // 定尺板のみ: 0.5mm 以内で収まる場合だけ
          if (Math.abs(remainingWidth) > STEP / 2) continue;
        } else {
          adjustedWidth = roundStep(remainingWidth / adjustedBoards);
          // 定尺幅と同じなら実質カット不要（調整板 0 枚の案と重複するので除外）
          if (adjustedWidth < Bmin || adjustedWidth >= B) continue;
        }

        const totalWidth = roundStep(
          standardBoards * B + adjustedBoards * (adjustedWidth ?? 0) + jointWidth
        );
        solutions.push({
          totalBoards,
          standardBoards,
          adjustedBoards,
          adjustedWidth,
          widthDiff: adjustedBoards > 0 ? roundStep(B - adjustedWidth) : 0,
          totalWidth,
          gap: roundStep(totalWidth - W), // 丸めによる施工幅とのズレ
          widenedJoints: k, // 目地を +JOINT_EXTRA にする箇所数（0 なら設定どおり）
        });
        break;
      }
    }
  }

  solutions.sort((a, b) => {
    if (a.adjustedBoards !== b.adjustedBoards) return a.adjustedBoards - b.adjustedBoards;
    if ((b.adjustedWidth ?? 0) !== (a.adjustedWidth ?? 0)) return (b.adjustedWidth ?? 0) - (a.adjustedWidth ?? 0);
    return a.widenedJoints - b.widenedJoints;
  });

  const seen = new Set();
  const filtered = [];
  for (const s of solutions) {
    if (!seen.has(s.adjustedBoards)) {
      seen.add(s.adjustedBoards);
      filtered.push(s);
    }
  }
  return filtered.slice(0, 5);
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
