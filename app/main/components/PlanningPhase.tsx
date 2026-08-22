// 📊 APIから返ってくるJSONの型定義
type ProposalData = {
  title: string;
  totalEstimatedHours: number;
  bufferHours: number;
  effectiveTotalHours: number;
  subtasks: { title: string; estimatedHours: number }[];
};

export default function PlanningPhase({ 
  proposal, 
  onApprove, 
  onReject 
}: { 
  proposal: ProposalData; 
  onApprove: () => void; 
  onReject: () => void; 
}) {
  return (
    <section className="bg-blue-50 p-6 rounded-xl border border-blue-200 animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-bold text-blue-900">AIが逆算計画を作成しました</h2>
          <p className="text-sm text-blue-700 mt-1">
            20%のバッファ（{proposal.bufferHours}時間）を確保し、実質総工数を再設定しました。
          </p>
        </div>
        <div className="text-right bg-white p-3 rounded shadow-sm border border-blue-100 text-sm">
          <p className="text-gray-500 mb-1">想定工数: {proposal.totalEstimatedHours}h</p>
          <p className="font-bold text-blue-700 text-base border-t pt-1">
            実質総工数: {proposal.effectiveTotalHours}h
          </p>
        </div>
      </div>
      
      {/* 🌟 AIが考えたサブタスクをループで表示 */}
      <ul className="bg-white rounded-lg border border-blue-100 divide-y divide-gray-100 mb-4">
        {proposal.subtasks.map((sub, index) => (
          <li key={index} className="p-3 flex justify-between hover:bg-gray-50 transition-colors">
            <span className="font-bold text-gray-800">
              {index + 1}. {sub.title}
            </span>
            <span className="text-gray-500 text-sm font-bold bg-gray-100 px-2 py-1 rounded">
              {sub.estimatedHours}h
            </span>
          </li>
        ))}
      </ul>

      <div className="flex gap-4">
        <button onClick={onApprove} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors">
          この計画で開始する (承認)
        </button>
        <button onClick={onReject} className="px-6 py-3 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors">
          修正してやり直す
        </button>
      </div>
    </section>
  );
}