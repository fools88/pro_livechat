import React from 'react';
import DownloadIcon from './icons/DownloadIcon';

export default function MessageFiles({ files = [], isPreview = false, onRemove }) {
  if (!files || files.length === 0) return null;

  if (isPreview) {
    return (
      <div className="file-preview">
        {files.map((file, index) => (
          <div key={index} className="file-preview-item">
            📎 {file.name}
            <button
              type="button"
              className="file-preview-remove"
              onClick={() => onRemove && onRemove(index)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="message-files">
      {files.map(file => (
        <div key={file.id || file.name} className="message-file-doc">
          <div className="file-left">
            <span className="file-icon">{file.mimeType && file.mimeType.startsWith('image/') ? '📷' : '📄'}</span>

            <div className="file-meta">
              <div className="file-name" title={file.originalFilename || file.name} aria-label={file.originalFilename || file.name}>
                {file.originalFilename || file.name}
              </div>
              <div className="file-size">{file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : ''}</div>
            </div>
          </div>

          <div className="file-row-actions">
            <button
              type="button"
              className="file-open-btn"
              onClick={() => window.open(`http://localhost:8081/api/files/${file.id}/download`, '_blank', 'noopener')}
              title={`Open ${file.originalFilename || file.name}`}
            >
              Open
            </button>

            <a
              href={`http://localhost:8081/api/files/${file.id}/download`}
              download
              className="file-download-btn"
              title={`Download ${file.originalFilename || file.name}`}
            >
              <DownloadIcon className="file-download-icon" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
