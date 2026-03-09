const StatCard = ({ icon, label, value, trend, trendColor }) => (
  <div className="bg-[#111827] border border-slate-800/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 rounded-xl bg-blue-900/20 flex items-center justify-center text-blue-300 text-xl border border-blue-800/30 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trendColor || 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
          {trend}
        </span>
      )}
    </div>
    <div className="space-y-1">
      <h3 className="text-3xl font-bold text-white">{value}</h3>
      <p className="text-slate-400 text-sm font-medium">{label}</p>
    </div>
    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
  </div>
)

export default StatCard;
