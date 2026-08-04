import React from 'react';
import CustomFieldBuilder from '../components/CustomFieldBuilder';

const WorkspaceSettings = () => {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Basic check to ensure only admins see this
  const isAdmin = storedUser?.role?.toLowerCase().includes('admin');

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <p>You do not have permission to view workspace settings.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto w-full animate-in fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Workspace Settings</h2>
        <p className="text-sm text-[#84889c]">Manage your organization's custom workflows and configurations.</p>
      </div>

      {/* Render your new component here! */}
      <CustomFieldBuilder />
      
    </div>
  );
};

export default WorkspaceSettings;