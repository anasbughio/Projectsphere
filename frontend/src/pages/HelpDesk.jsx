import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Loader2, Plus, MessageSquare, TicketIcon, X, Send, AlertCircle, Paperclip, CheckCircle } from 'lucide-react';

const HelpDesk = () => {
 const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const rawRole = loggedInUser?.role || '';
  const userRole = rawRole.toString().trim().toLowerCase();
  
  // 2. Strict check for client
  const isClient = userRole === 'client';

  // Debugging log (You can check your browser console (F12) to see this)
  console.log("Logged in as:", userRole, "| Is Client?:", isClient);

  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('list'); 
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterTab, setFilterTab] = useState('Active'); 

  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'Medium' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chat states
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // File attachment state
  const fileInputRef = useRef(null);

  // CUSTOM ALERT (TOAST) STATE
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  // Custom Alert Helper Function
  const showCustomAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: 'success' });
    }, 3000); // close after 3 seconds
  };

  useEffect(() => {
    fetchTickets();
  }, []);

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
      showCustomAlert("Ticket created successfully!", "success"); // new Alert!
    } catch (error) {
      console.error("Error creating ticket:", error);
      showCustomAlert("Failed to create ticket.", "error"); // new Alert!
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert File to Base64 String
 const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if it's an image
      if (!file.type.match('image.*')) {
        showCustomAlert("Please select an image file", "error");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // Create an image element to read dimensions
        const img = new Image();
        img.src = reader.result;
        
        img.onload = () => {
          // Create a canvas for image compression
          const canvas = document.createElement('canvas');
          
          // Define maximum width (like WhatsApp compresses images)
          const MAX_WIDTH = 800; 
          let canvasWidth = img.width;
          let canvasHeight = img.height;

          // If image is larger than 800px wide, scale it down proportionally
          if (canvasWidth > MAX_WIDTH) {
            const scaleSize = MAX_WIDTH / canvasWidth;
            canvasWidth = MAX_WIDTH;
            canvasHeight = canvasHeight * scaleSize;
          }

          canvas.width = canvasWidth;
          canvas.height = canvasHeight;

          // Draw the compressed image on canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

          // Convert back to Base64 but as JPEG with 70% quality (0.7) to save massive space
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          setSelectedImage(compressedBase64); // Save the compressed string
        };
      };
      reader.readAsDataURL(file);
    }
  };
