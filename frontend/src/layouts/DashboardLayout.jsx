import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar Placeholder */}
      <aside className="w-64 bg-slate-900 text-white p-4 hidden md:block">
        <h2 className="text-xl font-bold mb-6">ProjectSphere</h2>
        <nav>Menu Items...</nav>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Top Navbar Placeholder */}
        <header className="h-16 bg-white shadow-sm flex items-center px-6">
          <span className="text-slate-700 font-medium">Dashboard</span>
        </header>

        {/* Main Content Area */}
        <main className="p-6 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;