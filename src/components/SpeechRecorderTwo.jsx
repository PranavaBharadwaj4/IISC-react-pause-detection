import React, { useEffect, useState } from 'react';

const SpeechRecorder = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [noiseLevels, setNoiseLevels] = useState([]);
  const [noiseAverage, setNoiseAverage] = useState(0);
  const [audioCategory, setAudioCategory] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const windowSize = 100; // Adjust the window size as per your needs
  

  let mediaStream = null;

  useEffect(() => {
    const detectSilence = (stream, onSoundEnd, onSoundStart, silenceDelay, minDecibels) => {
      console.log("called")
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      const streamNode = ctx.createMediaStreamSource(stream);
      streamNode.connect(analyser);
      analyser.minDecibels = minDecibels;

      const data = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart = performance.now();
      let triggered = true;

      function loop(time) {
        requestAnimationFrame(loop);
        analyser.getByteFrequencyData(data);

        // Calculate noise level as the average of all frequency data values
        const average = Array.from(data).reduce((sum, value) => sum + value, 0) / data.length;
        setNoiseLevel(average);
        // setNoiseLevels(prevLevels => [...prevLevels, average]); // Add the noise level to the array
        setNoiseLevels(prevLevels => {
          const updatedLevels = [...prevLevels, average].slice(-windowSize); // Maintain the window size
          setNoiseAverage(calculateAverage(updatedLevels)); // Update the average based on the updated window
          return updatedLevels;
        });

        if (data.some((v) => v)) {
          if (triggered) {
            // setIsSpeaking(true);
            onSoundStart();
            triggered = false;   

          }
          silenceStart = time;
        }
        if (!triggered && time - silenceStart > silenceDelay) {
          console.log("silence block")
          onSoundEnd();
          triggered = true;
        }
      }
      loop();
    };

    const onSilence = () => {
      console.log("silence")
      setIsSpeaking(false);
      setIsPaused(true);
      setTimeout(() => {
        setIsPaused(false);
      }, 3000);
    };
    

    const onSpeak = () => {
      console.log('speaking');
      //actions to be performed on speech detection. 
      setIsSpeaking(true);

    };

    // Call detectSilence on load
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaStream = stream;
        detectSilence(stream, onSilence,onSpeak, 3000, -70);
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
      });

    // Cleanup function
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  // useEffect(() => {
  //   const calculateNoiseAverage = setInterval(() => {
  //     setNoiseAverage(noiseLevel);
  //   }, 10000);

  //   return () => {
  //     clearInterval(calculateNoiseAverage);
  //   };
  // }, [noiseLevel]);
  // useEffect(() => {
  //   if (noiseLevels.length > 0) {
  //     const sum = noiseLevels.reduce((total, level) => total + level, 0);
  //     const average = sum / noiseLevels.length;
  //     setNoiseAverage(average);
  //   }
  // }, [noiseLevels]);
  const calculateAverage = (values) => {
    if (values.length === 0) {
      return 0;
    }
    const sum = values.reduce((total, level) => total + level, 0);
    return sum / values.length;
  };

  useEffect(() => {
    if (noiseAverage < 5) {
      setAudioCategory('Excellent');
    } else if (noiseAverage < 10) {
      setAudioCategory('Good');
    } else if (noiseAverage < 20) {
      setAudioCategory('Bad');
    } else {
      setAudioCategory('Poor');
    }
  }, [noiseAverage]);

  return (
    <div className="speech-recorder">
      {isPaused ? (
          <div className="loading-frame">
            <span>Loading...</span>
          </div>
        ) : (
          <>
          <div className={`indicator ${isSpeaking ? 'speaking' : 'silence'}`} />
          <div className="average">Noise Average: {noiseAverage.toFixed(2)}</div>
          <div>Noise Level: {noiseLevel.toFixed(2)}</div>
          <div>Audio Category: {audioCategory}</div>
          </>
        )}
      
    </div>
  );
};

export default SpeechRecorder;
