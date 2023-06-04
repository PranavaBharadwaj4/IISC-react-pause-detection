import React, { useEffect, useState } from 'react';

const SpeechRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [averageNoiseLevel, setAverageNoiseLevel] = useState(0);
  const [noiseSamples, setNoiseSamples] = useState([]);
  const [audioCategory, setAudioCategory] = useState('')

  let mediaStream = null;

  useEffect(() => {
    const detectSilence = (stream, onSoundEnd, onSoundStart, silenceDelay, minDecibels) => {
      const audioContext = new AudioContext();
      const analyserNode = audioContext.createAnalyser();
      const streamNode = audioContext.createMediaStreamSource(stream);
      streamNode.connect(analyserNode);
      analyserNode.minDecibels = minDecibels;

      const bufferLength = analyserNode.fftSize;
      const dataArray = new Uint8Array(bufferLength);

      let silenceStart = performance.now();
      let triggered = false;

      function loop(time) {
        requestAnimationFrame(loop);
        analyserNode.getByteFrequencyData(dataArray);

        // Calculate the average value of the frequency data
        const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;

        // Push the average value to the noise samples array
        setNoiseSamples((prevSamples) => {
          console.log(average)
          const updatedSamples = [...prevSamples, average];
          if (updatedSamples.length > 10 * (audioContext.sampleRate / analyserNode.fftSize)) {
            updatedSamples.shift();
          }
          return updatedSamples;
        });

        if (dataArray.some((v) => v)) {
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
          detectSilence(stream, onSilence, onSpeak, 500, -70);
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

  // useEffect(() => {
    // const calculateAverageNoiseLevel = () => {
    //   const sum = noiseSamples.reduce((total, value) => total + value, 0);
    //   return sum / noiseSamples.length;
    // };

    // console.log(noiseSamples)
    // const averageNoiseLevelInterval = setInterval(() => {
    //   const averageNoiseLevel = calculateAverageNoiseLevel();
    //   setAverageNoiseLevel(averageNoiseLevel);
    // }, 1000);

    // return () => clearInterval(averageNoiseLevelInterval);
    // if (noiseSamples.length > 10 * (audioContext.sampleRate / analyserNode.fftSize)) {
    //   setNoiseSamples((prevSamples) => prevSamples.slice(1));
    //   const averageNoiseLevel = calculateAverageNoiseLevel();
    //   setAverageNoiseLevel(averageNoiseLevel);
    // }

    
  // }, [noiseSamples]);


  useEffect(() => {
    const calculateAverageNoiseLevel = () => {
      const sum = noiseSamples.reduce((total, value) => total + value, 0);
      return sum / noiseSamples.length;
    };
    console.log(noiseSamples)
    const recursiveFunction = (recording) => {
      if (recording && averageNoiseLevel !== 0) {
        console.log('Calling the function again...');
        const averageNoise = calculateAverageNoiseLevel();
        console.log("avg: ",averageNoise)
        setAverageNoiseLevel(averageNoiseLevel);

        setTimeout(() => {
          recursiveFunction(recording);
        }, 1000);
      }
    };

    // Call the recursive function initially with the parameter set to true
    recursiveFunction(recording);

    // Clean up the timer when the component unmounts
    return () => clearTimeout(recursiveFunction);
  }, [recording]);


  useEffect(() => {
    if (averageNoiseLevel >= 80) {
      setAudioCategory('Excellent');
    } else if (averageNoiseLevel >= 60) {
      setAudioCategory('Good');
    } else if (averageNoiseLevel >= 40) {
      setAudioCategory('Bad');
    } else {
      setAudioCategory('Poor');
    }
  }, [averageNoiseLevel]);

  const handleStartRecording = () => {
    setRecording(true);
  };

  const handleStopRecording = () => {
    setRecording(false);
  };

  return (
    <div className="speech-recorder">
      <div className={`indicator ${isSpeaking ? 'speaking' : 'silence'}`} />
      <div>Noise Level: {averageNoiseLevel.toFixed(2)}</div>
      <div>Audio Category: {audioCategory}</div>
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
