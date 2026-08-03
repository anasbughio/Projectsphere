import React, { useState, useEffect } from 'react';
import { Folder, FileText, Download, Image as ImageIcon, Loader2, Search, Filter } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/ToastProvider'; // Added toast integration

const ClientFileHub = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [fileFilter, setFileFilter] = useState('All'); 
  
  const toast = useToast();

  const fetchClientFiles = async () => {
    try {
      const res = await api.get('/tasks/client/hub-files'); 
      setFiles(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.push("Failed to load your approved files.", { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientFiles();
  }, []);

  // UPDATED: Robust URL helper to handle local vs production environments safely
  const getFileLink = (fileUrl) => {
    if (!fileUrl) return '#';
    if (fileUrl.startsWith('http')) return fileUrl;
    
    const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    const baseUrl = apiUrl.split('/api')[0];
    const formattedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    
    return `${baseUrl}${formattedPath}`;
  };

  const isImage = (fileName) => fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  // NEW: Filter Logic
  const filteredFiles = files.filter((file) => {
    const matchesSearch = 
      (file.fileName && file.fileName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.taskTitle && file.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesType = 
      fileFilter === 'All' ? true :
      fileFilter === 'Images' ? isImage(file.fileName) :
      !isImage(file.fileName); // Documents
      
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <div className="h-full flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-[#7c7fff]" size={40} /></div>;
  }

  return (
    <div className="flex flex-col h-full max-w-[1600px] mx-auto w-full p-2">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Deliverables Hub</h2>
          <p className="text-[#84889c] text-sm">Access, filter, and download all your approved project assets in one secure place.</p>
        </div>

        {/* NEW: Search & Filter Toolbar */}
        {files.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-[#1a1c26] border border-white/10 rounded-lg px-3 py-2 focus-within:border-[#7c7fff] transition-colors flex-1 sm:w-64">
              <Search size={16} className="text-[#606479] mr-2 shrink-0" />
              <input 
                type="text"
                placeholder="Search by file or task..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm text-white w-full"
              />
            </div>
            
            <div className="flex bg-[#1a1c26] border border-white/10 rounded-lg p-1 shrink-0">
              {['All', 'Images', 'Documents'].map(type => (
                <button
                  key={type}
                  onClick={() => setFileFilter(type)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    fileFilter === type 
                      ? 'bg-[#7c7fff] text-white shadow-md' 
                      : 'text-[#606479] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {type === 'Images' && <ImageIcon size={14} />}
                  {type === 'Documents' && <FileText size={14} />}
                  {type === 'All' && <Filter size={14} />}
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {files.length === 0 ? (
        // Absolute Zero State
        <div className="flex flex-col items-center justify-center flex-1 bg-[#1a1c26] rounded-2xl border border-white/5 p-12 text-center min-h-[400px] shadow-lg">
          <div className="bg-white/5 p-5 rounded-full mb-5 border border-white/10">
            <Folder size={48} className="text-[#7c7fff]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No deliverables yet</h3>
          <p className="text-[#84889c] text-sm max-w-md leading-relaxed">
            Once our team completes your tasks and they receive final approval, all associated files and assets will automatically appear here for you to download.
          </p>
        </div>
      ) : filteredFiles.length === 0 ? (
        // Search Empty State
        <div className="flex flex-col items-center justify-center flex-1 bg-[#1a1c26] rounded-2xl border border-white/5 p-12 text-center min-h-[300px]">
          <Search size={40} className="text-[#606479] mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-2">No files found</h3>
          <p className="text-[#84889c] text-sm max-w-md">
            We couldn't find any assets matching "{searchTerm}" under the "{fileFilter}" filter.
          </p>
          <button 
            onClick={() => { setSearchTerm(''); setFileFilter('All'); }}
            className="mt-4 text-[#7c7fff] text-sm hover:underline font-medium"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        // Files Grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredFiles.map((file, index) => {
            const isImg = isImage(file.fileName);
            return (
              <div key={index} className="bg-[#1a1c26] rounded-xl border border-white/5 p-4 flex flex-col hover:border-[#7c7fff]/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 group">
                
                <div className="w-full h-36 bg-[#121218] rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-white/5 relative">
                  {isImg ? (
                    <img src={getFileLink(file.fileUrl)} alt={file.fileName} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                  ) : (
                    <FileText size={48} className="text-[#606479] group-hover:text-[#7c7fff] group-hover:scale-110 transition-all duration-300" />
                  )}
                  
                  {/* Hover overlay for download */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <a 
                      href={getFileLink(file.fileUrl)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-[#7c7fff] p-3 rounded-full text-white hover:bg-[#6b6de0] transition-transform hover:scale-110 shadow-lg shadow-[#7c7fff]/20 flex items-center gap-2"
                      title="Download Asset"
                    >
                      <Download size={20} />
                    </a>
                  </div>
                </div>
                
                <div className="flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-white text-sm font-bold truncate" title={file.fileName}>{file.fileName}</h4>
                    {isImg ? <ImageIcon size={14} className="text-[#606479] shrink-0 mt-0.5"/> : <FileText size={14} className="text-[#606479] shrink-0 mt-0.5"/>}
                  </div>
                  
                  <p className="text-[10px] text-[#7c7fff] font-bold uppercase tracking-wider mb-3 truncate" title={file.taskTitle}>
                    {file.taskTitle}
                  </p>
                  
                  <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-[#606479] font-medium tracking-wide">
                      {new Date(file.uploadedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md font-bold border border-emerald-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                      Approved
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientFileHub;