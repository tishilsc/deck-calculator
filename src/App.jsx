import React, { useState } from 'react';
import { Calculator, Hammer, AlertCircle } from 'lucide-react';

export default function App() {
  const [installWidth, setInstallWidth] = useState('3000');
  const [boardWidth, setBoardWidth] = useState('150');
  const [jointWidth, setJointWidth] = useState('5');
  const [minBoardWidth, setMinBoardWidth] = useState('80');
  const [edgeJoints, setEdgeJoints] = useState(true);
  const [results, setResults] = useState(null);

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
            <h1 className="text-2xl font-bold text-gray-800">ウッドデッキ床板計算ツール</h1>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                施工幅（mm）
              </label>
              <input
                type="number"
                value={installWidth}
                onChange={(e) => setInstallWidth(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-lg"
                placeholder="3000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                床板幅（mm）
              </label>
              <input
                type="number"
                value={boardWidth}
                onChange={(e) => setBoardWidth(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-lg"
                placeholder="150"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                目地幅（mm）
              </label>
              <input
                type="number"
                value={jointWidth}
                onChange={(e) => setJointWidth(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-lg"
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                最低床板幅（mm）
              </label>
              <input
                type="number"
                value={minBoardWidth}
                onChange={(e) => setMinBoardWidth(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none text-lg"
                placeholder="80"
              />
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
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg shadow-lg"
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

                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
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
        </div>
      </div>
    </div>
  );
}
