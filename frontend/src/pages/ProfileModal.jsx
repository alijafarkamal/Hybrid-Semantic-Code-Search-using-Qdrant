import Icons from '../components/Icons';

const ProfileModal = ({
  isProfileModalOpen, setIsProfileModalOpen,
  isEditingProfile, setIsEditingProfile,
  profileData, setProfileData,
  profileUpdateLoading,
  handleUpdateProfile,
  newPassword, setNewPassword,
  showPassword, setShowPassword,
}) => {
  if (!isProfileModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#0f172a] border border-slate-800 rounded-[32px] w-full max-w-[325px] overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300 relative">
        <button
          onClick={() => setIsProfileModalOpen(false)}
          className="absolute right-5 top-5 text-rose-500 hover:text-rose-400 transition-all p-1.5 hover:bg-rose-500/10 rounded-xl"
        >
          <Icons.Close />
        </button>

        <div className="p-5 pt-8 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center text-xl font-black text-blue-400 mb-4 shadow-inner ring-4 ring-blue-500/5">
            {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <h2 className="text-2xl font-black text-white mb-0.5 tracking-tight">Your Profile</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-5">Manage Account</p>

          <div className="w-full bg-[#111827]/40 border border-slate-800/50 rounded-2xl p-4 mb-6 flex flex-col gap-4">
            {isEditingProfile ? (
              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block pl-1">Full Name</label>
                  <input
                    className="w-full bg-[#0b0f1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    value={profileData.name}
                    onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block pl-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full bg-[#0b0f1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    value={profileData.email}
                    onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block pl-1">New Password</label>
                  <div className="relative group/pass">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-[#0b0f1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none placeholder:text-slate-700 pr-12"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors"
                    >
                      {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-500/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileUpdateLoading}
                    className="flex-[2] py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                  >
                    {profileUpdateLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-400">
                    <Icons.User />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</p>
                    <p className="text-[15px] font-bold text-white leading-tight">{profileData.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-400">
                    <Icons.Mail />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</p>
                    <p className="text-[13px] font-bold text-white truncate leading-tight">{profileData.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-400">
                    <Icons.Database />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Account Role</p>
                    <p className="text-[14px] font-black text-emerald-400 uppercase tracking-tight leading-tight">{profileData.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full mt-2 py-3 bg-[#1e293b] border border-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.15em] hover:bg-blue-600 hover:border-blue-500 hover:shadow-blue-500/20 transition-all shadow-xl flex items-center justify-center gap-3 group"
                >
                  <Icons.Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500 text-blue-400 group-hover:text-white" />
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
