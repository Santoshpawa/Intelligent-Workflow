import { useRef, useState } from "react";
import "../styles/dashboard.css";
export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState([]);
  const fileInputRef = useRef(null);

  // handling drag events
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }
  function handleDragLeave() {
    setIsDragging(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  }
  function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  }

  function handleAttachFile() {
    fileInputRef.current.click();
  }
  function removeFile() {
    setFile(null);
    fileInputRef.current.value = null;
  }

  async function handleSearch(e) {
    if (e.key == "Enter" && (search.trim() || file)) {
      const userMessage = {
        text: search,
        fileName: file ? file.name : null,
      };
      setMessages((prev) => [...prev, userMessage]);
      setSearch("");
      setFile(null);

      const formData = new FormData();
      formData.append("prompt", search);
      if (file) {
        formData.append("file", file);
      }
      let response = await fetch(`http://127.0.0.1:8000/search`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      let data = await response.json();
      const aiMessage = { text: data.response };
      setMessages((prev) => [...prev, aiMessage]);
    }
  }

  return (
    <div className="chat-container">
      {/* for displaying the chat */}
      <div className="messages-list">
        {messages.map((msg, idx) => (
          <div key={idx} className="message-row">
            {/* We assume first message is user, second is AI. 
              Ideally, add 'sender' to your message object! */}
            <div
              className={`message-bubble ${
                idx % 2 === 0 ? "user-msg" : "ai-msg"
              }`}
            >
              {msg.text}
              {msg.fileName && (
                <div
                  style={{ fontSize: "11px", marginTop: "5px", opacity: 0.8 }}
                >
                  📁 {msg.fileName}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* for input search */}
      <div
        id="dashboardSearch"
        className={isDragging ? "dragging" : ""}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file && (
          <div className="selected-file-badge">
            <span>📄 {file.name}</span>
            <button className="remove-file-btn" onClick={removeFile}>
              ✕
            </button>
          </div>
        )}
        <input
          type="text"
          placeholder="Ask anything..."
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          value={search}
        />
        <button onClick={handleAttachFile}>📎</button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx"
        />
      </div>
    </div>
  );
}
