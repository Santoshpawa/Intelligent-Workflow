import { useRef, useState } from "react";
import "../styles/dashboard.css";
export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
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
  function handleFileChange(e){
    const selectedFile = e.target.files[0];
    if(selectedFile){
      setFile(selectedFile);
    }
  }

  function handleAttachFile(){
    fileInputRef.current.click();
  }
  function removeFile(){
    setFile(null);
    fileInputRef.current.value = null;
  }

  async function handleSearch(e) {
    if (e.key == "Enter") {
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
      console.log(data);
    }
  }

  return (
    <>
      <div
        id="dashboardSearch"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* DISPLAY FILE NAME HERE */}
        {file && (
          <div className="selected-file-badge">
            <span className="file-icon">📄</span>
            <span className="file-name">{file.name}</span>
            <button className="remove-file-btn" onClick={removeFile}>❌</button>
          </div>
        )}
        <input
          type="text"
          placeholder="Ask your question"
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearch}
        />
        <button onClick={handleAttachFile}>📎</button>
        {/* hidden input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx"
        />
      </div>
    </>
  );
}
