import Order from '../models/Order.js';
import Event from '../models/Event.js';
import Participant from '../models/Participant.js';
import { generateTicketId } from '../utils/auth.js';
import { generateQRCode } from '../utils/qrcode.js';
import { sendEmail } from '../utils/email.js';

// Place merchandise order
export const placeOrder = async (req, res) => {
  try {
    const { eventId, items } = req.body;
    const participantId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.type !== 'Merchandise') {
      return res.status(400).json({ message: 'This is not a merchandise event' });
    }

    // Calculate total amount and validate items
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const merchandiseItem = event.merchandise.items.find(
        (m) => m.itemId === item.itemId
      );

      if (!merchandiseItem) {
        return res.status(404).json({
          message: `Item ${item.itemId} not found in merchandise`,
        });
      }

      if (merchandiseItem.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${merchandiseItem.name}`,
        });
      }

      validatedItems.push({
        itemId: item.itemId,
        name: merchandiseItem.name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: merchandiseItem.price,
      });

      totalAmount += merchandiseItem.price * item.quantity;
    }

    // Create order
    const order = new Order({
      participantId,
      eventId,
      items: validatedItems,
      totalAmount,
      status: 'Pending Approval',
    });

    await order.save();

    res.status(201).json({
      message: 'Order created. Please upload payment proof to proceed.',
      orderId: order._id,
      totalAmount,
      items: validatedItems,
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Error placing order', error: error.message });
  }
};

// Upload payment proof
export const uploadPaymentProof = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const participantId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Payment proof image is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.participantId.toString() !== participantId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (order.status !== 'Pending Approval') {
      return res.status(400).json({
        message: 'Cannot upload proof for orders that are already processed',
      });
    }

    // Save file path (in production, use cloud storage like AWS S3)
    order.paymentProof = req.file.path;
    order.status = 'Pending Approval';
    await order.save();

    res.json({
      message: 'Payment proof uploaded successfully',
      orderId: order._id,
      status: order.status,
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({
      message: 'Error uploading payment proof',
      error: error.message,
    });
  }
};

// Get pending orders for organizer (only orders with payment proof uploaded)
export const getPendingOrders = async (req, res) => {
  try {
    const organizerId = req.user.id;

    // Get events organized by this user
    const events = await Event.find({ organizerId });
    const eventIds = events.map((e) => e._id);

    // Get pending orders that HAVE payment proof uploaded
    const orders = await Order.find({
      eventId: { $in: eventIds },
      status: 'Pending Approval',
      $and: [
        { paymentProof: { $exists: true } },
        { paymentProof: { $ne: null } },
        { paymentProof: { $ne: '' } },
      ],
    })
      .populate('participantId', 'firstName lastName email contactNumber')
      .populate('eventId', 'name type')
      .sort({ createdAt: -1 });

    res.json({
      count: orders.length,
      orders: orders.map((order) => ({
        orderId: order._id,
        participant: {
          id: order.participantId._id,
          name: `${order.participantId.firstName} ${order.participantId.lastName}`,
          email: order.participantId.email,
          contact: order.participantId.contactNumber,
        },
        event: order.eventId.name,
        items: order.items,
        totalAmount: order.totalAmount,
        paymentProof: order.paymentProof,
        status: order.status,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get ALL orders for organizer (history: Successful + Rejected + pending without proof)
export const getAllOrders = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const events = await Event.find({ organizerId });
    const eventIds = events.map((e) => e._id);

    const orders = await Order.find({ eventId: { $in: eventIds } })
      .populate('participantId', 'firstName lastName email contactNumber')
      .populate('eventId', 'name type')
      .sort({ createdAt: -1 });

    res.json({
      count: orders.length,
      orders: orders.map((order) => ({
        orderId: order._id,
        participant: {
          id: order.participantId._id,
          name: `${order.participantId.firstName} ${order.participantId.lastName}`,
          email: order.participantId.email,
          contact: order.participantId.contactNumber,
        },
        event: order.eventId.name,
        items: order.items,
        totalAmount: order.totalAmount,
        paymentProof: order.paymentProof,
        status: order.status,
        ticketId: order.ticketId,
        rejectionReason: order.rejectionReason,
        createdAt: order.createdAt,
        approvalDate: order.approvalDate,
      })),
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Error fetching all orders', error: error.message });
  }
};

// Approve order
export const approveOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const organizerId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'Pending Approval') {
      return res.status(400).json({
        message: 'Order is not in Pending Approval status',
      });
    }

    // Verify organizer owns this event
    const event = await Event.findById(order.eventId);
    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'Unauthorized to approve this order' });
    }

    // Generate ticket and QR code
    const ticketId = generateTicketId();
    const qrCode = await generateQRCode({
      ticketId,
      orderId: order._id,
      eventId: order.eventId,
      participantId: order.participantId,
    });

    // Update order to Successful (per spec)
    order.status = 'Successful';
    order.ticketId = ticketId;
    order.qrCode = qrCode;
    order.approvedBy = organizerId;
    order.approvalDate = new Date();
    await order.save();

    // Decrease stock
    const updatePromises = order.items.map((item) =>
      Event.updateOne(
        { _id: order.eventId, 'merchandise.items.itemId': item.itemId },
        { $inc: { 'merchandise.items.$.stock': -item.quantity } }
      )
    );
    await Promise.all(updatePromises);

    // Update event analytics
    event.analytics.totalRevenue += order.totalAmount;
    event.analytics.totalRegistrations += 1;
    await event.save();

    // Send approval email to participant
    const participant = await Participant.findById(order.participantId);
    const approvalEmailHtml = `
      <h2>Order Approved</h2>
      <p>Your merchandise order for <strong>${event.name}</strong> has been approved!</p>
      <p><strong>Order Total:</strong> ₹${order.totalAmount}</p>
      <p><strong>Ticket ID:</strong> ${ticketId}</p>
      <h3>Items Ordered:</h3>
      <ul>
        ${order.items.map((item) => `<li>${item.name} (${item.quantity}x) - ₹${item.price}</li>`).join('')}
      </ul>
      <p>Please present your ticket ID or QR code during merchandise pickup.</p>
    `;

    await sendEmail(
      participant.email,
      `Order Approved - ${event.name}`,
      approvalEmailHtml
    );

    res.json({
      message: 'Order approved successfully',
      orderId: order._id,
      ticketId,
      status: order.status,
    });
  } catch (error) {
    console.error('Error approving order:', error);
    res.status(500).json({ message: 'Error approving order', error: error.message });
  }
};

// Reject order
export const rejectOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const organizerId = req.user.id;
    const { rejectionReason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'Pending Approval') {
      return res.status(400).json({
        message: 'Order is not in Pending Approval status',
      });
    }

    // Verify organizer owns this event
    const event = await Event.findById(order.eventId);
    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'Unauthorized to reject this order' });
    }

    // Update order
    order.status = 'Rejected';
    order.rejectionReason = rejectionReason || 'Payment proof verification failed';
    order.approvedBy = organizerId;
    order.approvalDate = new Date();
    await order.save();

    // Send rejection email to participant
    const participant = await Participant.findById(order.participantId);
    const rejectionEmailHtml = `
      <h2>Order Rejected</h2>
      <p>Your merchandise order for <strong>${event.name}</strong> has been rejected.</p>
      <p><strong>Reason:</strong> ${order.rejectionReason}</p>
      <p>Please contact the event organizer if you have any questions.</p>
    `;

    await sendEmail(
      participant.email,
      `Order Rejected - ${event.name}`,
      rejectionEmailHtml
    );

    res.json({
      message: 'Order rejected successfully',
      orderId: order._id,
      status: order.status,
    });
  } catch (error) {
    console.error('Error rejecting order:', error);
    res.status(500).json({ message: 'Error rejecting order', error: error.message });
  }
};

// Get my orders (participant view)
export const getMyOrders = async (req, res) => {
  try {
    const participantId = req.user.id;

    const orders = await Order.find({ participantId })
      .populate('eventId', 'name type')
      .sort({ createdAt: -1 });

    res.json({
      count: orders.length,
      orders: orders.map((order) => ({
        orderId: order._id,
        eventId: order.eventId?._id || order.eventId,
        event: order.eventId?.name || '',
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentProof: order.paymentProof || null,
        ticketId: order.ticketId || null,
        rejectionReason: order.rejectionReason || null,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get order details
export const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user.id;

    const order = await Order.findById(orderId)
      .populate('participantId', 'firstName lastName email contactNumber')
      .populate('eventId', 'name type');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (order.participantId._id.toString() !== userId) {
      const event = await Event.findById(order.eventId);
      if (event.organizerId.toString() !== userId) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};
