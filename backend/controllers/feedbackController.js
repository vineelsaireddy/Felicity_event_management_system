import Feedback from '../models/Feedback.js';
import Event from '../models/Event.js';
import Participant from '../models/Participant.js';

// Submit feedback for an event
export const submitFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comments } = req.body;
    const participantId = req.user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Rating must be between 1 and 5',
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if participant has attended this event
    const attendedEvent = event.participants.find(
      (p) => p.participantId?.toString() === participantId && p.status === 'Attended'
    );

    if (!attendedEvent) {
      return res.status(403).json({
        message: 'You can only provide feedback for events you have attended',
      });
    }

    // Check if feedback already exists
    let feedback = await Feedback.findOne({
      eventId,
      participantId,
    });

    if (feedback) {
      // Update existing feedback
      feedback.rating = rating;
      feedback.comments = comments || '';
      await feedback.save();
      return res.json({
        message: 'Feedback updated successfully',
        feedback,
      });
    }

    // Create new feedback
    feedback = new Feedback({
      eventId,
      participantId,
      rating,
      comments: comments || '',
      isAnonymous: true,
    });

    await feedback.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      message: 'Error submitting feedback',
      error: error.message,
    });
  }
};

// Get feedback for an event (organizer only)
export const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    // Check if event exists and belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({
        message: 'You are not authorized to view this feedback',
      });
    }

    // Get all feedback for the event
    const feedback = await Feedback.find({ eventId }).select(
      '-participantId'
    );

    // Calculate statistics
    const totalFeedback = feedback.length;
    const averageRating = totalFeedback > 0
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback).toFixed(2)
      : 0;

    const ratingDistribution = {
      1: feedback.filter((f) => f.rating === 1).length,
      2: feedback.filter((f) => f.rating === 2).length,
      3: feedback.filter((f) => f.rating === 3).length,
      4: feedback.filter((f) => f.rating === 4).length,
      5: feedback.filter((f) => f.rating === 5).length,
    };

    res.json({
      feedback,
      statistics: {
        totalFeedback,
        averageRating,
        ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      message: 'Error fetching feedback',
      error: error.message,
    });
  }
};

// Get feedback filtered by rating (organizer only)
export const getEventFeedbackByRating = async (req, res) => {
  try {
    const { eventId, rating } = req.params;
    const organizerId = req.user.id;

    // Validate rating
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        message: 'Rating must be between 1 and 5',
      });
    }

    // Check if event exists and belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({
        message: 'You are not authorized to view this feedback',
      });
    }

    // Get feedback filtered by rating
    const feedback = await Feedback.find({
      eventId,
      rating: ratingNum,
    }).select('-participantId');

    res.json({
      rating: ratingNum,
      count: feedback.length,
      feedback,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      message: 'Error fetching feedback',
      error: error.message,
    });
  }
};

// Get participant's own feedback
export const getMyFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const participantId = req.user.id;

    const feedback = await Feedback.findOne({
      eventId,
      participantId,
    });

    if (!feedback) {
      return res.status(404).json({
        message: 'No feedback found for this event',
      });
    }

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      message: 'Error fetching feedback',
      error: error.message,
    });
  }
};

// Delete feedback (participant can only delete their own)
export const deleteFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const participantId = req.user.id;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (feedback.participantId.toString() !== participantId) {
      return res.status(403).json({
        message: 'You are not authorized to delete this feedback',
      });
    }

    await Feedback.findByIdAndDelete(feedbackId);

    res.json({
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      message: 'Error deleting feedback',
      error: error.message,
    });
  }
};

// Get aggregated feedback statistics for event
export const getEventFeedbackStats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    // Check if event exists and belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({
        message: 'You are not authorized to view this feedback',
      });
    }

    // Get feedback statistics
    const feedback = await Feedback.find({ eventId });
    const totalFeedback = feedback.length;
    const averageRating = totalFeedback > 0
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback).toFixed(2)
      : 0;

    const ratingDistribution = {
      1: feedback.filter((f) => f.rating === 1).length,
      2: feedback.filter((f) => f.rating === 2).length,
      3: feedback.filter((f) => f.rating === 3).length,
      4: feedback.filter((f) => f.rating === 4).length,
      5: feedback.filter((f) => f.rating === 5).length,
    };

    // Calculate percentages
    const ratingPercentages = {
      1: totalFeedback > 0 ? ((ratingDistribution[1] / totalFeedback) * 100).toFixed(2) : 0,
      2: totalFeedback > 0 ? ((ratingDistribution[2] / totalFeedback) * 100).toFixed(2) : 0,
      3: totalFeedback > 0 ? ((ratingDistribution[3] / totalFeedback) * 100).toFixed(2) : 0,
      4: totalFeedback > 0 ? ((ratingDistribution[4] / totalFeedback) * 100).toFixed(2) : 0,
      5: totalFeedback > 0 ? ((ratingDistribution[5] / totalFeedback) * 100).toFixed(2) : 0,
    };

    res.json({
      eventId,
      eventName: event.name,
      totalFeedback,
      averageRating,
      ratingDistribution,
      ratingPercentages,
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      message: 'Error fetching feedback stats',
      error: error.message,
    });
  }
};