const openImageInNewTab = async (base64String) => {
    try {
      // Convert base64 to a raw binary blob
      const response = await fetch(base64String);
      const blob = await response.blob();
      // Create a temporary secure URL for it
      const blobUrl = URL.createObjectURL(blob);
      // Open the secure URL in a new tab
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
        attachment: selectedImage // Sending image to backend
      });
      setSelectedTicket(res.data); 
      setReplyMessage('');
      setSelectedImage(null); // Clear image after sending
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
      showCustomAlert(`Ticket marked as ${newStatus}`, "success"); // Naya Alert!
    } catch (error) {
      console.error("Error updating status:", error);
      showCustomAlert("Failed to update status", "error");
    }
  };

  const filteredTickets = tickets.filter(ticket => 
    filterTab === 'Active' ? ticket.status !== 'Closed' : ticket.status === 'Closed'
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-blue-500/20 text-blue-400';
      case 'In Progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'Waiting on Client': return 'bg-orange-500/20 text-orange-400';
      case 'Closed': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
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

  return (
    <div className="p-6 bg-[#121218] min-h-screen text-white relative">
      
      {/* BEAUTIFUL CUSTOM ALERT (TOAST) UI */}
      {alert.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-2xl transition-all duration-300 animate-fade-in-down border ${alert.type === 'success' ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]'}`}>
          {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-semibold text-sm">{alert.message}</span>
        </div>
      )}

      {/* Header Section */}
  <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TicketIcon className="text-[#7c7fff]" /> Support Tickets
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage client issues and requests</p>
        </div>

        {/* STRICT CONDITION: Must be in 'list' view AND strictly a 'client' */}
        {view === 'list' && isClient && (
          <button onClick={() => setView('create')} className="bg-[#7c7fff] hover:bg-[#6b6de0] text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 shadow-lg">
            <Plus size={18} /> New Ticket
          </button>
        )}

        {view !== 'list' && (
          <button onClick={() => setView('list')} className="bg-[#1a1c26] hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2">
            <X size={18} /> Close
          </button>
        )}
      </div>

      <div className="bg-[#1a1c26] rounded-xl border border-white/5 shadow-lg relative min-h-[600px] overflow-hidden flex flex-col">
        
        {isLoading && view === 'list' && (
          <div className="absolute inset-0 z-10 bg-[#1a1c26]/80 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#7c7fff]" size={40} />
          </div>
        )}

        {/* ================= VIEW 1: TICKET LIST ================= */}
        {view === 'list' && (
          <div className="p-4 overflow-auto custom-scrollbar flex-1">
            <div className="flex gap-4 mb-4 border-b border-white/10 pb-2">
              <button onClick={() => setFilterTab('Active')} className={`text-sm font-semibold pb-2 border-b-2 transition-all ${filterTab === 'Active' ? 'border-[#7c7fff] text-[#7c7fff]' : 'border-transparent text-gray-500 hover:text-white'}`}>Active Tickets</button>
              <button onClick={() => setFilterTab('Closed')} className={`text-sm font-semibold pb-2 border-b-2 transition-all ${filterTab === 'Closed' ? 'border-[#7c7fff] text-[#7c7fff]' : 'border-transparent text-gray-500 hover:text-white'}`}>Closed Tickets</button>
            </div>

            {filteredTickets.length === 0 && !isLoading ? (
              <div className="text-center text-gray-500 py-12">No {filterTab.toLowerCase()} tickets found.</div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map(ticket => (
                  <div key={ticket._id} onClick={() => { setSelectedTicket(ticket); setView('detail'); }} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#121218] border border-white/5 rounded-lg hover:border-[#7c7fff]/50 cursor-pointer transition-all gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-mono text-[#7c7fff] bg-[#7c7fff]/10 px-2 py-0.5 rounded">{ticket.ticketId}</span>
                        <h3 className="font-bold text-base">{ticket.title}</h3>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-1">{ticket.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <AlertCircle size={14} className={getPriorityColor(ticket.priority)} />
                        <span className="text-gray-300">{ticket.priority}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>{ticket.status}</div>
                      <div className="text-gray-500 flex items-center gap-1 text-xs">
                        <MessageSquare size={14} /> {ticket.messages?.length || 0}
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
           <form onSubmit={handleCreateTicket} className="p-6 max-w-2xl mx-auto w-full">
           {/* Form code unchanged */}
           <h2 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">Submit a New Request</h2>
           
           <div className="space-y-5">
             <div>
               <label className="block text-xs font-semibold text-[#84889c] mb-1.5 uppercase">Subject / Title</label>
               <input type="text" required value={newTicket.title} onChange={(e) => setNewTicket({...newTicket, title: e.target.value})} placeholder="Briefly describe the issue..." className="w-full px-4 py-2.5 bg-[#121218] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#7c7fff] transition" />
             </div>

             <div>
               <label className="block text-xs font-semibold text-[#84889c] mb-1.5 uppercase">Priority</label>
               <select value={newTicket.priority} onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})} className="w-full px-4 py-2.5 bg-[#121218] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#7c7fff] transition appearance-none cursor-pointer">
                 <option value="Low">Low - Not urgent</option>
                 <option value="Medium">Medium - Standard issue</option>
                 <option value="High">High - Blocking my work</option>
                 <option value="Urgent">Urgent - System down/Critical</option>
               </select>
             </div>

             <div>
               <label className="block text-xs font-semibold text-[#84889c] mb-1.5 uppercase">Description</label>
               <textarea required rows="5" value={newTicket.description} onChange={(e) => setNewTicket({...newTicket, description: e.target.value})} placeholder="Provide as much detail as possible..." className="w-full px-4 py-2.5 bg-[#121218] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#7c7fff] transition resize-none" ></textarea>
             </div>

             <div className="pt-4 flex justify-end">
               <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#7c7fff] hover:bg-[#6b6de0] transition disabled:opacity-50 flex items-center gap-2">
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
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-mono text-[#7c7fff]">{selectedTicket.ticketId}</span>
                  <h2 className="font-bold text-lg">{selectedTicket.title}</h2>
                </div>
                <div className="text-sm text-gray-400 flex items-center gap-4">
                  <span>Priority: <strong className={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</strong></span>
                  <span>Client: <strong>{selectedTicket.client?.name}</strong></span>
                </div>
              </div>
              
              {isClient ? (
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedTicket.status)}`}>{selectedTicket.status}</div>
              ) : (
                <select value={selectedTicket.status} onChange={(e) => handleStatusChange(e.target.value)} className={`px-4 py-1.5 rounded-full text-xs font-semibold appearance-none cursor-pointer outline-none transition-all border border-white/10 ${getStatusColor(selectedTicket.status)}`}>
                  <option value="Open" className="bg-[#121218] text-white">Open</option>
                  <option value="In Progress" className="bg-[#121218] text-white">In Progress</option>
                  <option value="Waiting on Client" className="bg-[#121218] text-white">Waiting on Client</option>
                  <option value="Closed" className="bg-[#121218] text-white">Closed (Resolved)</option>
                </select>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#1a1c26]">
              <div className="flex flex-col items-start max-w-[80%]">
                <span className="text-xs text-gray-400 mb-1 ml-1">{selectedTicket.client?.name} (Client)</span>
                <div className="bg-[#121218] border border-white/5 p-3 rounded-2xl rounded-tl-sm text-sm text-gray-200">
                  {selectedTicket.description}
                </div>
              </div>

              {selectedTicket.messages.map((msg, index) => {
                const isMsgClient = msg.sender?.role?.toLowerCase() === 'client';
                return (
                  <div key={index} className={`flex flex-col max-w-[80%] ${isMsgClient ? 'items-start self-start' : 'items-end self-end ml-auto'}`}>
                    <span className="text-xs text-gray-400 mb-1 mx-1">{msg.sender?.name} {isMsgClient ? '(Client)' : '(Support)'}</span>
                    <div className={`p-3 text-sm rounded-2xl ${isMsgClient ? 'bg-[#121218] border border-white/5 rounded-tl-sm text-gray-200' : 'bg-[#7c7fff] text-white rounded-tr-sm'}`}>
                      {/*  Render Attachment if exists */}
                      {msg.attachment && (
                        <div className="mb-2">
                          <img src={msg.attachment} alt="attachment" className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90" onClick={() => openImageInNewTab(msg.attachment)} />
                        </div>
                      )}
                      {msg.message && <span>{msg.message}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedTicket.status !== 'Closed' ? (
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-[#121218] shrink-0">
                {/* Show Selected Image Preview Before Sending */}
                {selectedImage && (
                  <div className="mb-3 relative inline-block">
                    <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-white/20" />
                    <button type="button" onClick={() => {setSelectedImage(null); fileInputRef.current.value='';}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12} /></button>
                  </div>
                )}
                
                <div className="flex items-center gap-3 relative">
                  {/*  Hidden File Input & Paperclip Icon */}
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current.click()} className="text-gray-400 hover:text-[#7c7fff] transition p-2 bg-[#1a1c26] rounded-xl">
                    <Paperclip size={18} />
                  </button>

                  <input type="text" value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Type your reply here..." className="flex-1 px-4 py-2.5 bg-[#1a1c26] border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#7c7fff] transition" />
                  <button type="submit" disabled={!replyMessage.trim() && !selectedImage} className="bg-[#7c7fff] hover:bg-[#6b6de0] text-white p-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <Send size={18} />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 border-t border-white/10 bg-[#121218] text-center text-sm text-gray-500 shrink-0">
                This ticket has been closed. You cannot reply to a closed ticket.
              </div>
            )}
          </div>
        )}

      </div>
      
      {/* Required for Custom Alert Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fadeInDown 0.3s ease-out; }
      `}} />
    </div>
  );
};

export default HelpDesk;