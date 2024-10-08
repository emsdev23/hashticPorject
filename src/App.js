// App.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './App.css'; // Ensure this file contains the updated CSS below

const gridSize = 11;
const cellSizeVW = 6.4; // Size of each cell in viewport width units
const cellSizeVH = 5.5; // Size of each cell in viewport height units

function App() {
  const shortestPath_API = 'http://121.242.232.220:5005/shortest-path';

  // State for Pod 1
  const [sourcePod1, setSourcePod1] = useState({ x: 0, y: 0 });
  const [destinationPod1, setDestinationPod1] = useState({ x: 0, y: 0 });
  const [car1Coordinates, setCar1Coordinates] = useState([]);
  const [car1Index, setCar1Index] = useState(0);
  const [showCar1, setShowCar1] = useState(true);

  // State for Pod 2
  const [sourcePod2, setSourcePod2] = useState({ x: 0, y: 0 });
  const [destinationPod2, setDestinationPod2] = useState({ x: 0, y: 0 });
  const [car2Coordinates, setCar2Coordinates] = useState([]);
  const [car2Index, setCar2Index] = useState(0);
  const [showCar2, setShowCar2] = useState(true);

  // State for Pod 3
  const [sourcePod3, setSourcePod3] = useState({ x: 0, y: 0 });
  const [destinationPod3, setDestinationPod3] = useState({ x: 0, y: 0 });
  const [car3Coordinates, setCar3Coordinates] = useState([]);
  const [car3Index, setCar3Index] = useState(0);
  const [showCar3, setShowCar3] = useState(true);

  // State to store path mapping
  const [pathMap, setPathMap] = useState({});

  // Handlers for input changes
  const handleSourceChange = (event, setSource) => {
    const [x, y] = event.target.value.split(',').map(Number);
    // Validate input
    if (
      !isNaN(x) &&
      !isNaN(y) &&
      x >= 0 &&
      x < gridSize &&
      y >= 0 &&
      y < gridSize
    ) {
      setSource({ x, y });
    } else {
      // alert(`Invalid coordinates. Please enter values between 0 and ${gridSize - 1}, separated by a comma.`);
      return 0
    }
  };

  const handleDestinationChange = (event, setDestination) => {
    const [x, y] = event.target.value.split(',').map(Number);
    // Validate input
    if (
      !isNaN(x) &&
      !isNaN(y) &&
      x >= 0 &&
      x < gridSize &&
      y >= 0 &&
      y < gridSize
    ) {
      setDestination({ x, y });
    } else {
      return 0
      //alert(`Invalid coordinates. Please enter values between 0 and ${gridSize - 1}, separated by a comma.`);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Ensure that at least one pod has valid source and destination
    if (
      (sourcePod1.x === 0 && sourcePod1.y === 0 && destinationPod1.x === 0 && destinationPod1.y === 0) &&
      (sourcePod2.x === 0 && sourcePod2.y === 0 && destinationPod2.x === 0 && destinationPod2.y === 0) &&
      (sourcePod3.x === 0 && sourcePod3.y === 0 && destinationPod3.x === 0 && destinationPod3.y === 0)
    ) {
      alert("Please set at least one pod's source and destination coordinates.");
      return;
    }

    const requestData = {
      pods: [
        { pod_id: 1, source: [sourcePod1.x, sourcePod1.y], destination: [destinationPod1.x, destinationPod1.y] },
        { pod_id: 2, source: [sourcePod2.x, sourcePod2.y], destination: [destinationPod2.x, destinationPod2.y] },
        { pod_id: 3, source: [sourcePod3.x, sourcePod3.y], destination: [destinationPod3.x, destinationPod3.y] }
      ]
    };

    try {
      const response = await fetch(shortestPath_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      // Assuming data is an array with 3 elements, each having "pod X coordinates"
      if (Array.isArray(data) && data.length === 3) {
        setCar1Coordinates(data[0]["pod 1 coordinates"]);
        setCar2Coordinates(data[1]["pod 2 coordinates"]);
        setCar3Coordinates(data[2]["pod 3 coordinates"]);
        setCar1Index(0);
        setCar2Index(0);
        setCar3Index(0);
        setShowCar1(true);
        setShowCar2(true);
        setShowCar3(true);

        // Generate pathMap
        const newPathMap = {};

        // Pod 1
        data[0]["pod 1 coordinates"].forEach(coord => {
          const key = `${coord.x},${coord.y}`;
          if (!newPathMap[key]) newPathMap[key] = [];
          newPathMap[key].push(1);
        });

        // Pod 2
        data[1]["pod 2 coordinates"].forEach(coord => {
          const key = `${coord.x},${coord.y}`;
          if (!newPathMap[key]) newPathMap[key] = [];
          newPathMap[key].push(2);
        });

        // Pod 3
        data[2]["pod 3 coordinates"].forEach(coord => {
          const key = `${coord.x},${coord.y}`;
          if (!newPathMap[key]) newPathMap[key] = [];
          newPathMap[key].push(3);
        });

        setPathMap(newPathMap);
      } else {
        console.error("Unexpected response structure:", data);
        alert("Failed to retrieve valid path data from the server.");
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      alert("Error fetching coordinates. Please try again.");
    }
  };

  // Define the same base speed for each pod
  const baseSpeed = 1000; // milliseconds

  // Function to dynamically adjust speeds if pods are on the same path
  const getCarSpeed = (car1Index, car2Index, car3Index, car1Coordinates, car2Coordinates, car3Coordinates, baseSpeed) => {
    const car1Position = car1Coordinates[car1Index];
    const car2Position = car2Coordinates[car2Index];
    const car3Position = car3Coordinates[car3Index];

    // Check if two or more cars are on the same position
    if (car1Position && car2Position && car3Position) {
      // Case when all 3 pods are at the same coordinates
      if (
        car1Position.x === car2Position.x &&
        car1Position.y === car2Position.y &&
        car1Position.x === car3Position.x &&
        car1Position.y === car3Position.y
      ) {
        // Adjust the speed so that Pod 1 is slowest, Pod 2 faster, and Pod 3 fastest
        return {
          car1Speed: baseSpeed,
          car2Speed: baseSpeed + 100,
          car3Speed: baseSpeed + 200,
        };
      }

      // Case when Pod 1 and Pod 2 are at the same coordinates
      if (car1Position.x === car2Position.x && car1Position.y === car2Position.y) {
        return {
          car1Speed: baseSpeed,
          car2Speed: baseSpeed + 100,
          car3Speed: baseSpeed,
        };
      }

      // Case when Pod 1 and Pod 3 are at the same coordinates
      if (car1Position.x === car3Position.x && car1Position.y === car3Position.y) {
        return {
          car1Speed: baseSpeed,
          car2Speed: baseSpeed,
          car3Speed: baseSpeed + 100,
        };
      }

      // Case when Pod 2 and Pod 3 are at the same coordinates
      if (car2Position.x === car3Position.x && car2Position.y === car3Position.y) {
        return {
          car1Speed: baseSpeed,
          car2Speed: baseSpeed,
          car3Speed: baseSpeed + 100,
        };
      }
    }

    // If no overlaps, return base speed for all cars
    return {
      car1Speed: baseSpeed,
      car2Speed: baseSpeed,
      car3Speed: baseSpeed,
    };
  };

  // Calculate dynamic speeds based on current coordinates
  const carSpeeds = getCarSpeed(car1Index, car2Index, car3Index, car1Coordinates, car2Coordinates, car3Coordinates, baseSpeed);

  // UseEffect for Pod 1
  useEffect(() => {
    if (car1Coordinates.length > 0 && showCar1) {
      const car1Timeout = setTimeout(() => {
        setCar1Index((prev) => {
          if (prev + 1 === car1Coordinates.length) {
            setShowCar1(false);
            return prev;
          }
          return prev + 1;
        });
      }, carSpeeds.car1Speed);
      return () => clearTimeout(car1Timeout);
    }
  }, [car1Coordinates, car1Index, car2Index, car3Index, carSpeeds, showCar1]);

  // UseEffect for Pod 2
  useEffect(() => {
    if (car2Coordinates.length > 0 && showCar2) {
      const car2Timeout = setTimeout(() => {
        setCar2Index((prev) => {
          if (prev + 1 === car2Coordinates.length) {
            setShowCar2(false);
            return prev;
          }
          return prev + 1;
        });
      }, carSpeeds.car2Speed);
      return () => clearTimeout(car2Timeout);
    }
  }, [car2Coordinates, car1Index, car2Index, car3Index, carSpeeds, showCar2]);

  // UseEffect for Pod 3
  useEffect(() => {
    if (car3Coordinates.length > 0 && showCar3) {
      const car3Timeout = setTimeout(() => {
        setCar3Index((prev) => {
          if (prev + 1 === car3Coordinates.length) {
            setShowCar3(false);
            return prev;
          }
          return prev + 1;
        });
      }, carSpeeds.car3Speed);
      return () => clearTimeout(car3Timeout);
    }
  }, [car3Coordinates, car1Index, car2Index, car3Index, carSpeeds, showCar3]);

  // Function to get cell classes based on pathMap
  const getCellClass = (x, y) => {
    const key = `${x},${y}`;
    const podsPassing = pathMap[key];
    if (!podsPassing) return '';

    // Map pod IDs to their corresponding classes
    const classNames = podsPassing.map(podId => {
      switch (podId) {
        case 1:
          return 'path-pod1';
        case 2:
          return 'path-pod2';
        case 3:
          return 'path-pod3';
        default:
          return '';
      }
    });

    return classNames.join(' ');
  };

  return (  
    <div className="container">
      <p style={{fontSize:"25px",fontFamily:"sans-serif",color:"#0ca678",textAlign:"center",fontWeight:"700",marginBottom:"20px"}}>HASHTIC POD SIMULATION (10 X 10) GRID</p>
      <div className='podselction'>
        {/* Pod 1 input */}
        <div>
          <div className="input-group mb-3">
            <div className="input-group-prepend">
              <span className="input-group-text" id="basic-addon1" style={{ color: "#fff",backgroundColor:"#099268"}}>
                <b>POD_1 Source</b>
              </span>
            </div>
            <input
              name="pin"
              type="text"
              className="form-control"
              placeholder="eg:0,0"
              onChange={(e) => handleSourceChange(e, setSourcePod1)}
            />
          </div>
          <div className="input-group mb-3">
            <div className="input-group-prepend">
              <span className="input-group-text" id="basic-addon1" style={{  color: "#fff",backgroundColor:"#099268" }}>
                <b>POD_1 Destination</b>
              </span>
            </div>
            <input
              name="pin"
              type="text"
              className="form-control"
              placeholder="eg:0,0"
              onChange={(e) => handleDestinationChange(e, setDestinationPod1)}
            />
          </div>
        </div>

        {/* Pod 2 input */}
        <div>
          <div className="input-group mb-3">
            <div className="input-group-prepend">
              <span className="input-group-text" id="basic-addon1" style={{  color: "#fff",backgroundColor:"#099268"}}>
                <b>POD_2 Source</b>
              </span>
            </div>
            <input
              name="pin"
              type="text"
              className="form-control"
              placeholder="eg:0,0"
              onChange={(e) => handleSourceChange(e, setSourcePod2)}
            />
          </div>
          <div className="input-group mb-3">
            <div className="input-group-prepend">
              <span className="input-group-text" id="basic-addon1" style={{  color: "#fff",backgroundColor:"#099268" }}>
                <b>POD_2 Destination</b>
              </span>
            </div>
            <input
              name="pin"
              type="text"
              className="form-control"
              placeholder="eg:0,0"
              onChange={(e) => handleDestinationChange(e, setDestinationPod2)}
            />
          </div>
        </div>

        {/* Pod 3 input */}
        <div>
          <div className="input-group mb-3">
            <div className="input-group-prepend">
              <span className="input-group-text" id="basic-addon1" style={{ color: "#fff",backgroundColor:"#099268" }}>
                <b>POD_3 Source</b>
              </span>
            </div>
            <input
              name="pin"
              type="text"
              className="form-control"
              placeholder="eg:0,0"
              onChange={(e) => handleSourceChange(e, setSourcePod3)}
            />
          </div>
          <div className="input-group mb-3">
            <div className="input-group-prepend">
              <span className="input-group-text" id="basic-addon1" style={{  color: "#fff",backgroundColor:"#099268" }}>
                <b>POD_3 Destination</b>
              </span>
            </div>
            <input
              name="pin"
              type="text"
              className="form-control"
              placeholder="eg:0,0"
              onChange={(e) => handleDestinationChange(e, setDestinationPod3)}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-dark btn-lg" onClick={handleSubmit} >
          <b>START</b>
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid">
        {Array.from({ length: gridSize }).map((_, rowIndex) => (
          <div key={rowIndex} className="row">
            {Array.from({ length: gridSize }).map((_, colIndex) => (
              <div key={colIndex} className={`cell ${getCellClass(colIndex, rowIndex)}`}>
                {`(${colIndex},${rowIndex})`}
              </div>
            ))}
          </div>
        ))}

        {/* Car 1 */}
        {showCar1 && car1Coordinates.length > 0 && (
          <motion.div
            className="car"
            initial={{
              x: car1Coordinates[car1Index].x * cellSizeVW + 'vw',
              y: car1Coordinates[car1Index].y * cellSizeVH + 'vh',
            }}
            animate={{
              x: car1Coordinates[car1Index].x * cellSizeVW + 'vw',
              y: car1Coordinates[car1Index].y * cellSizeVH + 'vh',
            }}
            transition={{
              ease: "linear",
              duration: carSpeeds.car1Speed / 1000, // Use dynamically calculated speed
            }}
            style={{
              width: `${cellSizeVW}vw`,
              height: `${cellSizeVH}vh`,
            }}
          >
            {
              (sourcePod1.x === 0 && sourcePod1.y === 0 && destinationPod1.x === 0 && destinationPod1.y === 0) ? " " : <span>🚄</span>
            }
          </motion.div>
        )}

        {/* Car 2 */}
        {showCar2 && car2Coordinates.length > 0 && (
          <motion.div
            className="car"
            initial={{
              x: car2Coordinates[car2Index].x * cellSizeVW + 'vw',
              y: car2Coordinates[car2Index].y * cellSizeVH + 'vh',
            }}
            animate={{
              x: car2Coordinates[car2Index].x * cellSizeVW + 'vw',
              y: car2Coordinates[car2Index].y * cellSizeVH + 'vh',
            }}
            transition={{
              ease: "linear",
              duration: carSpeeds.car2Speed / 1000, // Use dynamically calculated speed
            }}
            style={{
              width: `${cellSizeVW}vw`,
              height: `${cellSizeVH}vh`,
            }}
          >
            {
              (sourcePod2.x === 0 && sourcePod2.y === 0 && destinationPod2.x === 0 && destinationPod2.y === 0) ? " " : <span>🚗</span>
            }
          </motion.div>
        )}

        {/* Car 3 */}
        {showCar3 && car3Coordinates.length > 0 && (
          <motion.div
            className="car"
            initial={{
              x: car3Coordinates[car3Index].x * cellSizeVW + 'vw',
              y: car3Coordinates[car3Index].y * cellSizeVH + 'vh',
            }}
            animate={{
              x: car3Coordinates[car3Index].x * cellSizeVW + 'vw',
              y: car3Coordinates[car3Index].y * cellSizeVH + 'vh',
            }}
            transition={{
              ease: "linear",
              duration: carSpeeds.car3Speed / 1000, // Use dynamically calculated speed
            }}
            style={{
              width: `${cellSizeVW}vw`,
              height: `${cellSizeVH}vh`,
            }}
          >
            {
              (sourcePod3.x === 0 && sourcePod3.y === 0 && destinationPod3.x === 0 && destinationPod3.y === 0) ? " " : <span>&#128645;</span>
            }
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default App;
