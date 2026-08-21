export default function MonitoringPhase({ onOpenPanel }: { onOpenPanel: (mode: "yellow" | "red") => void }) {
  return (
    <section className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-bold">現在のタスク状況</h2>

      {/* 🔴 Red (危険) なメインタスク */}
      <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-red-500 border-y border-r border-gray-200 overflow-hidden">
        {/* メインタスクのヘッダー (ここにステータスとボタンを集約) */}
        <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">破綻寸前</span>
            <h3 className="text-lg font-bold mt-2 text-gray-800">競合他社リサーチと分析</h3>
            <p className="text-xs text-red-600 font-bold mt-1">全体のバッファ残量: 0% (進捗: 1/3)</p>
          </div>
          <button onClick={() => onOpenPanel("red")} className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold animate-pulse shadow-sm hover:bg-red-700">
            AIに救済を求める
          </button>
        </div>
        {/* 全体プログレスバー */}
        <div className="w-full bg-gray-200 h-1.5">
          <div className="bg-red-500 h-1.5 w-[33%]"></div>
        </div>
        {/* サブタスク一覧 (シンプルなただのチェックボックス) */}
        <div className="p-4 space-y-2 bg-white">
          <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-red-600" />
            <span className="text-gray-500 line-through text-sm">資料のアウトライン作成</span>
          </label>
          <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-red-600" />
            <span className="font-bold text-gray-800 text-sm">データ集計と分析</span>
          </label>
          <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-red-600" />
            <span className="font-bold text-gray-800 text-sm">10社の詳細レポート</span>
          </label>
        </div>
      </div>

      {/* 🟡 Yellow (警告) なメインタスク */}
      <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-yellow-500 border-y border-r border-gray-200 overflow-hidden">
        <div className="bg-yellow-50 p-4 border-b border-yellow-100 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">遅延の兆候あり</span>
            <h3 className="text-lg font-bold mt-2 text-gray-800">Q3マーケティング施策立案</h3>
            <p className="text-xs text-yellow-700 font-bold mt-1">全体のバッファ残量: 25% (進捗: 1/4)</p>
          </div>
          <button onClick={() => onOpenPanel("yellow")} className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-yellow-500">
            AIと相談する
          </button>
        </div>
        <div className="w-full bg-gray-200 h-1.5">
          <div className="bg-yellow-400 h-1.5 w-[25%]"></div>
        </div>
        <div className="p-4 space-y-2 bg-white">
          <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-yellow-600" />
            <span className="text-gray-500 line-through text-sm">過去データ洗い出し</span>
          </label>
          <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-yellow-600" />
            <span className="font-bold text-gray-800 text-sm">SNSキャンペーンの企画</span>
          </label>
          <p className="text-xs text-gray-400 ml-9 pt-1">他 2件のサブタスク...</p>
        </div>
      </div>

      {/* 🟢 Green (順調) なメインタスク */}
      <div className="bg-white rounded-xl shadow-sm border-l-4 border-l-green-500 border-y border-r border-gray-200 overflow-hidden">
        <div className="bg-green-50 p-4 border-b border-green-100 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">順調</span>
            <h3 className="text-lg font-bold mt-2 text-gray-800">LP（ランディングページ）改修</h3>
            <p className="text-xs text-green-700 font-bold mt-1">全体のバッファ残量: 100% (進捗: 0/2)</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 h-1.5">
          <div className="bg-green-500 h-1.5 w-[0%]"></div>
        </div>
        <div className="p-4 space-y-2 bg-white">
          <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-green-600" />
            <span className="font-bold text-gray-800 text-sm">ワイヤーフレーム作成</span>
          </label>
          <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-green-600" />
            <span className="font-bold text-gray-800 text-sm">コピーライティング</span>
          </label>
        </div>
      </div>

    </section>
  );
}