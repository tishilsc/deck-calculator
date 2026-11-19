import React, { useState } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { calculateBoards as calc, calculateTweaks as calcTweaks, validateInputs, JOINT_EXTRA } from './calc';

const EDGE_OPTIONS = [
  { value: 'both', label: '両端にあり' },
  { value: 'one', label: '片側のみ' },
  { value: 'none', label: 'なし' }
];
const EDGE_LABEL = { both: '両端にあり', one: '片側のみ', none: 'なし' };
const EDGE_SHORT = { both: '両端あり', one: '片側のみ', none: '端なし' };

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
const IconChevron = ({ up }) => (
  <svg {...svgProps} strokeWidth={2.6}>{up ? <path d="M6 15l6-6 6 6" /> : <path d="M6 9l6 6 6-6" />}</svg>
);
// アプリのロゴ（ホーム画面のアイコンと同じ意匠）
const AppLogo = () => (
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fbbf24" /><stop offset="1" stopColor="#f97316" /></linearGradient></defs>
    <rect width="64" height="64" rx="14" fill="url(#lg)" />
    <rect x="11" y="11" width="10" height="32" rx="1.6" fill="#ffffff" />
    <rect x="23.5" y="11" width="10.0" height="32" rx="1.6" fill="#ffffff" />
    <rect x="36" y="11" width="10" height="32" rx="1.6" fill="#ffffff" />
    <rect x="48.5" y="11" width="4.5" height="32" rx="1.6" fill="#7c2d12" />
    <path d="M11 52H53M11 48.5V55.5M53 48.5V55.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
  </svg>
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
  const [results, setResults] = useState(null);
  const [chosen, setChosen] = useState(loadChosen);
  const [showVersionInfo, setShowVersionInfo] = useState(false);
  const [showCond, setShowCond] = useState(false);

  const version = '2026.11.19';
  const updateHistory = [
    {
      version: '2026.11.19',
      changes: [
        'オフライン対応（一度開けば電波がなくても使えます）',
        '入力欄を刷新（施工幅を大きく・入力すると自動で計算・条件は折りたたみ）',
        'アイコンを刷新（ホーム画面用のアイコンも追加）',
        '端の目地を「両端にあり／片側のみ／なし」から選択可能に（初期値は両端にあり）',
        '最大試行枚数を1000枚に戻し、広い施工幅でも提案が出るように修正',
        '定尺板だけで収まる場合も提案するように変更',
        '目地の調整案：目地を最小限の箇所だけ±1mmすれば加工が減る場合に、別枠で提案',
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
      edgeMode
    };
    try {
      localStorage.setItem('deckCalculatorHistory', JSON.stringify(data));
    } catch (e) {
      // 保存できない環境では無視
    }
  }, [installWidth, boardWidth, jointWidth, minBoardWidth, edgeMode]);

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
    const tweaks = calcTweaks(params).map((t) => ({
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

  // 入力が変わったら自動で計算する（入力途中のちらつきを避けるため、少し待ってから）
  React.useEffect(() => {
    const noErrors = Object.keys(errors).length === 0;
    const ready = noErrors && parseFloat(installWidth) > 0 && parseFloat(boardWidth) > 0 && parseFloat(minBoardWidth) > 0 && parseFloat(jointWidth) >= 0;
    if (!ready) {
      setResults(null);
      return undefined;
    }
    const timer = setTimeout(() => setResults(computeResults()), results === null ? 0 : 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installWidth, boardWidth, jointWidth, minBoardWidth, edgeMode, errors]);

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
        <div className="flex items-center gap-2 px-1 pb-3">
          <div className="w-8 h-8 flex-none"><AppLogo /></div>
          <h1 className="text-base font-bold text-gray-800">床板計算</h1>
          <span className="text-[11px] text-gray-400">v{version}</span>
          <button
            onClick={() => setShowVersionInfo(!showVersionInfo)}
            className="ml-auto p-2 rounded-lg text-gray-500"
            aria-label="バージョン情報"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {showVersionInfo && (
          <div className="mb-3 bg-white rounded-xl p-4 border-2 border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3">バージョン情報</h3>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {updateHistory.map((update, index) => (
                <div key={index} className="border-l-4 border-amber-500 pl-3">
                  <div className="text-sm font-semibold text-gray-700 mb-1">{update.version}</div>
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

        <div className="bg-white rounded-2xl shadow p-3 mb-3">
          <div className={`flex items-center gap-2 rounded-xl border-2 px-3 py-1 bg-amber-50 ${errors.installWidth ? 'border-red-500' : 'border-amber-400'}`}>
            <label htmlFor="installWidth" className="text-sm font-bold text-amber-800 flex-none">施工幅</label>
            <input
              id="installWidth"
              type="number"
              inputMode="decimal"
              value={installWidth}
              onChange={(e) => setInstallWidth(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 bg-transparent text-right text-[38px] leading-tight font-extrabold text-gray-900 placeholder-gray-300 focus:outline-none"
              placeholder="3000"
            />
            <span className="text-base font-bold text-gray-500 flex-none">mm</span>
            {installWidth && (
              <button
                onClick={() => setInstallWidth('')}
                aria-label="施工幅を消す"
                className="flex-none w-6 h-6 rounded-full bg-gray-200 text-gray-500 p-1"
              >
                <IconClose />
              </button>
            )}
          </div>
          {errors.installWidth && <p className="text-red-600 text-sm mt-1">{errors.installWidth}</p>}

          <div className="flex items-center gap-2 mt-2">
            <div className="flex flex-wrap gap-1.5 flex-1 text-[13px] text-gray-600">
              <span className="bg-gray-100 rounded-full px-2 py-0.5">床板 <b className="text-gray-900">{boardWidth || '–'}</b></span>
              <span className="bg-gray-100 rounded-full px-2 py-0.5">目地 <b className="text-gray-900">{jointWidth || '–'}</b></span>
              <span className="bg-gray-100 rounded-full px-2 py-0.5">最低 <b className="text-gray-900">{minBoardWidth || '–'}</b></span>
              <span className="bg-gray-100 rounded-full px-2 py-0.5">{EDGE_SHORT[edgeMode]}</span>
            </div>
            <button
              onClick={() => setShowCond(!showCond)}
              className={`flex-none flex items-center gap-0.5 text-[13px] font-bold px-2 py-1 rounded-lg ${
                Object.keys(errors).some((k) => k !== 'installWidth') ? 'text-red-600' : 'text-amber-600'
              }`}
            >
              条件を{showCond ? '閉じる' : '変更'}
              <span className="w-4 h-4"><IconChevron up={showCond} /></span>
            </button>
          </div>

          {showCond && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['boardWidth', '床板幅', boardWidth, setBoardWidth, '150'],
                  ['jointWidth', '目地幅', jointWidth, setJointWidth, '5'],
                  ['minBoardWidth', '最低床板幅', minBoardWidth, setMinBoardWidth, '80']
                ].map(([key, label, value, setter, ph]) => (
                  <div key={key}>
                    <label htmlFor={key} className="block text-[13px] font-bold text-gray-600 mb-1">{label}</label>
                    <div className={`flex items-baseline justify-center gap-1 rounded-lg border-2 px-1 py-1.5 ${errors[key] ? 'border-red-500' : 'border-gray-200'}`}>
                      <input
                        id={key}
                        type="number"
                        inputMode="decimal"
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-full min-w-0 text-center text-[22px] font-bold text-gray-900 bg-transparent focus:outline-none"
                        placeholder={ph}
                      />
                      <span className="text-xs text-gray-500">mm</span>
                    </div>
                  </div>
                ))}
              </div>
              {['boardWidth', 'jointWidth', 'minBoardWidth'].map((k) =>
                errors[k] ? <p key={k} className="text-red-600 text-sm mt-1">{errors[k]}</p> : null
              )}

              <div className="text-[13px] font-bold text-gray-600 mt-3 mb-1">端の目地</div>
              <div className="grid grid-cols-3 bg-gray-100 rounded-lg p-1" role="radiogroup" aria-label="端の目地">
                {EDGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    role="radio"
                    aria-checked={edgeMode === opt.value}
                    onClick={() => setEdgeMode(opt.value)}
                    className={`py-2.5 rounded-md text-sm font-bold ${
                      edgeMode === opt.value ? 'bg-amber-500 text-white shadow' : 'text-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {chosenActive && (
                <div className="mt-3 text-[13px] text-amber-800 bg-amber-50 border border-amber-300 rounded-lg px-3 py-1.5">
                  ⚠ 条件を変えると、採用中の案は解除されます
                </div>
              )}
            </div>
          )}
        </div>

        {!results && !installWidth && (
          <div className="text-center px-5 py-10 text-gray-500">
            <div className="text-base font-bold text-gray-700 mb-2">施工幅を入力してください</div>
            <div className="text-[13px] leading-7">
              入力すると、すぐに候補が出ます。<br />
              使う案は「採用」で画面下に固定できます。
            </div>
          </div>
        )}

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
