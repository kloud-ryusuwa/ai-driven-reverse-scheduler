export default function PlanningPhase({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) {
  return (
    <section className="bg-blue-50 p-6 rounded-xl border border-blue-200 animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-bold text-blue-900">AIが逆算計画を作成しました</h2>
          <p className="text-sm text-blue-700 mt-1">20%のバッファを確保し、実質締切を再設定しました。</p>
        </div>
        <div className="text-right bg-white p-2 rounded shadow-sm border border-blue-100 text-sm">
          <p className="text-gray-500">絶対期日: 10/31</p>
          <p className="font-bold text-blue-700">実質期日: 10/25</p>
        </div>
      </div>
      <ul className="bg-white rounded-lg border border-blue-100 divide-y divide-gray-100 mb-4">
        <li className="p-3 flex justify-between"><span className="font-bold">1. 資料のアウトライン作成</span><span className="text-gray-500 text-sm">2時間</span></li>
        <li className="p-3 flex justify-between"><span className="font-bold">2. データ集計と分析</span><span className="text-gray-500 text-sm">5時間</span></li>
        <li className="p-3 flex justify-between"><span className="font-bold">3. 競合他社10社の詳細レポート</span><span className="text-gray-500 text-sm">8時間</span></li>
      </ul>
      <div className="flex gap-4">
        <button onClick={onApprove} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-blue-700">この計画で開始する (承認)</button>
        <button onClick={onReject} className="px-6 py-3 bg-white border border-gray-300 rounded-lg font-bold text-gray-700">修正してやり直す</button>
      </div>
    </section>
  );
}