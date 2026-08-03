import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Lock, Eye, EyeOff, Plus, Trash2, Copy, Loader2 } from 'lucide-react';

const ProjectVault = ({ projectId }) => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [value, setValue] = useState('');

  useEffect(() => {
    fetchVault();
  }, [projectId]);

  const fetchVault = async () => {
    try {
      const response = await api.get(`/vault/${projectId}`);
      setCredentials(response.data);
    } catch (error) {
      console.error("Failed to load vault");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredential = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/vault', { projectId, title, username, value });
      setTitle('');
      setUsername('');
      setValue('');
      fetchVault();
    } catch (error) {
      console.error("Failed to add credential");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this credential permanently?")) return;
    try {
      await api.delete(`/vault/${id}`);
      setCredentials(credentials.filter(c => c._id !== id));
    } catch (error) {
      console.error("Failed to delete credential");
    }
  };

  const toggleVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#7c7fff]" size={24} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="text-emerald-400" size={20} />
        <h3 className="text-lg font-bold text-white">Encrypted Vault</h3>
      </div>

      {/* Add New Credential Form */}
      <form onSubmit={handleAddCredential} className="bg-[#1a1c26] p-4 rounded-xl border border-white/5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text" required placeholder="Service (e.g. AWS RDS)" value={title} onChange={(e) => setTitle(e.target.value)}
            className="px-3 py-2 bg-[#121218] border border-white/5 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c7fff]" 
          />
          <input 
            type="text" placeholder="Username / Email" value={username} onChange={(e) => setUsername(e.target.value)}
            className="px-3 py-2 bg-[#121218] border border-white/5 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c7fff]" 
          />
          <input 
            type="password" required placeholder="Password / API Key" value={value} onChange={(e) => setValue(e.target.value)}
            className="px-3 py-2 bg-[#121218] border border-white/5 rounded-lg text-sm text-white focus:outline-none focus:border-[#7c7fff]" 
          />
        </div>
        <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-gradient-to-r from-[#7c7fff] to-[#6b6de0] text-white px-4 py-2 rounded-lg font-semibold text-sm w-full md:w-auto justify-center">
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Secure Credential
        </button>
      </form>

      {/* Credentials List */}
      <div className="space-y-3">
        {credentials.map((cred) => (
          <div key={cred._id} className="bg-[#1a1c26] p-4 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white">{cred.title}</p>
              {cred.username && <p className="text-xs text-[#84889c]">User: {cred.username}</p>}
            </div>
            
            <div className="flex items-center gap-3 bg-[#121218] p-2 rounded-lg flex-1 md:max-w-xs border border-white/5">
              <input 
                type={visiblePasswords[cred._id] ? "text" : "password"} 
                value={cred.value} 
                readOnly 
                className="bg-transparent text-white text-sm w-full outline-none" 
              />
              <button type="button" onClick={() => toggleVisibility(cred._id)} className="text-[#84889c] hover:text-white transition">
                {visiblePasswords[cred._id] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button type="button" onClick={() => copyToClipboard(cred.value)} className="text-[#84889c] hover:text-white transition">
                <Copy size={16} />
              </button>
            </div>

            <button onClick={() => handleDelete(cred._id)} className="text-[#84889c] hover:text-red-400 transition">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {credentials.length === 0 && (
          <p className="text-[#84889c] text-sm text-center py-6 border border-dashed border-white/10 rounded-xl">No secure credentials stored yet.</p>
        )}
      </div>
    </div>
  );
};

export default ProjectVault;