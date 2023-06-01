import React, { useEffect, useState } from 'react';

const SpeechRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [decibelLevel, setDecibelLevel] = useState(0);
  const [decibelHistory, setDecibelHistory] = useState([]);
  let mediaStream = null;

  useEffect(() => {
    const detectSilence = (stream, onSoundEnd, onSoundStart, silenceDelay, minDecibels) => {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      const streamNode = ctx.createMediaStreamSource(stream);
      streamNode.connect(analyser);
      analyser.minDecibels = minDecibels;
      analyser.maxDecibels = minDecibels + 80;

      const data = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart = performance.now();
      let triggered = false;

      function loop(time) {
        requestAnimationFrame(loop);
        analyser.getByteFrequencyData(data);

        // Calculate noise level as the average of all frequency data values
        const average = Array.from(data).reduce((sum, value) => sum + value, 0) / data.length;
        setNoiseLevel(average);

        // Convert noise level to decibels
        const decibels = 20 * Math.log10(average / 255);
        if (isFinite(decibels)) {
          setDecibelLevel(decibels);
        }

        // Update decibel history
        setDecibelHistory((prevHistory) => [...prevHistory, decibels]);

        if (data.some((v) => v)) {
          if (triggered) {
            triggered = false;
            onSoundStart();
          }
          silenceStart = time;
        }
        if (!triggered && time - silenceStart > silenceDelay) {
          onSoundEnd();
          triggered = true;
        }
      }
      loop();
    };

    const onSilence = () => {
      console.log('silence');
      //actions to be performed on silence.
      setIsSpeaking(false);
    };

    const onSpeak = () => {
      console.log('speaking');
      //actions to be performed on speech detection. 
      setIsSpeaking(true);

    };

    if (recording) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaStream = stream;
          detectSilence(stream, onSilence, onSpeak, 500, -90);
        })
        .catch((error) => {
          console.error('Error accessing microphone:', error);
        });
    } else {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    }

    // Cleanup function
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [recording]);

  const handleStartRecording = () => {
    setRecording(true);
  };

  const handleStopRecording = () => {
    setRecording(false);
  };
   // Calculate the average decibel value
  //  const averageDecibel = decibelHistory.reduce((sum, decibel) => sum + decibel, 0) / decibelHistory.length;
  const filteredDecibelHistory = decibelHistory.filter((decibel) => isFinite(decibel));
  const averageDecibel = filteredDecibelHistory.length > 0
    ? filteredDecibelHistory.reduce((sum, decibel) => sum + decibel, 0) / filteredDecibelHistory.length
    : 0;

  return (
    <div className="speech-recorder">
      <div className={`indicator ${isSpeaking ? 'speaking' : 'silence'}`} />
      <div>Noise Level: {noiseLevel.toFixed(2)}</div>
      <div>Decibel Level: {decibelLevel.toFixed(2)}</div>
      <div>Average Decibel: {averageDecibel.toFixed(2)}</div>
      <div className='face-container'>
      {averageDecibel >= -40 ? 'Excellent' :
        averageDecibel >= -60 ? 'Good' :
        averageDecibel >= -80 ? 'Bad' :
        'Poor'
      }
    </div>
      <button onClick={handleStartRecording} disabled={recording}>
        Start Recording
      </button>
      <button onClick={handleStopRecording} disabled={!recording}>
        Stop Recording
      </button>
    </div>
  );
};

export default SpeechRecorder;
