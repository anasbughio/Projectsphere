import React, { useState, useEffect } from 'react';
import { Folder, FileText, Download, Image as ImageIcon, Loader2 } from 'lucide-react';
import api from '../services/api';

const ClientFileHub = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClientFiles = async () => {
    try {
      // Backend par hum iski API banayenge jo sirf 'Approved' tasks ki files layegi
      const res = await api.get('/tasks/client/hub-files'); 
      setFiles(res.data);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientFiles();
  }, []);

  const getFileLink = (fileUrl) => {
    if (!fileUrl) return '#';
    if (fileUrl.startsWith('http')) return fileUrl;
    const liveBackend = "https://projectsphere-dlvv.onrender.com"; 
    const baseUrl = import.meta.env?.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.split('/api')[0] : liveBackend; 
    return `${baseUrl}${fileUrl}`;
  };

  const isImage = (fileName) => fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-[#7c7fff]" size={40} /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">File Hub</h2>
        <p className="text-[#84889c] text-sm">Access all your approved assets and deliverables in one place.</p>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 bg-[#1a1c26] rounded-2xl border border-white/5 p-8 text-center">
          <Folder size={64} className="text-white/10 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No files yet</h3>
          <p className="text-[#84889c] text-sm max-w-md">Once tasks are approved, their files and assets will automatically appear here for you to download.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {files.map((file, index) => (
            <div key={index} className="bg-[#1a1c26] rounded-xl border border-white/5 p-4 flex flex-col hover:border-[#7c7fff]/50 transition group shadow-sm">
              <div className="w-full h-32 bg-[#121218] rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-white/5 relative">
                {isImage(file.fileName) ? (
                  <img src={getFileLink(file.fileUrl)} alt={file.fileName} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                ) : (
                  <FileText size={40} className="text-[#606479] group-hover:text-[#7c7fff] transition" />
                )}
                {/* Hover overlay for download */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center backdrop-blur-sm">
                  <a href={getFileLink(file.fileUrl)} target="_blank" rel="noopener noreferrer" className="bg-[#7c7fff] p-2 rounded-full text-white hover:bg-[#6b6de0] transition shadow-lg">
                    <Download size={20} />
                  </a>
                </div>
              </div>
              
              <div className="flex flex-col flex-1">
                <h4 className="text-white text-sm font-bold truncate mb-1" title={file.fileName}>{file.fileName}</h4>
                <p className="text-[10px] text-[#7c7fff] font-medium uppercase tracking-wider mb-2">From: {file.taskTitle}</p>
                <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-[#606479]">{new Date(file.uploadedAt || Date.now()).toLocaleDateString()}</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">Approved</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientFileHub;