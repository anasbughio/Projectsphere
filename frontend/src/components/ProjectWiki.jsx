import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Save, Loader2, FileText, Clock } from 'lucide-react';
import api from '../services/api';
import { useToast } from './ToastProvider'; // Adjust path if needed

const ProjectWiki = ({ projectId }) => {
  const [content, setContent] = useState('');
  const [lastUpdatedBy, setLastUpdatedBy] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchWiki = async () => {
      try {
        const { data } = await api.get(`/wikis/project/${projectId}`);
        setContent(data.content);
        setLastUpdatedBy(data.lastUpdatedBy?.name);
        setLastUpdatedAt(data.updatedAt);
      } catch (error) {
        toast.push('Failed to load Wiki', { type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchWiki();
  }, [projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/wikis/project/${projectId}`, { content });
      setLastUpdatedBy(data.wiki.lastUpdatedBy?.name);
      setLastUpdatedAt(data.wiki.updatedAt);
      toast.push('Wiki document saved!', { type: 'success' });
    } catch (error) {
      toast.push('Failed to save document', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Custom Quill Modules for the toolbar
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };

  if (loading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#7c7fff]" size={32} /></div>;
  }

  return (
    <div className="bg-[#1a1c26] rounded-xl border border-white/5 overflow-hidden flex flex-col h-[70vh]">
      
      {/* Header Area */}
      <div className="p-4 border-b border-white/5 bg-[#121218] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3 text-white">
          <div className="p-2 bg-[#7c7fff]/20 text-[#7c7fff] rounded-lg">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-none mb-1">Project Wiki</h3>
            {lastUpdatedAt && (
              <span className="text-[10px] text-[#84889c] flex items-center gap-1">
                <Clock size={10} /> Last edited by {lastUpdatedBy || 'System'} on {new Date(lastUpdatedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-2 bg-[#7c7fff] hover:bg-[#6b6de0] text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Document
        </button>
      </div>

      {/* Rich Text Editor */}
      <div className="flex-1 overflow-hidden bg-white text-black p-4 quill-container">
        <ReactQuill 
          theme="snow" 
          value={content} 
          onChange={setContent} 
          modules={modules}
          className="h-full"
        />
      </div>

      {/* Global override to make Quill fit your dark UI container but keep text black for readability */}
      <style dangerouslySetInnerHTML={{__html: `
        .quill-container .ql-container { font-size: 16px; border: none; height: calc(100% - 42px); overflow-y: auto; }
        .quill-container .ql-toolbar { border: none; border-bottom: 1px solid #e5e7eb; background: #f9fafb; border-radius: 8px 8px 0 0; }
        .quill-container .ql-editor { padding: 20px; min-height: 100%; }
      `}} />
    </div>
  );
};

export default ProjectWiki;