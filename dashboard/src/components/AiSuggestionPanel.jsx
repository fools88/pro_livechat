import React from 'react';

export default function AiSuggestionPanel({ aiSuggestion, aiSuggestionMeta, onUse, onCopy, onDismiss }) {
  if (!aiSuggestion) return null;

  return (
    <div className="ai-suggestion-box">
      <div className="suggestion-header">
        <div className="suggestion-title">
          <span className="icon">💡</span>
          <span className="text">Saran AI</span>
          {aiSuggestionMeta?.categoryName && (
            <span className="category-badge">📚 {aiSuggestionMeta.categoryName}</span>
          )}
        </div>
        <div className="suggestion-confidence">
          <span
            className={`confidence-badge confidence-${
              aiSuggestion.confidence >= 90 ? 'high' : aiSuggestion.confidence >= 70 ? 'medium' : 'low'
            }`}
          >
            {aiSuggestion.confidence}% yakin
          </span>
        </div>
      </div>

      <div className="suggestion-content">
        <p className="suggestion-text">{aiSuggestion.text}</p>
        {aiSuggestion.reasoning && (
          <p className="suggestion-reasoning">
            <small>💭 {aiSuggestion.reasoning}</small>
          </p>
        )}
      </div>

      <div className="suggestion-actions">
        <button
          type="button"
          onClick={onUse}
          className="btn-use-suggestion btn-primary"
          title="Gunakan saran ini sebagai balasan"
        >
          ✓ Gunakan
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="btn-copy-suggestion btn-secondary"
          title="Copy ke clipboard untuk edit manual"
        >
          📋 Copy
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="btn-dismiss-suggestion btn-ghost"
          title="Tutup saran ini"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
