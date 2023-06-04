import React, { useEffect, useState } from 'react';

const SpeechRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [decibelLevel, setDecibelLevel] = useState(0);
  const [decibelHistory, setDecibelHistory] = useState([]);

  const [isPaused, setIsPaused] = useState(false);
  let mediaStream = null;

  useEffect(() => {
    // let audioContext = null;
    // let scriptProcessorNode = null;
    let decibels = null;
    // let mediaStreamSource = null;
    const detectSilence = async (stream, onSoundEnd, onSoundStart, silenceDelay, minDecibels) => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      const streamNode = ctx.createMediaStreamSource(stream);

      // Create a script processor node with a buffer size of 2048
      const scriptNode = ctx.createScriptProcessor(4096, 1, 1);
      scriptNode.onaudioprocess = processAudio;
      streamNode.connect(scriptNode)
      scriptNode.connect(ctx.destination);
      streamNode.connect(analyser);


      analyser.minDecibels = minDecibels;
      analyser.maxDecibels = minDecibels + 80;

      const processAudio = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const outputData = event.outputBuffer.getChannelData(0);
  
        // Perform noise suppression here
        // Apply your noise suppression algorithm to attenuate the background noise
  
        // Copy the processed audio to the output buffer
        for (let i = 0; i < inputData.length; i++) {
          outputData[i] = inputData[i];
        }
  
        // Calculate noise level and decibel level
        const sumOfSquares = inputData.reduce((sum, value) => sum + value ** 2, 0);
        const rms = Math.sqrt(sumOfSquares / inputData.length);
        const noise = rms * Math.sqrt(2); // Assuming the input signal is a sine wave
  
        setNoiseLevel(noise);
        // setDecibelLevel(20 * Math.log10(noise));
        decibels = 20 * Math.log10(noise);
        if (isFinite(decibels)) {
          setDecibelLevel(decibels);
        }
      };

      const data = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart = performance.now();
      let triggered = false;

      function loop(time) {
        requestAnimationFrame(loop);
        analyser.getByteFrequencyData(data);

        // Calculate noise level as the average of all frequency data values
        // const average = Array.from(data).reduce((sum, value) => sum + value, 0) / data.length;
        // setNoiseLevel(average);

        // // Convert noise level to decibels
        // const decibels = 20 * Math.log10(average / 255);
        // if (isFinite(decibels)) {
        //   setDecibelLevel(decibels);
        // }

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

    const handlePauseActivity = () => {
      setIsPaused(true);
      setTimeout(() => {
        setIsPaused(false);
      }, 10000);
    };
    return (
      <div className="speech-recorder">
        <div className={`indicator ${isSpeaking ? 'speaking' : 'silence'}`} />
        <div>Noise Level: {noiseLevel.toFixed(2)}</div>
        <div className='face-container'>
      {noiseLevel <= 5 ? 'Excellent' :
        noiseLevel <= 10 ? 'Good' :
        noiseLevel <= 20 ? 'Bad' :
        'Poor'
      }
    </div>

        {isPaused ? (
          <div className="loading-frame">
            <span>Loading...</span>
          </div>
        ) : (
          <div>
            <button onClick={handleStartRecording} disabled={recording}>
              Start Recording
            </button>
            <button onClick={handleStopRecording} disabled={!recording}>
              Stop Recording
            </button>
            <button onClick={handlePauseActivity} disabled={isSpeaking}>
              Submit
            </button>
          </div>
        )}
      </div>
    );
  };


export default SpeechRecorder;
