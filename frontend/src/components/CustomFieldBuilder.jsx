import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from './ToastProvider';

const CustomFieldBuilder = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      const { data } = await api.get('/organizations/fields');
      setFields(data);
    } catch (error) {
      toast.push('Failed to load fields', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const addField = () => {
    setFields([...fields, { name: '', fieldType: 'text', options: [] }]);
  };

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const saveFields = async () => {
    setSaving(true);
    try {
      // Clean empty options before saving
      const cleanedFields = fields.map(f => ({
        ...f,
        options: f.fieldType === 'dropdown' ? f.options.filter(o => o.trim() !== '') : []
      }));
      await api.put('/organizations/fields', { customFields: cleanedFields });
      toast.push('Custom fields configured!', { type: 'success' });
    } catch (error) {
      toast.push('Failed to save configuration', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader2 className="animate-spin text-[#7c7fff] mx-auto" />;

  return (
    <div className="bg-[#1a1c26] p-6 rounded-xl border border-white/5">
      <h3 className="text-lg font-bold text-white mb-2">Workspace Custom Fields</h3>
      <p className="text-sm text-[#84889c] mb-6">Define custom data inputs that will appear on every task card.</p>

      <div className="space-y-4 mb-6">
        {fields.map((field, index) => (
          <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-[#121218] p-3 rounded-lg border border-white/5">
            
            <input 
              type="text" placeholder="Field Name (e.g., Bug Severity)" 
              value={field.name} onChange={(e) => updateField(index, 'name', e.target.value)}
              className="flex-1 bg-[#1a1c26] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7c7fff]"
            />
            
            <select 
              value={field.fieldType} onChange={(e) => updateField(index, 'fieldType', e.target.value)}
              className="bg-[#1a1c26] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none cursor-pointer w-full md:w-auto"
            >
              <option value="text">Short Text</option>
              <option value="number">Number</option>
              <option value="dropdown">Dropdown Select</option>
              <option value="url">URL / Link</option>
            </select>

            {field.fieldType === 'dropdown' && (
              <input 
                type="text" placeholder="Options (comma separated)" 
                value={field.options.join(', ')} 
                onChange={(e) => updateField(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                className="flex-1 bg-[#1a1c26] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7c7fff]"
              />
            )}

            <button onClick={() => removeField(index)} className="text-[#84889c] hover:text-red-400 p-2">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={addField} className="flex items-center gap-2 bg-[#121218] text-[#7c7fff] border border-[#7c7fff]/30 px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#7c7fff]/10 transition">
          <Plus size={16} /> Add Field
        </button>
        <button onClick={saveFields} disabled={saving} className="flex items-center gap-2 bg-[#7c7fff] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#6b6de0] transition">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Workspace Configuration
        </button>
      </div>
    </div>
  );
};

export default CustomFieldBuilder;