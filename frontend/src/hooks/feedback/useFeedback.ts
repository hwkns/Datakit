import { useState } from 'react';

interface FeedbackOptions {
  /** Optional context info to include with feedback */
  context?: string;
  /** Callback when feedback modal is opened */
  onOpen?: () => void;
  /** Callback when feedback modal is closed */
  onClose?: () => void;
  /** Callback when feedback is successfully submitted */
  onSuccess?: () => void;
}

interface UseFeedbackReturn {
  /** State for showing/hiding feedback modal */
  showFeedbackModal: boolean;
  /** Email input value */
  feedbackEmail: string;
  /** Feedback message input value */
  feedbackMessage: string;
  /** Loading state during submission */
  isSubmitting: boolean;
  /** Success state after submission */
  feedbackSuccess: boolean;
  /** Error message if submission fails */
  feedbackError: string;
  /** Function to open feedback modal */
  openFeedbackModal: () => void;
  /** Function to close feedback modal */
  closeFeedbackModal: () => void;
  /** Function to handle email input change */
  setFeedbackEmail: (email: string) => void;
  /** Function to handle message input change */
  setFeedbackMessage: (message: string) => void;
  /** Function to submit feedback */
  handleSubmitFeedback: () => Promise<void>;
}

/**
 * Custom hook to handle feedback functionality
 * 
 * NOTE: For Vite projects, use with a dedicated backend API or
 * email service with a client-side SDK.
 * 
 * @param options - Configuration options for feedback
 * @returns Object with feedback state and handlers
 */
export function useFeedback(options?: FeedbackOptions): UseFeedbackReturn {
  // Modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Form state
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  // Open feedback modal
  const openFeedbackModal = () => {
    setShowFeedbackModal(true);
    options?.onOpen?.();
  };

  // Close feedback modal
  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackSuccess(false);
    setFeedbackError('');
    options?.onClose?.();
  };

  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      setFeedbackError('Please provide some feedback before submitting.');
      return;
    }

    setIsSubmitting(true);
    setFeedbackError('');

    try {

      const response = await fetch(import.meta.env.VITE_FEEDBACK_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: feedbackMessage,
          email: feedbackEmail || 'Anonymous user',
          context: options?.context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send feedback');
      }

      /* 
      // OPTION 2: For development and testing - console log the feedback
      console.log('Feedback submitted:', {
        message: feedbackMessage,
        email: feedbackEmail || 'Anonymous user',
        context: options?.context,
        timestamp: new Date().toISOString()
      });
      */

      /* 
      // OPTION 3: Use a service with client SDK (like EmailJS)
      // You'll need to install and import the relevant package
      // import emailjs from '@emailjs/browser';
      
      await emailjs.send(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
        {
          from_email: feedbackEmail || 'Anonymous user',
          message: feedbackMessage,
          context: options?.context || 'No context provided'
        },
        'YOUR_PUBLIC_KEY'
      );
      */

      setFeedbackSuccess(true);
      setFeedbackMessage('');
      setFeedbackEmail('');
      
      // Notify of success
      options?.onSuccess?.();
      
      // Hide modal after success delay
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFeedbackSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error sending feedback:', error);
      setFeedbackError('Failed to send feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // State
    showFeedbackModal,
    feedbackEmail,
    feedbackMessage,
    isSubmitting,
    feedbackSuccess,
    feedbackError,
    
    // Handlers
    openFeedbackModal,
    closeFeedbackModal,
    setFeedbackEmail,
    setFeedbackMessage,
    handleSubmitFeedback
  };
}

export default useFeedback;