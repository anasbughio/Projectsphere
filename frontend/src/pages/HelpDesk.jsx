import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Loader2, Plus, MessageSquare, TicketIcon, X, Send, AlertCircle, Paperclip, CheckCircle, Search, ArrowLeft, Clock } from 'lucide-react';

const HelpDesk = () => {
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const rawRole = loggedInUser?.role || '';
  const userRole = rawRole.toString().trim().toLowerCase();
  
  const isClient = userRole === 'client';

  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('list'); 
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterTab, setFilterTab] = useState('Active'); 
  const [searchTerm, setSearchTerm] = useState(''); // NEW: Search state

  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'Medium' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chat states
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); 
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null); // NEW: Auto-scroll ref

  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  const showCustomAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' });
    }, 3000); 
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // NEW: Auto-scroll to bottom of chat
  useEffect(() => {
    if (view === 'detail') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.messages, view]);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/tickets');
      const ticketData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setTickets(ticketData);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      showCustomAlert("Failed to load tickets", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/tickets', newTicket);
      setNewTicket({ title: '', description: '', priority: 'Medium' });
      setView('list'); 
      fetchTickets(); 
      showCustomAlert("Ticket created successfully!", "success"); 
    } catch (error) {
      console.error("Error creating ticket:", error);
      showCustomAlert("Failed to create ticket.", "error"); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        showCustomAlert("Please select an image file", "error");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; 
          let canvasWidth = img.width;
          let canvasHeight = img.height;

          if (canvasWidth > MAX_WIDTH) {
            const scaleSize = MAX_WIDTH / canvasWidth;
            canvasWidth = MAX_WIDTH;
            canvasHeight = canvasHeight * scaleSize;
          }

          canvas.width = canvasWidth;
          canvas.height = canvasHeight;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setSelectedImage(compressedBase64); 
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const openImageInNewTab = async (base64String) => {
    try {
      const response = await fetch(base64String);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error("Error opening image:", error);
      showCustomAlert("Failed to open image", "error");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() && !selectedImage) return;

    try {
      const res = await api.post(`/tickets/${selectedTicket._id}/message`, { 
        message: replyMessage,
        attachment: selectedImage 
      });
      setSelectedTicket(res.data); 
      setReplyMessage('');
      setSelectedImage(null); 
      if(fileInputRef.current) fileInputRef.current.value = '';
      fetchTickets(); 
    } catch (error) {
      console.error("Error sending message:", error);
      showCustomAlert("Failed to send message", "error");
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.patch(`/tickets/${selectedTicket._id}`, { status: newStatus });
      setSelectedTicket(res.data);
      fetchTickets(); 
      showCustomAlert(`Ticket marked as ${newStatus}`, "success"); 
    } catch (error) {
      console.error("Error updating status:", error);
      showCustomAlert("Failed to update status", "error");
    }
  };

  // UPDATED: Filter logic now includes search
  const filteredTickets = tickets.filter(ticket => {
    const matchesTab = filterTab === 'Active' ? ticket.status !== 'Closed' : ticket.status === 'Closed';
    const matchesSearch = 
      (ticket.title && ticket.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ticket.ticketId && ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'In Progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Waiting on Client': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Closed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': case 'Urgent': return 'text-red-400';
      case 'Medium': return 'text-yellow-400';
      case 'Low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  // NEW: Date formatter helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 bg-[#121218] min-h-screen text-white relative max-w-7xl mx-auto">
      
      {/* BEAUTIFUL CUSTOM ALERT (TOAST) UI */}
      {alert.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl transition-all duration-300 animate-fade-in-down border ${alert.type === 'success' ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'}`}>
          {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-semibold text-sm">{alert.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TicketIcon className="text-[#7c7fff]" /> Support Tickets
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage client issues and requests</p>
        </div>

        <div className="flex items-center gap-3">
          {view === 'list' && isClient && (
            <button onClick={() => setView('create')} className="bg-[#7c7fff] hover:bg-[#6b6de0] text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-[#7c7fff]/20">
              <Plus size={18} /> New Ticket
            </button>
          )}

          {view !== 'list' && (
            <button onClick={() => setView('list')} className="bg-[#1a1c26] hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2">
              <X size={18} /> Close
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#1a1c26] rounded-2xl border border-white/5 shadow-xl relative min-h-[600px] overflow-hidden flex flex-col">
        
        {isLoading && view === 'list' && (
          <div className="absolute inset-0 z-10 bg-[#1a1c26]/80 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
          </div>
        )}

        {/* ================= VIEW 1: TICKET LIST ================= */}
        {view === 'list' && (
          <div className="p-6 overflow-auto custom-scrollbar flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-white/10 pb-4">
              <div className="flex gap-6">
                <button onClick={() => setFilterTab('Active')} className={`text-sm font-semibold pb-4 -mb-4 border-b-2 transition-all ${filterTab === 'Active' ? 'border-[#7c7fff] text-[#7c7fff]' : 'border-transparent text-gray-500 hover:text-white'}`}>Active Tickets</button>
                <button onClick={() => setFilterTab('Closed')} className={`text-sm font-semibold pb-4 -mb-4 border-b-2 transition-all ${filterTab === 'Closed' ? 'border-[#7c7fff] text-[#7c7fff]' : 'border-transparent text-gray-500 hover:text-white'}`}>Closed Tickets</button>
              </div>
              
              {/* NEW: Search Bar */}
              <div className="flex items-center bg-[#121218] border border-white/10 rounded-lg px-3 py-1.5 focus-within:border-[#7c7fff] transition-colors w-full sm:w-64">
                <Search size={14} className="text-[#606479] mr-2" />
                <input 
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-sm text-white w-full"
                />
              </div>
            </div>

            {filteredTickets.length === 0 && !isLoading ? (
              <div className="text-center text-gray-500 flex flex-col items-center justify-center flex-1 py-12">
                <TicketIcon size={48} className="mb-4 opacity-20" />
                <p>No {filterTab.toLowerCase()} tickets found {searchTerm && `matching "${searchTerm}"`}.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map(ticket => (
                  <div key={ticket._id} onClick={() => { setSelectedTicket(ticket); setView('detail'); }} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#121218] border border-white/5 rounded-xl hover:border-[#7c7fff]/50 cursor-pointer transition-all gap-4 group">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-xs font-mono font-bold text-[#7c7fff] bg-[#7c7fff]/10 border border-[#7c7fff]/20 px-2 py-0.5 rounded-md">{ticket.ticketId}</span>
                        <h3 className="font-bold text-base group-hover:text-[#7c7fff] transition-colors">{ticket.title}</h3>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-1">{ticket.description}</p>
                    </div>
                    
                    <div className="flex items-center flex-wrap gap-3 md:gap-4 text-sm">
                      {/* NEW: Formatted Date */}
                      {ticket.createdAt && (
                        <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock size={12} />
                          {formatDate(ticket.createdAt)}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 bg-[#1a1c26] px-2.5 py-1 rounded-md border border-white/5">
                        <AlertCircle size={14} className={getPriorityColor(ticket.priority)} />
                        <span className="text-gray-300 text-xs font-medium">{ticket.priority}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </div>
                      <div className="text-gray-400 flex items-center gap-1.5 text-xs bg-[#1a1c26] px-2.5 py-1 rounded-md border border-white/5">
                        <MessageSquare size={14} className="text-[#606479]" /> {ticket.messages?.length || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: CREATE TICKET ================= */}
        {view === 'create' && (
           <form onSubmit={handleCreateTicket} className="p-8 max-w-2xl mx-auto w-full h-full flex flex-col">
             <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
               <button type="button" onClick={() => setView('list')} className="text-gray-400 hover:text-white transition p-1 bg-white/5 rounded-md"><ArrowLeft size={18} /></button>
               <h2 className="text-xl font-bold">Submit a New Request</h2>
             </div>
             
             <div className="space-y-5 flex-1">
               <div>
                 <label className="block text-xs font-bold text-[#84889c] mb-2 uppercase tracking-wider">Subject / Title</label>
                 <input type="text" required value={newTicket.title} onChange={(e) => setNewTicket({...newTicket, title: e.target.value})} placeholder="Briefly describe the issue..." className="w-full px-4 py-3 bg-[#121218] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#7c7fff] transition" />
               </div>

               <div>
                 <label className="block text-xs font-bold text-[#84889c] mb-2 uppercase tracking-wider">Priority</label>
                 <select value={newTicket.priority} onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})} className="w-full px-4 py-3 bg-[#121218] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#7c7fff] transition appearance-none cursor-pointer">
                   <option value="Low">Low - Not urgent</option>
                   <option value="Medium">Medium - Standard issue</option>
                   <option value="High">High - Blocking my work</option>
                   <option value="Urgent">Urgent - System down/Critical</option>
                 </select>
               </div>

               <div>
                 <label className="block text-xs font-bold text-[#84889c] mb-2 uppercase tracking-wider">Description</label>
                 <textarea required rows="6" value={newTicket.description} onChange={(e) => setNewTicket({...newTicket, description: e.target.value})} placeholder="Provide as much detail as possible..." className="w-full px-4 py-3 bg-[#121218] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#7c7fff] transition resize-none" ></textarea>
               </div>

               <div className="pt-6 flex justify-end">
                 <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-[#7c7fff] hover:bg-[#6b6de0] transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#7c7fff]/20">
                   {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Ticket'}
                 </button>
               </div>
             </div>
           </form>
        )}

        {/* ================= VIEW 3: TICKET DETAIL & CHAT ================= */}
        {view === 'detail' && selectedTicket && (
          <div className="flex flex-col h-full absolute inset-0">
            <div className="p-4 border-b border-white/10 bg-[#121218] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                {/* NEW: Go Back Button */}
                <button onClick={() => setView('list')} className="text-gray-400 hover:text-white transition p-2 bg-white/5 hover:bg-white/10 rounded-lg">
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono font-bold text-[#7c7fff] bg-[#7c7fff]/10 border border-[#7c7fff]/20 px-2 py-0.5 rounded-md">{selectedTicket.ticketId}</span>
                    <h2 className="font-bold text-lg">{selectedTicket.title}</h2>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-4 mt-1.5">
                    <span className="flex items-center gap-1.5">Priority: <strong className={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</strong></span>
                    <span className="text-[#606479]">•</span>
                    <span>Client: <strong className="text-gray-300">{selectedTicket.client?.name}</strong></span>
                  </div>
                </div>
              </div>
              
              {isClient ? (
                <div className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${getStatusColor(selectedTicket.status)}`}>{selectedTicket.status}</div>
              ) : (
                <select value={selectedTicket.status} onChange={(e) => handleStatusChange(e.target.value)} className={`px-4 py-2 rounded-lg text-xs font-bold appearance-none cursor-pointer outline-none transition-all border ${getStatusColor(selectedTicket.status)}`}>
                  <option value="Open" className="bg-[#121218] text-white">Open</option>
                  <option value="In Progress" className="bg-[#121218] text-white">In Progress</option>
                  <option value="Waiting on Client" className="bg-[#121218] text-white">Waiting on Client</option>
                  <option value="Closed" className="bg-[#121218] text-white">Closed (Resolved)</option>
                </select>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#1a1c26]">
              {/* Original Ticket Description */}
              <div className="flex flex-col items-start max-w-[85%] sm:max-w-[70%]">
                <span className="text-xs text-gray-500 mb-1.5 ml-1 font-medium">{selectedTicket.client?.name} (Client) <span className="mx-1">•</span> {formatDate(selectedTicket.createdAt)}</span>
                <div className="bg-[#121218] border border-white/5 p-4 rounded-2xl rounded-tl-sm text-sm text-gray-200 leading-relaxed shadow-sm">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Chat Messages */}
              {selectedTicket.messages.map((msg, index) => {
                const isMsgClient = msg.sender?.role?.toLowerCase() === 'client';
                return (
                  <div key={index} className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMsgClient ? 'items-start self-start' : 'items-end self-end ml-auto'}`}>
                    <span className="text-[10px] text-gray-500 mb-1.5 mx-1 font-medium flex items-center gap-1.5">
                      {isMsgClient ? '' : <span className="text-[#606479]">{formatDate(msg.createdAt)} <span className="mx-1">•</span></span>}
                      {msg.sender?.name} {isMsgClient ? '(Client)' : '(Support)'}
                      {isMsgClient ? <span className="text-[#606479]"><span className="mx-1">•</span> {formatDate(msg.createdAt)}</span> : ''}
                    </span>
                    <div className={`p-4 text-sm rounded-2xl shadow-sm ${isMsgClient ? 'bg-[#121218] border border-white/5 rounded-tl-sm text-gray-200' : 'bg-[#7c7fff] text-white rounded-tr-sm'}`}>
                      {msg.attachment && (
                        <div className="mb-3">
                          <img src={msg.attachment} alt="attachment" className="max-w-full sm:max-w-[250px] max-h-[250px] rounded-lg object-cover cursor-zoom-in hover:opacity-90 border border-black/10 transition-opacity" onClick={() => openImageInNewTab(msg.attachment)} />
                        </div>
                      )}
                      {msg.message && <span className="leading-relaxed whitespace-pre-wrap">{msg.message}</span>}
                    </div>
                  </div>
                );
              })}
              {/* NEW: Invisible div for auto-scrolling */}
              <div ref={messagesEndRef} />
            </div>

            {selectedTicket.status !== 'Closed' ? (
              <form onSubmit={handleSendMessage} className="p-4 sm:p-5 border-t border-white/10 bg-[#121218] shrink-0">
                {selectedImage && (
                  <div className="mb-3 relative inline-block animate-fade-in-down">
                    <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg border-2 border-[#7c7fff]" />
                    <button type="button" onClick={() => {setSelectedImage(null); fileInputRef.current.value='';}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition"><X size={14} /></button>
                  </div>
                )}
                
                <div className="flex items-center gap-2 sm:gap-3 relative">
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current.click()} className="text-gray-400 hover:text-white hover:bg-white/10 transition p-2.5 sm:p-3 bg-[#1a1c26] rounded-xl border border-white/5">
                    <Paperclip size={20} />
                  </button>

                  <input type="text" value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Type your reply here..." className="flex-1 px-4 py-3 bg-[#1a1c26] border border-white/5 rounded-xl text-sm focus:outline-none focus:border-[#7c7fff] transition" />
                  <button type="submit" disabled={!replyMessage.trim() && !selectedImage} className="bg-[#7c7fff] hover:bg-[#6b6de0] text-white p-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#7c7fff]/20">
                    <Send size={20} className={(!replyMessage.trim() && !selectedImage) ? "opacity-50" : ""} />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-5 border-t border-white/10 bg-[#121218] text-center text-sm font-medium text-gray-500 shrink-0">
                <CheckCircle size={16} className="inline mr-2 text-emerald-500/50" />
                This ticket has been closed. You cannot reply to a closed ticket.
              </div>
            )}
          </div>
        )}

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fadeInDown 0.2s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}} />
    </div>
  );
};

export default HelpDesk;