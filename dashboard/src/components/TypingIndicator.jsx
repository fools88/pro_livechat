// /dashboard/src/components/TypingIndicator.jsx
// 🆕 V22: Typing Indicator for Real-time Feedback

import React from 'react';
import '../styles/typing-indicator.css';

/**
 * Typing Indicator Component
 * Shows when someone is typing in a conversation
 * 
 * @param {Object} props
 * @param {Object} props.user - User object: { userType: 'admin' | 'visitor', userId: number }
 * @param {string} props.conversationId - Current conversation ID
 */
function TypingIndicator({ user, conversationId }) {
  console.log('[TypingIndicator] Rendered with user:', user, 'conversationId:', conversationId);
  console.log('[TypingIndicator] user type:', typeof user, 'user keys:', user ? Object.keys(user) : 'null');
  
  // Don't show if no one is typing (check if user exists AND has userType property)
  if (!user || !user.userType) {
    console.log('[TypingIndicator] No valid user typing, hiding. User:', user);
    return null;
  }

  const isVisitor = user.userType === 'visitor';
  const label = isVisitor ? 'Visitor sedang mengetik' : 'Agent sedang mengetik';
  
  console.log('[TypingIndicator] 🟢 SHOWING indicator:', label, 'for user:', user);

  return (
    <div className="typing-indicator">
      <span className="typing-text">💬 {label}</span>
      <span className="typing-dots">
        <span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </span>
    </div>
  );
}

export default TypingIndicator;
