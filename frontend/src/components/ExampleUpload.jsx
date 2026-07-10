import React, { useState } from 'react';
import axios from 'axios';

export default function ExampleUpload() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFile = (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert('Choose a file');

    const fd = new FormData();
    fd.append('file', file); // must match multer field name 'file'

    try {
      const resp = await axios.post(
        (import.meta.env.VITE_API_URL || '/api') + '/v1/upload',
        fd,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          onUploadProgress: (ev) => setProgress(Math.round((ev.loaded / ev.total) * 100)),
        }
      );
      console.log('Upload response:', resp.data);
      alert('Uploaded: ' + resp.data.filePath);
    } catch (err) {
      console.error('Upload error', err);
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setProgress(0);
      setFile(null);
    }
  };

  return (
    <form onSubmit={handleUpload} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input type="file" name="file" onChange={handleFile} />
      <button type="submit">Upload</button>
      {progress > 0 && <div style={{ minWidth: 80 }}>Progress: {progress}%</div>}
    </form>
  );
}
