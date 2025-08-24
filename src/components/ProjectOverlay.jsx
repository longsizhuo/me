import React from "react";

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "#fff",
  zIndex: 1000,
  overflowY: "auto",
  color: "#000",
};

const topBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px 20px",
  borderBottom: "1px solid #ccc",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "10px",
  marginTop: "20px",
};

const buttonStyle = {
  padding: "10px 20px",
  backgroundColor: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const ProjectOverlay = ({
  open,
  onClose,
  onBack,
  title,
  description,
  photos = [],
  githubUrl,
  liveUrl,
}) => {
  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div style={topBarStyle}>
        <button onClick={onBack}>Return</button>
        <button onClick={onClose}>Close</button>
      </div>
      <div style={{ padding: "20px" }}>
        {title && <h2>{title}</h2>}
        {description && <p>{description}</p>}
        {photos.length > 0 && (
          <div style={gridStyle}>
            {photos.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`${title || "project"} screenshot ${index + 1}`}
                style={{ width: "100%", height: "auto" }}
              />
            ))}
          </div>
        )}
        {githubUrl && (
          <p style={{ marginTop: "20px" }}>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#007bff" }}
            >
              GitHub
            </a>
          </p>
        )}
        {liveUrl && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              style={buttonStyle}
              onClick={() => window.open(liveUrl, "_blank")}
            >
              View
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectOverlay;
