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

/**
 * 施工幅 W に対する割付案を返す（最大5件）。
 * 調整枚数が少ない順、同数なら調整板の幅が広い順。同じ調整枚数は1案のみ。
 * 調整板 0 枚（定尺板だけで収まる）の案も含む。
 */
export function calculateBoards({ W, B, J, Bmin, edgeMode = 'both' }) {
  const solutions = [];

  for (let totalBoards = 1; totalBoards <= MAX_BOARDS; totalBoards++) {
    const totalJointWidth = jointCount(totalBoards, edgeMode) * J;
    // 定尺板だけでも施工幅を超えるなら、これ以上枚数を増やしても無理
    if (totalBoards * Bmin + totalJointWidth > W + STEP) break;

    for (let adjustedBoards = 0; adjustedBoards <= totalBoards; adjustedBoards++) {
      const standardBoards = totalBoards - adjustedBoards;
      const remainingWidth = W - totalJointWidth - standardBoards * B;

      if (adjustedBoards === 0) {
        // 定尺板のみ: 0.5mm 以内で収まる場合だけ
        if (Math.abs(remainingWidth) <= STEP / 2) {
          solutions.push({
            totalBoards,
            standardBoards,
            adjustedBoards: 0,
            adjustedWidth: null,
            widthDiff: 0,
            totalWidth: roundStep(standardBoards * B + totalJointWidth),
            gap: roundStep(standardBoards * B + totalJointWidth - W),
          });
        }
        continue;
      }

      const adjustedWidth = roundStep(remainingWidth / adjustedBoards);
      if (adjustedWidth >= Bmin && adjustedWidth <= B) {
        const totalWidth = roundStep(
          standardBoards * B + adjustedBoards * adjustedWidth + totalJointWidth
        );
        solutions.push({
          totalBoards,
          standardBoards,
          adjustedBoards,
          adjustedWidth,
          widthDiff: roundStep(B - adjustedWidth),
          totalWidth,
          gap: roundStep(totalWidth - W), // 丸めによる施工幅とのズレ
        });
      }
    }
  }

  solutions.sort((a, b) =>
    a.adjustedBoards !== b.adjustedBoards
      ? a.adjustedBoards - b.adjustedBoards
      : (b.adjustedWidth ?? 0) - (a.adjustedWidth ?? 0)
  );

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
