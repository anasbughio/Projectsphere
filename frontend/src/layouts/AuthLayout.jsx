import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-md p-6">
        <div className="mb-8 text-center">
          {/* <h1 className="text-3xl font-extrabold text-blue-600">ProjectSphere</h1> */}
          {/* <p className="text-slate-500 mt-2">Manage your multi-tenant projects</p> */}
        </div>
        {/* Child routes (Login/Signup) yahan render honge */}
        <Outlet /> 
      </div>
    </div>
  );
};

export default AuthLayout;