// useVideoRecorder.js
import { useRef, useState } from 'react';

function useVideoRecorder(videoTrack) {
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);

  const startRecording = () => {
    if (!videoTrack || isRecording) return;

    const stream = new MediaStream([videoTrack.mediaStreamTrack.clone()]);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('file', blob);

      fetch('http://localhost:8000/upload_video', {
        method: 'POST',
        body: formData,
      })
      .then(response => response.json())
      .then(data => console.log('Video uploaded successfully:', data))
      .catch(error => console.error('Error uploading video:', error));

      setRecordedChunks([]);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return { startRecording, stopRecording, isRecording };
}

export default useVideoRecorder;
