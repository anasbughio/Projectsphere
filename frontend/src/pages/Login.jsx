const Login = () => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Sign In</h2>
      
      <form>
        {/* Inputs Block */}
        <div className="flex flex-col gap-4 mb-8">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="admin@organization.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
        </div>

        {/* Buttons Block */}
        <div className="flex flex-col gap-3">
          <button 
            type="button" 
            className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </button>
          <button 
            type="button" 
            className="w-full bg-slate-100 text-slate-700 font-bold py-2.5 rounded-lg hover:bg-slate-200 transition border border-slate-200"
          >
            Request Access
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;