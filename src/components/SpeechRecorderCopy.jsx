import React, { useEffect, useState } from 'react';
// import {Chart} from 'chart.js'
import { Chart, registerables} from 'chart.js';

Chart.register(...registerables);

const SpeechRecorderCopy = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [noiseLevels, setNoiseLevels] = useState([]);
  const [noiseLevelsTotal, setNoiseLevelsTotal] = useState([]);
  const [noiseAverage, setNoiseAverage] = useState(0);
  const [audioCategory, setAudioCategory] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [chart, setChart] = useState(null);
  const [dataG, setDataG] = useState(null);
  const [length, setLength] = useState(1000);
  const [noiseObject, setNoiseObject] = useState({
    noiseLevel: 0,
    noiseLevels: [],
    noiseLevelsTotal: []
  })
  const windowSize = 200; // Adjust the window size as per your needs
  
  

  let mediaStream = null;
  var chartOptions = {
    scales: {
      y: {
        ticks: {
          callback: function(value, index, values) {
            // Customize the label for the desired range of values
            if (value >= 0 && value <= 5) {
              return 'Excellent';
            }
            else if (value > 5 && value <= 10) {
              return 'Good';
            }
            else if (value > 10 && value < 50) {
              return 'Bad';
            }
            // Use the default label for other values
            return value;
          }
        }
      }
    }
  };
  // let chart = null;


  useEffect(() => {
    const detectSilence = (stream, onSoundEnd, onSoundStart, silenceDelay, minDecibels) => {
      console.log("called")
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      const streamNode = ctx.createMediaStreamSource(stream);
      streamNode.connect(analyser);
      analyser.minDecibels = minDecibels;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const dataFFD = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart = performance.now();
      let triggered = true;
      
      // if(isPaused){
      //   setDataG(noiseAverage)

      //   chart.update()
      // }
      //  setDataG(isPaused? noiseLevelsTotal : noiseLevels);


      // Create the chart using the canvas element

//////////////////////////////////////////////////////Graph Settings ////////////////////////////////////////////////////////////////////////

    const ctxChart = document.getElementById('noiseGraph').getContext('2d');
    let xchart = new Chart(ctxChart, {
      type: 'line',
      options: chartOptions,
      data: {
        labels: Array.from({ length: windowSize }).fill(''),
        datasets: [
          {
            label: 'Noise Level',
            data: dataG,
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            suggestedMin: 0,
            suggestedMax: 40,
            ticks: {
              callback: function(value, index, values) {
                // Customize the label for the desired range of values
                if (value >= 0 && value <= 5) {
                  return 'Excellent';
                }
                else if (value > 5 && value <= 10) {
                  return 'Good';
                }
                else if (value > 10 && value <=20) {
                  return 'Bad';
                }
                else if (value > 20 && value < 50) {
                  return 'Poor';
                }
                // Use the default label for other values
                return value;
              }
            }
          },
        },
      },
    });
    setChart(xchart)



      function loop(time) {
        console.log(length)
        requestAnimationFrame(loop);
        analyser.getByteFrequencyData(data);

        

        // Calculate noise level as the average of all frequency data values
        const average = Array.from(data).reduce((sum, value) => sum + value, 0) / data.length;
        // setNoiseLevel(average);
        // // setNoiseLevelsTotal(prevLevels => [...prevLevels, average]); // Add the noise level to the array
        // setNoiseLevelsTotal(prevLevels => {
        //   const updatedLevels = [...prevLevels, average]; // Maintain the window size
        //   setNoiseAverage(calculateAverage(updatedLevels)); // Update the average based on the updated window
        //   return updatedLevels;
        // });
        // setNoiseLevels(prevLevels => {
        //   const updatedLevels = [...prevLevels, average].slice(-windowSize); // Maintain the window size
        //   setNoiseAverage(calculateAverage(updatedLevels)); // Update the average based on the updated window
        //   return updatedLevels;
        // });
        setNoiseObject((noiseObject)=>({...noiseObject,
           noiseLevel: average,
           noiseLevelsTotal: ()=>{
              const updatedLevels = [...noiseObject.noiseLevels, average]; // Maintain the window size
              console.log("hiii")
          return updatedLevels;
           },
           noiseLevels: ()=>{
              const updatedLevels = [...noiseObject.noiseLevels, average].slice(-windowSize); // Maintain the window size
          setNoiseAverage(calculateAverage(updatedLevels)); // Update the average based on the updated window
          return updatedLevels;
           },

           
           
        }));
        console.log(noiseObject.noiseLevelsTotal)
        console.log(noiseObject.noiseLevels)

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

  /////////////////////////////////////////////////////Chart UseEffect //////////////////////////////////////////////////////////////
 
  useEffect(() => {
    // Update the chart with the new noise levels
    // console.log(chart)
    if (chart) {
      if(isPaused){
        setDataG(noiseLevelsTotal);
        setLength(200);
      chart.data.datasets[0].data = noiseObject.noiseLevelsTotal;
      chart.update();
      

      }else{
        setLength(200);
        setDataG(noiseAverage)
        console.log("hi")
        chart.data.datasets[0].data = noiseObject.noiseLevels;
        // console.log(chart.data.datasets[0].data)
        chart.update();
      }

    }
  }, [noiseLevels]);

  



  const calculateAverage = (values) => {
    if (values.length === 0) {
      return 0;
    }
    const sum = values.reduce((total, level) => total + level, 0);
    return sum / values.length;
  };



  useEffect(() => {
    // console.log(noiseLevels)
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
          <div>Noise Level: {noiseObject.noiseLevel.toFixed(2)}</div>
          <div>Audio Category: {audioCategory}</div>
          </>
        )}
          <div className="canvas-container" >

          <canvas id="noiseGraph" width="200" height="100"></canvas>
          </div>
      
    </div>
  );
};

export default SpeechRecorderCopy;
