const Ticket = require('../models/Ticket');

// Create a new ticket (Usually triggered by the Client)
exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    // Generate a unique Ticket ID based on the current count in the organization
    // E.g., if there are 4 tickets, the new one will be TKT-1005
    const ticketCount = await Ticket.countDocuments({ organizationId: req.user.organizationId });
    const ticketId = `TKT-${1001 + ticketCount}`;

    const newTicket = await Ticket.create({
      ticketId,
      title,
      description,
      priority,
      client: req.user._id,
      organizationId: req.user.organizationId
    });

    res.status(201).json(newTicket);
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ message: error.message });
  }
};

// Fetch tickets based on user role (Client sees only their own; Team/Manager sees all org tickets)
exports.getTickets = async (req, res) => {
  try {
    let query = { organizationId: req.user.organizationId };

    // If the logged-in user is a client, restrict the query to their specific ID
    if (req.user.role.toLowerCase() === 'client') {
      query.client = req.user._id;
    }

    const tickets = await Ticket.find(query)
      .populate('client', 'name email')
      .populate('assignedTo', 'name email')
      .populate('messages.sender', 'name role') // Populate sender details for chat UI
      .sort({ createdAt: -1 }); // Display the newest tickets first

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: error.message });
  }
};

// Add a reply/message to an existing ticket thread
exports.addMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message ,attachment} = req.body;

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Append the new message to the ticket's messages array
    ticket.messages.push({
      sender: req.user._id,
      message: message || "",
      attachment: attachment || null
    });

    // Automatically update the status to 'In Progress' if a team member replies to an 'Open' ticket
    if (req.user.role.toLowerCase() !== 'client' && ticket.status === 'Open') {
      ticket.status = 'In Progress';
    }

    await ticket.save();

    // Re-fetch with populated sender data so the frontend can render the new message immediately
    const updatedTicket = await Ticket.findById(id).populate('messages.sender', 'name role');

    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Error adding message:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update ticket details like Status or Assignee (Usually triggered by Manager/Team)
exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { status, assignedTo },
      { new: true } // Return the updated document
    ).populate('client assignedTo', 'name email');

    res.status(200).json(ticket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({ message: error.message });
  }
};