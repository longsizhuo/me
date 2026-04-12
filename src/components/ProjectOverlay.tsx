/* eslint-env browser */
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ProjectOverlayProps } from "./TYPE";

const ProjectOverlay = ({
  open,
  onClose,
  onBack,
  title,
  description,
  photos = [],
  githubUrl,
  liveUrl,
}: ProjectOverlayProps) => {
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  useEffect(() => {
    setIframeError(false);
  }, [liveUrl]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-tertiary z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-card border border-gray-600">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-600 bg-black-100 rounded-t-2xl sticky top-0 z-10">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-secondary text-black font-medium rounded-lg hover:bg-white transition-colors duration-200"
          >
            Return
          </button>
          <h3 className="text-white font-bold text-[20px] truncate mx-4">{title}</h3>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          {description && (
            <p className="text-secondary text-[16px] leading-[28px] mb-6">
              {description}
            </p>
          )}

          {/* Live Preview */}
          {liveUrl && !iframeError && (
            <div className="mb-6">
              <h4 className="text-white font-semibold text-[18px] mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Live Preview
              </h4>
              <div className="relative w-full rounded-xl overflow-hidden border border-gray-600 bg-white" style={{ height: "500px" }}>
                <iframe
                  src={liveUrl}
                  title={`${title} preview`}
                  className="w-full h-full"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  onError={() => setIframeError(true)}
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* Iframe blocked fallback */}
          {liveUrl && iframeError && (
            <div className="mb-6 p-4 bg-black-100 rounded-xl border border-gray-600 text-center">
              <p className="text-secondary mb-2">Preview unavailable — site blocks embedding.</p>
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Open in new tab
              </a>
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {photos.map((src, index) => (
                <div key={index} className="group relative overflow-hidden rounded-xl">
                  <img
                    src={src}
                    alt={`${title || "project"} screenshot ${index + 1}`}
                    className="w-full h-auto object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Links */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-secondary text-black font-semibold rounded-lg hover:bg-white transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
            )}

            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Live
              </a>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProjectOverlay;
