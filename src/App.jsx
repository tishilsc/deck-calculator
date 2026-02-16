import React, { useState } from 'react';
import { Calculator, Hammer, AlertCircle, Info } from 'lucide-react';

export default function App() {
  const [installWidth, setInstallWidth] = useState('');
  const [boardWidth, setBoardWidth] = useState('150');
  const [jointWidth, setJointWidth] = useState('5');
  const [minBoardWidth, setMinBoardWidth] = useState('80');
  const [edgeJoints, setEdgeJoints] = useState(false);
  const [results, setResults] = useState(null);
  const [showVersionInfo, setShowVersionInfo] = useState(false);

  const version = '2026.02.16';
  const updateHistory = [
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
    const saved = localStorage.getItem('deckCalculatorHistory');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.installWidth) setInstallWidth(data.installWidth);
        if (data.boardWidth) setBoardWidth(data.boardWidth);
        if (data.jointWidth) setJointWidth(data.jointWidth);
        if (data.minBoardWidth) setMinBoardWidth(data.minBoardWidth);
        if (data.edgeJoints !== undefined) setEdgeJoints(data.edgeJoints);
      } catch (e) {
        // エラー時は無視
      }
    }
  }, []);

  // 値が変更されたら保存
  React.useEffect(() => {
    const data = {
      installWidth,
      boardWidth,
      jointWidth,
      minBoardWidth,
      edgeJoints
    };
    localStorage.setItem('deckCalculatorHistory', JSON.stringify(data));
  }, [installWidth, boardWidth, jointWidth, minBoardWidth, edgeJoints]);

  // 入力値のリアルタイムバリデーション
  React.useEffect(() => {
    const newErrors = {};
    
    const W = parseFloat(installWidth);
    const B = parseFloat(boardWidth);
    const J = parseFloat(jointWidth);
    const Bmin = parseFloat(minBoardWidth);

    if (installWidth && W <= 0) {
      newErrors.installWidth = '施工幅は0より大きい値を入力してください';
    }
    if (boardWidth && B <= 0) {
      newErrors.boardWidth = '床板幅は0より大きい値を入力してください';
    }
    if (jointWidth && J < 0) {
      newErrors.jointWidth = '目地幅は0以上の値を入力してください';
    }
    if (minBoardWidth && Bmin <= 0) {
      newErrors.minBoardWidth = '最低床板幅は0より大きい値を入力してください';
    }
    if (minBoardWidth && boardWidth && Bmin > B) {
      newErrors.minBoardWidth = '最低床板幅は床板幅以下にしてください';
    }

    setErrors(newErrors);
  }, [installWidth, boardWidth, jointWidth, minBoardWidth]);

  const shareResult = (result) => {
    const text = `【ウッドデッキ床板計算結果】
施工幅: ${installWidth}mm
床板幅: ${boardWidth}mm
目地幅: ${jointWidth}mm

【おすすめ案】
定尺板: ${result.standardBoards}枚 (${boardWidth}mm)
幅調整板: ${result.adjustedBoards}枚 (${result.adjustedWidth}mm)
カット幅: -${result.widthDiff}mm
合計: ${result.totalBoards}枚

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

  const calculateBoards = () => {
    const W = parseFloat(installWidth);
    const B = parseFloat(boardWidth);
    const J = parseFloat(jointWidth);
    const Bmin = parseFloat(minBoardWidth);

    if (!W || !B || !J || W <= 0 || B <= 0 || J < 0 || Bmin <= 0) {
      alert('正しい数値を入力してください');
      return;
    }

    if (Bmin > B) {
      alert('最低床板幅が通常の板幅より大きくなっています');
      return;
    }

    const solutions = [];

    // 最大30枚まで試行
    for (let totalBoards = 1; totalBoards <= 30; totalBoards++) {
      for (let adjustedBoards = 0; adjustedBoards <= totalBoards; adjustedBoards++) {
        const standardBoards = totalBoards - adjustedBoards;
        
        if (adjustedBoards === 0) continue;

        // 両端目地の有無で目地の数を調整
        const totalJoints = edgeJoints ? totalBoards + 1 : totalBoards - 1;
        const totalJointWidth = totalJoints * J;
        const availableWidth = W - totalJointWidth;
        const totalStandardWidth = standardBoards * B;
        const remainingWidth = availableWidth - totalStandardWidth;
        const adjustedWidth = remainingWidth / adjustedBoards;

        // 0.5mm単位に丸める
        const adjustedWidthRounded = Math.round(adjustedWidth * 2) / 2;

        if (adjustedWidthRounded >= Bmin && adjustedWidthRounded <= B) {
          const widthDiff = B - adjustedWidthRounded;
          solutions.push({
            totalBoards,
            standardBoards,
            adjustedBoards,
            adjustedWidth: adjustedWidthRounded,
            widthDiff: Math.round(widthDiff * 2) / 2,
            totalWidth: Math.round((standardBoards * B + adjustedBoards * adjustedWidthRounded + totalJointWidth) * 2) / 2
          });
        }
      }
    }

    // 調整枚数が少ない順、次に調整板の幅が広い順でソート
    solutions.sort((a, b) => {
      if (a.adjustedBoards !== b.adjustedBoards) {
        return a.adjustedBoards - b.adjustedBoards;
      }
      // 同じ調整枚数の場合、調整板の幅が広い方を優先
      return b.adjustedWidth - a.adjustedWidth;
    });

    // 同じ調整枚数のパターンがある場合、最も幅が広いもののみを残す
    const filteredSolutions = [];
    const seenAdjustedBoards = new Set();
    
    for (const solution of solutions) {
      if (!seenAdjustedBoards.has(solution.adjustedBoards)) {
        filteredSolutions.push(solution);
        seenAdjustedBoards.add(solution.adjustedBoards);
      }
    }

    setResults(filteredSolutions.slice(0, 5));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
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
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={edgeJoints}
                  onChange={(e) => setEdgeJoints(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-700">
                    両端にも目地を確保
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    壁や枠との間にも目地幅の隙間を設ける場合はチェック
                  </div>
                </div>
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
          <div className="space-y-4">
            {results.length === 0 ? (
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
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <p className="text-green-800 font-semibold text-center">
                    {results.length}件の提案が見つかりました
                  </p>
                </div>

                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-xl shadow-lg p-6 border-2 ${
                      index === 0 ? 'border-amber-400' : 'border-gray-200'
                    }`}
                  >
                    {index === 0 && (
                      <div className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                        おすすめ
                      </div>
                    )}
                    
                    <div className="text-2xl font-bold text-gray-800 mb-4">
                      案{index + 1}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-600 font-semibold mb-1">定尺板</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {result.standardBoards}枚
                        </div>
                        <div className="text-sm text-blue-700 mt-1">
                          {boardWidth}mm × {result.standardBoards}
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-sm text-orange-600 font-semibold mb-1">幅調整板</div>
                        <div className="text-2xl font-bold text-orange-900">
                          {result.adjustedBoards}枚
                        </div>
                        <div className="text-sm text-orange-700 mt-1">
                          {result.adjustedWidth}mm × {result.adjustedBoards}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">合計床板枚数:</span>
                        <span className="font-bold text-gray-800">{result.totalBoards}枚</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">カット幅:</span>
                        <span className="font-bold text-orange-600">
                          -{result.widthDiff}mm
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">実際の施工幅:</span>
                        <span className="font-bold text-gray-800">{result.totalWidth}mm</span>
                      </div>
                    </div>

                    {index === 0 && (
                      <button
                        onClick={() => shareResult(result)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        この結果を共有
                      </button>
                    )}
                  </div>
                ))}
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
            <li>• <strong>両端の目地</strong>: 壁や枠との間にも目地が必要な場合はチェック</li>
            <li>• 幅調整板は0.5mm単位で計算されます</li>
            <li>• 調整枚数が少なく、幅が広い順に表示されます</li>
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
    </div>
  );
}
