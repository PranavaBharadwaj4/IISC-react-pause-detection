import React, { useState, useRef } from 'react';

const SendRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        console.log(stream);
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.addEventListener('dataavailable', handleDataAvailable);
        mediaRecorderRef.current.start();
        console.log(mediaRecorderRef);
        setIsRecording(true);
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDataAvailable = (event) => {
    if (event.data.size > 0) {
        console.log(event.data)
      chunksRef.current.push(event.data);
      console.log("hi", audioData)

    }
  };

  const sendAudioData = () => {
    if (chunksRef.current.length === 0) return;

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    setAudioData(blob);
    console.log(audioData);
    chunksRef.current = [];
    const websocket = new WebSocket('ws://localhost:8000');

    websocket.onopen = () => {
      websocket.send(blob);
      websocket.close();
    };
  };

  return (
    <div>
      <h1>Record Audio</h1>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      <button onClick={sendAudioData} >
        Send Audio Data
      </button>
    </div>
  );
};

export default SendRecording;
