import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Shield, MoreVertical, Loader2, Users ,Trash2} from 'lucide-react';
import api from '../services/api';

const normalizeRole = (role) => {
  if (!role) return '';
  const normalized = role.toString().trim().toLowerCase();
  if (['Admin', 'Org Admin', 'organization admin'].includes(normalized)) return 'Admin';
  if (['member', 'team member'].includes(normalized)) return 'member';
  return normalized;
};

const Team = () => {
  const [team, setTeam] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Member');

  const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
const isAuthorized = () => {
  if (!storedUser?.role) return false;
  
  // Backend normalizeRole function jo logic use kar raha hai, wahi yahan use karein
  const role = storedUser.role.toString().trim().toLowerCase();
  
  // Backend mein 'Org Admin' normalize ho kar 'admin' ban jata hai
  // Isliye hum check karenge ke kya user admin, org admin, ya super admin hai
  return ['admin', 'org admin', 'organization admin', 'super admin'].includes(role);
};
const isAdminOrOrgAdmin = isAuthorized();
  if (!isAdminOrOrgAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#84889c]">
        <Shield size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>Only Admins can view team members.</p>
      </div>
    );
  }

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await api.delete(`/team/${memberId}`);
      setTeam(team.filter(m => m._id !== memberId));
    } catch (err) {
      alert('Failed to delete member');
    }
  };
  const isAdmin = normalizeRole(storedUser?.role) === 'Admin';

const fetchTeam = async () => {
  setLoading(true);
  try {
    // 🔥 `_t=${Date.now()}` add karne se browser cache bypass ho jayega
    const [membersResponse, invitesResponse] = await Promise.all([
      api.get(`/team/members?_t=${Date.now()}`),
      storedUser?.role !== 'Super Admin' ? api.get('/team/invitations') : { data: [] }
    ]);

    const members = (membersResponse.data || []).filter((user) => !user.isDeleted);
    const invites = (invitesResponse.data || []).filter((invite) => invite && invite.email);

    setTeam(members);
    setPendingInvites(invites);
  } catch (error) {
    console.error('Failed to load team', error);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchTeam();
  }, []);

  // Add New Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await api.post('/team/invite', { name, email, password, role });
      await fetchTeam();
      setIsModalOpen(false);
      
      // Reset Form
      setName(''); setEmail(''); setPassword(''); setRole('Member');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add team member');
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
      </div>
    );
  }
console.log("FRONTEND TEAM STATE:", team);
  return (
    <div className="h-full flex flex-col font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Team Workspace</h2>
          <p className="text-[#84889c] text-sm">Manage your team members and roles</p>
        </div>
        {isAdminOrOrgAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#7c7fff] hover:bg-[#6b6de0] text-white px-4 py-2.5 rounded-lg font-semibold transition shadow-lg shadow-[#7c7fff]/20"
          >
            <UserPlus size={18} />
            Add Member
          </button>
        )}
      </div>

      {/* Team Grid */}
      {team.length === 0 && pendingInvites.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-[#1a1c26]/50">
          <Users size={48} className="text-[#606479] mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No team members yet</h3>
          <p className="text-[#84889c] mb-6">Start building your team by adding members.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {team.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.filter((member) => member.organizationId)
              .map((member) => (
                <div key={member._id} className="bg-[#1a1c26] border border-white/5 rounded-xl p-5 hover:border-white/10 transition group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#7c7fff] to-[#5b5eb8] flex items-center justify-center text-lg font-bold text-white shadow-lg">
                      {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    
                    {(isAdminOrOrgAdmin || storedUser?.role === 'Super Admin') && (
                      <button
                        onClick={() => handleDeleteMember(member._id)}
                        className="text-[#606479] hover:text-red-400 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
                  
                  <div className="flex flex-col gap-2 mt-4">
                    {storedUser?.role === 'Super Admin' && (
        <div className="text-sm text-[#7c7fff]">
          Org: {member.organizationId?.name || 'N/A'}
        </div>
      )}
                    <div className="flex items-center gap-2 text-sm text-[#84889c]">
                      <Mail size={14} className="text-[#606479]" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#84889c]">
                      <Shield size={14} className="text-[#606479]" />
                      <span>{member.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingInvites.length > 0 && (
            <div className="bg-[#1a1c26]/70 border border-dashed border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Mail size={16} className="text-[#7c7fff]" />
                <h3 className="text-lg font-semibold text-white">Pending Invites</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingInvites.map((invite) => (
                  <div key={invite._id} className="bg-[#16171d] border border-white/5 rounded-xl p-4">
                    <p className="text-white font-medium">{invite.email}</p>
                    <p className="text-sm text-[#84889c] mt-1">Role: {invite.role}</p>
                    <span className="inline-flex mt-3 text-[11px] uppercase tracking-[0.2em] text-amber-400">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#2a2d3e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">Add Team Member</h3>
              <p className="text-[#84889c] text-sm mt-1">Invite a new user to your workspace.</p>
            </div>
            
            <form onSubmit={handleAddMember} className="p-6">
           
              <div className="flex flex-col gap-5 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Email Address</label>
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none focus:border-[#7c7fff]"
                    placeholder="member@team.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#84889c] mb-2 uppercase">Role</label>
                  <select 
                    value={role} onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#1a1c26] border border-white/5 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Org Admin">Org Admin (Full Access)</option>
                    <option value="Project Manager">Project Manager (Manage Projects)</option>
                    <option value="Team Member">Team Member (View & Edit Tasks)</option>
                    <option value="Client">Client (View Only)</option>
                  </select>
                </div>
              </div>


              <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[#a0a4b8] hover:text-white transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={isAdding} 
                  className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-[#7c7fff] hover:bg-[#6b6de0] transition min-w-[120px] flex justify-center"
                >
                  {isAdding ? <Loader2 size={16} className="animate-spin" /> : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;