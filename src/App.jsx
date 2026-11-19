import React, { useState } from 'react';
import { Calculator, Hammer, AlertCircle, Info } from 'lucide-react';
import { calculateBoards as calc, calculateTweaks as calcTweaks, validateInputs, JOINT_EXTRA } from './calc';

const EDGE_OPTIONS = [
  { value: 'both', label: '両端にあり' },
  { value: 'one', label: '片側のみ' },
  { value: 'none', label: 'なし' }
];
const EDGE_LABEL = { both: '両端にあり', one: '片側のみ', none: 'なし' };

const svgProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const IconBoard = () => (
  <svg {...svgProps}><rect x="3" y="7" width="18" height="10" rx="1.5" /><path d="M7 7v10M12 7v10M17 7v10" opacity=".45" /></svg>
);
const IconCut = () => (
  <svg {...svgProps}><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><path d="M8 7.5L20 18M8 16.5L20 6" /></svg>
);
const IconJoint = () => (
  <svg {...svgProps}><path d="M3 6v12M21 6v12" /><path d="M8 12h8M8 12l2.5-2.5M8 12l2.5 2.5M16 12l-2.5-2.5M16 12l-2.5 2.5" /></svg>
);
const IconCheck = () => (
  <svg {...svgProps} strokeWidth={3}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
const IconShare = () => (
  <svg {...svgProps} strokeWidth={2.2}><path d="M12 15V3M7.5 7.5L12 3l4.5 4.5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6" /></svg>
);
const IconClose = () => (
  <svg {...svgProps} strokeWidth={2.6}><path d="M6 6l12 12M18 6L6 18" /></svg>
);

// 「幅 × 枚数」を大きく表示
function WidthCount({ width, count, unit = '枚', className = '' }) {
  return (
    <span className={`inline-flex items-baseline whitespace-nowrap ${className}`}>
      <b className="text-[28px] font-extrabold tracking-tight">{width}</b>
      <i className="not-italic text-[15px] font-bold mr-1 ml-px">mm</i>
      <em className="not-italic text-base opacity-50 mx-1">×</em>
      <b className="text-[28px] font-extrabold tracking-tight">{count}</b>
      <i className="not-italic text-[15px] font-bold ml-px">{unit}</i>
    </span>
  );
}

const sameResult = (a, b) =>
  !!a && !!b &&
  a.standardBoards === b.standardBoards &&
  a.adjustedBoards === b.adjustedBoards &&
  a.adjustedWidth === b.adjustedWidth &&
  a.jointAdjust === b.jointAdjust;

// 候補1件を1行で表示
function ResultRow({ result, label, tweak, boardWidth, jointWidth, chosen, onPick }) {
  const j = Number(jointWidth);
  const eff = result.__effect;
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 mb-2 ${
        chosen ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'border-gray-200 bg-white'
      }`}
    >
      <div
        className={`flex-none w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold ${
          chosen ? 'bg-green-600 text-white' : 'bg-amber-100 text-amber-800'
        }`}
      >
        {label}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {result.adjustedBoards > 0 ? (
            <span className="text-orange-700 leading-tight">
              <WidthCount width={result.adjustedWidth} count={result.adjustedBoards} className="[&_b]:!text-[22px]" />
            </span>
          ) : (
            <span className="text-xl font-extrabold text-green-700">カット不要</span>
          )}
          {eff && <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{eff}</span>}
          {result.narrowerBy > 0 && (
            <span className="text-xs font-bold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
              ⚠ 幅が{result.narrowerBy}mm狭くなる
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
          定尺 <b className="text-gray-700">{boardWidth}</b> × <b className="text-gray-700">{result.standardBoards}</b>枚 ・ 計{' '}
          <b className="text-gray-700">{result.totalBoards}</b>枚
        </div>
        {tweak && result.jointAdjust !== 0 && (
          <div className="mt-1">
            <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              目地 {Math.abs(result.jointAdjust)}か所 → {j + (result.jointAdjust > 0 ? JOINT_EXTRA : -JOINT_EXTRA)}mm
            </span>
          </div>
        )}
      </div>
      <button
        onClick={onPick}
        className={`flex-none text-sm font-bold px-3 py-2 rounded-lg ${
          chosen ? 'bg-green-600 text-white' : 'border-2 border-gray-300 text-gray-600'
        }`}
      >
        {chosen ? '✓ 採用' : '採用'}
      </button>
    </div>
  );
}

// 採用した案を画面下に固定表示
function AdoptBar({ chosen, installWidth, boardWidth, jointWidth, onShare, onClear }) {
  const r = chosen.result;
  const j = Number(jointWidth);
  const tweaked = r.jointAdjust !== 0;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t-[3px] border-green-600 shadow-[0_-6px_16px_rgba(0,0,0,0.2)]">
      <div className="max-w-2xl mx-auto px-3 pb-3">
        <div className="flex items-center gap-2 pt-2 pb-2">
          <span className="w-[26px] h-[26px] rounded-full bg-green-600 text-white p-1"><IconCheck /></span>
          <span className="text-sm text-green-800">採用中 <b className="text-base text-green-900">{chosen.name}</b></span>
          <span className="ml-auto text-[13px] text-gray-600">計{r.totalBoards}枚 ・ {installWidth}mm</span>
          <button onClick={onShare} aria-label="共有" className="w-9 h-9 rounded-lg bg-green-600 text-white p-2"><IconShare /></button>
          <button onClick={onClear} aria-label="採用を解除" className="w-9 h-9 rounded-lg bg-gray-100 text-gray-500 p-2"><IconClose /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border-2 border-blue-300 bg-blue-50 text-blue-700 px-2.5 py-2">
            <div className="flex items-center gap-1.5 text-sm font-bold"><span className="w-[22px] h-[22px]"><IconBoard /></span>定尺板</div>
            <div className="mt-1 leading-tight"><WidthCount width={boardWidth} count={r.standardBoards} /></div>
          </div>
          {r.adjustedBoards > 0 ? (
            <div className="rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-700 px-2.5 py-2">
              <div className="flex items-center gap-1.5 text-sm font-bold"><span className="w-[22px] h-[22px]"><IconCut /></span>カット板</div>
              <div className="mt-1 leading-tight"><WidthCount width={r.adjustedWidth} count={r.adjustedBoards} /></div>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-green-300 bg-green-50 text-green-700 px-2.5 py-2">
              <div className="flex items-center gap-1.5 text-sm font-bold"><span className="w-[22px] h-[22px]"><IconCut /></span>カット板</div>
              <div className="mt-1 leading-tight text-[28px] font-extrabold">なし</div>
            </div>
          )}
        </div>
        {tweaked && (
          <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-700 px-2.5 py-1.5">
            <span className="flex items-center gap-1.5 text-sm font-bold"><span className="w-[22px] h-[22px]"><IconJoint /></span>目地</span>
            <WidthCount width={j + (r.jointAdjust > 0 ? JOINT_EXTRA : -JOINT_EXTRA)} count={Math.abs(r.jointAdjust)} unit="か所" />
            <span className="ml-auto text-sm font-semibold text-amber-900">他は {jointWidth}mm</span>
          </div>
        )}
      </div>
    </div>
  );
}

const CHOSEN_KEY = 'deckCalculatorChosen';
function loadChosen() {
  try {
    return JSON.parse(localStorage.getItem(CHOSEN_KEY)) || null;
  } catch (e) {
    return null;
  }
}

export default function App() {
  const [installWidth, setInstallWidth] = useState('');
  const [boardWidth, setBoardWidth] = useState('150');
  const [jointWidth, setJointWidth] = useState('5');
  const [minBoardWidth, setMinBoardWidth] = useState('80');
  const [edgeMode, setEdgeMode] = useState('both');
  const [allowTweak, setAllowTweak] = useState(true);
  const [results, setResults] = useState(null);
  const [chosen, setChosen] = useState(loadChosen);
  const [showVersionInfo, setShowVersionInfo] = useState(false);

  const version = '2026.11.19';
  const updateHistory = [
    {
      version: '2026.11.19',
      changes: [
        'オフライン対応（一度開けば電波がなくても使えます）',
        '端の目地を「両端にあり／片側のみ／なし」から選択可能に（初期値は両端にあり）',
        '最大試行枚数を1000枚に戻し、広い施工幅でも提案が出るように修正',
        '定尺板だけで収まる場合も提案するように変更',
        '目地の微調整案：目地を最小限の箇所だけ±1mmすれば加工が減る場合に、別枠で提案（設定「目地の±1mmを許容する」でオン／オフ）',
        '目地幅0mmを入力できるように修正',
        '幅調整板は1mm単位で表示（現場で実寸に合わせて加工するため）',
        '候補を1行で見やすく表示し、使う案を「採用」すると画面下に固定表示',
        '目地調整でカット板の幅が狭くなる案には注意表示',
        '共有テキストに最低床板幅と端の目地を追加'
      ]
    },
    {
      version: '2026.02.16',
      changes: [
        '施工幅の初期値を空欄に変更（プレースホルダーのみ表示）',
        '前回の値を復元',
        '計算結果の共有機能',
        '入力フィールドをタップ時に自動全選択・エラーチェック',
        '両端目地の有無を選択可能に',
        'ラスコジャパンのリンクを追加'
      ]
    },
    {
      version: '2026.02.15',
      changes: [
        '幅調整板を0.5mm単位で計算',
        '同じ調整枚数なら幅が広い方のみ表示',
        '調整枚数が少ない順に優先表示',
        '初回リリース'
      ]
    }
  ];
  const [errors, setErrors] = useState({});

  // 初回読み込み時に前回の値を復元
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('deckCalculatorHistory');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.installWidth) setInstallWidth(data.installWidth);
        if (data.boardWidth) setBoardWidth(data.boardWidth);
        if (data.jointWidth) setJointWidth(data.jointWidth);
        if (data.minBoardWidth) setMinBoardWidth(data.minBoardWidth);
        if (data.edgeMode) setEdgeMode(data.edgeMode);
        else if (data.edgeJoints !== undefined) setEdgeMode(data.edgeJoints ? 'both' : 'none');
        if (typeof data.allowTweak === 'boolean') setAllowTweak(data.allowTweak);
      }
    } catch (e) {
      // エラー時は無視
    }
  }, []);

  // 値が変更されたら保存
  React.useEffect(() => {
    const data = {
      installWidth,
      boardWidth,
      jointWidth,
      minBoardWidth,
      edgeMode,
      allowTweak
    };
    try {
      localStorage.setItem('deckCalculatorHistory', JSON.stringify(data));
    } catch (e) {
      // 保存できない環境では無視
    }
  }, [installWidth, boardWidth, jointWidth, minBoardWidth, edgeMode, allowTweak]);

  // 入力値のリアルタイムバリデーション
  React.useEffect(() => {
    setErrors(validateInputs({ installWidth, boardWidth, jointWidth, minBoardWidth }));
  }, [installWidth, boardWidth, jointWidth, minBoardWidth]);

  const jointAdjustText = (r) => {
    const n = Math.abs(r.jointAdjust);
    const w = Number(jointWidth) + (r.jointAdjust > 0 ? JOINT_EXTRA : -JOINT_EXTRA);
    return `${n}か所を${w}mmに（他は${jointWidth}mm）`;
  };

  const shareResult = (result) => {
    const text = `【ウッドデッキ床板計算結果】
施工幅: ${installWidth}mm
床板幅: ${boardWidth}mm
目地幅: ${jointWidth}mm
最低床板幅: ${minBoardWidth}mm
端の目地: ${EDGE_LABEL[edgeMode]}

【採用案】
定尺板: ${result.standardBoards}枚 (${boardWidth}mm)
${result.adjustedBoards > 0
  ? `幅調整板: ${result.adjustedBoards}枚 (${result.adjustedWidth}mm)
カット幅: -${result.widthDiff}mm`
  : '幅調整板: なし'}
合計: ${result.totalBoards}枚
${result.jointAdjust !== 0 ? `目地: ${jointAdjustText(result)}` : ''}

株式会社ラスコジャパン
https://lasco.jp/`;

    if (navigator.share) {
      // Web Share API対応（スマホ）
      navigator.share({
        title: 'ウッドデッキ床板計算結果',
        text: text
      }).catch(() => {
        // キャンセル時は何もしない
      });
    } else {
      // 非対応の場合はクリップボードにコピー
      navigator.clipboard.writeText(text).then(() => {
        alert('計算結果をクリップボードにコピーしました');
      }).catch(() => {
        alert('共有機能が利用できません');
      });
    }
  };

  const currentSig = [installWidth, boardWidth, jointWidth, minBoardWidth, edgeMode].join('|');
  const chosenActive = chosen && chosen.sig === currentSig ? chosen : null;

  const computeResults = () => {
    const W = parseFloat(installWidth);
    const B = parseFloat(boardWidth);
    const J = parseFloat(jointWidth);
    const Bmin = parseFloat(minBoardWidth);
    if (!(W > 0) || !(B > 0) || !(J >= 0) || !(Bmin > 0) || Bmin > B) return null;
    const params = { W, B, J, Bmin, edgeMode };
    const normal = calc(params);
    const best = normal[0];
    const tweaks = (allowTweak ? calcTweaks(params) : []).map((t) => ({
      ...t,
      __effect: !best
        ? ''
        : t.adjustedBoards === 0
          ? `カット ${best.adjustedBoards}枚 → 0枚`
          : t.adjustedBoards < best.adjustedBoards
            ? `カット ${best.adjustedBoards - t.adjustedBoards}枚減`
            : ''
    }));
    return { normal, tweaks };
  };

  const calculateBoards = () => {
    const W = parseFloat(installWidth);
    const B = parseFloat(boardWidth);
    const J = parseFloat(jointWidth);
    const Bmin = parseFloat(minBoardWidth);

    if (!(W > 0) || !(B > 0) || !(J >= 0) || !(Bmin > 0)) {
      alert('正しい数値を入力してください');
      return;
    }

    if (Bmin > B) {
      alert('最低床板幅が通常の板幅より大きくなっています');
      return;
    }

    setResults(computeResults());
  };

  // 採用した案が保存されていて条件が同じなら、開いたときに候補を再表示する
  React.useEffect(() => {
    if (chosenActive && results === null) setResults(computeResults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenActive]);

  // 採用案を保存
  React.useEffect(() => {
    try {
      if (chosen) localStorage.setItem(CHOSEN_KEY, JSON.stringify(chosen));
      else localStorage.removeItem(CHOSEN_KEY);
    } catch (e) {
      // 保存できない環境では無視
    }
  }, [chosen]);

  const pick = (result, name) => {
    if (chosenActive && sameResult(chosenActive.result, result)) setChosen(null);
    else setChosen({ sig: currentSig, name, result });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 ${chosenActive ? 'pb-80' : ''}`}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-500 p-3 rounded-xl">
              <Hammer className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">ウッドデッキ床板計算ツール</h1>
            </div>
            <button
              onClick={() => setShowVersionInfo(!showVersionInfo)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="バージョン情報"
            >
              <Info className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {showVersionInfo && (
            <div className="mb-6 bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">バージョン情報</h3>
                <span className="text-sm font-mono bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                  v{version}
                </span>
              </div>
              
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {updateHistory.map((update, index) => (
                  <div key={index} className="border-l-4 border-amber-500 pl-3">
                    <div className="text-sm font-semibold text-gray-700 mb-1">
                      {update.version}
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {update.changes.map((change, changeIndex) => (
                        <li key={changeIndex}>• {change}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                施工幅（mm）
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={installWidth}
                onChange={(e) => setInstallWidth(e.target.value)}
                onFocus={(e) => e.target.select()}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-lg ${
                  errors.installWidth ? 'border-red-500' : 'border-gray-200 focus:border-amber-500'
                }`}
                placeholder="3000"
              />
              {errors.installWidth && (
                <p className="text-red-600 text-sm mt-1">{errors.installWidth}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                床板幅（mm）
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={boardWidth}
                onChange={(e) => setBoardWidth(e.target.value)}
                onFocus={(e) => e.target.select()}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-lg ${
                  errors.boardWidth ? 'border-red-500' : 'border-gray-200 focus:border-amber-500'
                }`}
                placeholder="150"
              />
              {errors.boardWidth && (
                <p className="text-red-600 text-sm mt-1">{errors.boardWidth}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                目地幅（mm）
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={jointWidth}
                onChange={(e) => setJointWidth(e.target.value)}
                onFocus={(e) => e.target.select()}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-lg ${
                  errors.jointWidth ? 'border-red-500' : 'border-gray-200 focus:border-amber-500'
                }`}
                placeholder="5"
              />
              {errors.jointWidth && (
                <p className="text-red-600 text-sm mt-1">{errors.jointWidth}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                最低床板幅（mm）
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={minBoardWidth}
                onChange={(e) => setMinBoardWidth(e.target.value)}
                onFocus={(e) => e.target.select()}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-lg ${
                  errors.minBoardWidth ? 'border-red-500' : 'border-gray-200 focus:border-amber-500'
                }`}
                placeholder="80"
              />
              {errors.minBoardWidth && (
                <p className="text-red-600 text-sm mt-1">{errors.minBoardWidth}</p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-3">端の目地</div>
              <div className="space-y-2">
                {EDGE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="edgeMode"
                      value={opt.value}
                      checked={edgeMode === opt.value}
                      onChange={() => setEdgeMode(opt.value)}
                      className="w-5 h-5 border-gray-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <div className="text-sm font-semibold text-gray-700">{opt.label}</div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowTweak}
                  onChange={(e) => setAllowTweak(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-700">目地の±{JOINT_EXTRA}mmを許容する</span>
              </label>
            </div>

            <button
              onClick={calculateBoards}
              disabled={Object.keys(errors).length > 0 || !installWidth}
              className={`w-full font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg shadow-lg ${
                Object.keys(errors).length > 0 || !installWidth
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              <Calculator className="w-5 h-5" />
              計算する
            </button>
          </div>
        </div>

        {results && (
          <div>
            {results.normal.length === 0 && results.tweaks.length === 0 ? (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-red-800 mb-2">解決策が見つかりません</h3>
                    <p className="text-red-700 text-sm">
                      条件を満たす配置が見つかりませんでした。施工幅や最低床板幅の設定を見直してください。
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {results.normal.length > 0 && (
                  <div className="text-sm font-bold text-amber-800 mx-1 mb-2">
                    設定どおりの目地 <span className="font-normal text-xs text-gray-400 ml-1">カットが少なく、幅が広い順</span>
                  </div>
                )}
                {results.normal.map((r, i) => (
                  <ResultRow
                    key={`n${i}`}
                    result={r}
                    label={i + 1}
                    tweak={false}
                    boardWidth={boardWidth}
                    jointWidth={jointWidth}
                    chosen={!!chosenActive && sameResult(chosenActive.result, r)}
                    onPick={() => pick(r, `案${i + 1}`)}
                  />
                ))}

                {results.tweaks.length > 0 && (
                  <>
                    <div className="text-sm font-bold text-amber-700 mx-1 mt-4 mb-2 pt-3 border-t-2 border-dashed border-amber-300">
                      目地を少し調整すると <span className="font-normal text-xs text-gray-400 ml-1">調整が少ない順</span>
                    </div>
                    {results.tweaks.map((r, i) => (
                      <ResultRow
                        key={`t${i}`}
                        result={r}
                        label={`調${i + 1}`}
                        tweak
                        boardWidth={boardWidth}
                        jointWidth={jointWidth}
                        chosen={!!chosenActive && sameResult(chosenActive.result, r)}
                        onPick={() => pick(r, `調整案${i + 1}`)}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-8 bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            使い方
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>施工幅</strong>: ウッドデッキの全体幅を入力</li>
            <li>• <strong>床板幅</strong>: 定尺の床板幅（例: 150mm、105mm）</li>
            <li>• <strong>目地幅</strong>: 床板間の隙間（例: 5mm）</li>
            <li>• <strong>最低床板幅</strong>: カット後の最小許容幅</li>
            <li>• 定尺板だけで収まる場合は「カット不要」の案が先頭に出ます</li>
            <li>• 一度開けば、電波がなくてもオフラインで使えます</li>
            <li>• <strong>目地の微調整</strong>: 施工幅が少し余るとき、必要最小限の目地を+1mmして加工を減らす案を出します</li>
            <li>• <strong>目地の±1mmを許容する</strong>: 目地を最小限の箇所だけ±1mmすれば加工が減る案を、別枠で出します</li>
            <li>• 幅調整板は1mm単位で表示します（最後の1枚は現場で実寸に合わせて加工）</li>
            <li>• 調整枚数が少なく、幅が広い順に表示されます</li>
            <li>• 使う案の「採用」を押すと、画面の下に作業内容が固定表示されます</li>
          </ul>
        </div>

        <div className="mt-6 text-center pb-4">
          <a 
            href="https://lasco.jp/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 transition-colors"
          >
            <span>Powered by</span>
            <span className="font-bold">株式会社ラスコジャパン</span>
          </a>
          <div className="text-xs text-gray-400 mt-2">
            v{version}
          </div>
        </div>
      </div>
      {chosenActive && (
        <AdoptBar
          chosen={chosenActive}
          installWidth={installWidth}
          boardWidth={boardWidth}
          jointWidth={jointWidth}
          onShare={() => shareResult(chosenActive.result)}
          onClear={() => setChosen(null)}
        />
      )}
    </div>
  );
}
