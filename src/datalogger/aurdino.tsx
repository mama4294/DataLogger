"use client";
import { Button } from "@/components/ui/button";
/// <reference types="w3c-web-serial" />

import React, { useState, useEffect, useRef } from "react";

const ArduinoComponent = ({
  port,
  setPort,
  setCurrentTemp,
  unit,
}: {
  port: SerialPort | null;
  setPort: React.Dispatch<React.SetStateAction<SerialPort | null>>;
  setCurrentTemp: React.Dispatch<React.SetStateAction<number | null>>;
  unit: string;
}) => {
  const [, setReader] = useState<TextDecoderStream | null>(null);
  const unitRef = useRef(unit);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const currentTempRef = useRef<number | null>(null);

  useEffect(() => {
    unitRef.current = unit;
  }, [unit]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  // Function to request and connect to a serial device
  const connectToSerialPort = async () => {
    try {
      // Request a port from the browser
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 9600 });

      // Set the port and create a reader to parse data
      setPort(selectedPort);
      const decoder = new TextDecoderStream();
      if (selectedPort.readable === null) {
        throw new Error("Serial port readable stream is null");
      }
      selectedPort.readable.pipeTo(decoder.writable);
      setReader(decoder);

      // Read the incoming data
      const readerStream = decoder.readable.getReader();
      readTemp(readerStream);
    } catch (err) {
      console.error("Error connecting to serial port:", err);
    }
  };

  const readTemp = async (
    readerStream: ReadableStreamDefaultReader<string>
  ) => {
    let buffer = ""; // Buffer to store incomplete lines

    while (true) {
      try {
        const { value, done } = await readerStream.read();
        if (done) {
          console.log("Stream closed");
          break;
        }

        if (value) {
          // Add new data to the buffer
          buffer += value;

          // Split buffer into lines using \r\n as the delimiter
          const lines = buffer.split("\r\n");

          // Process all complete lines except the last one (it may be incomplete)
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim(); // Remove extra whitespace

            // Parse temperature if the line is valid
            if (!isNaN(Number(line))) {
              const temperature = Number(parseFloat(line));
              setCurrentTemp(temperature);
            } else {
              console.warn(`Invalid data: ${line}`);
            }
          }

          // Keep the last incomplete line in the buffer
          buffer = lines[lines.length - 1];
        }
      } catch (readError) {
        console.error("Error reading data:", readError);
        break;
      }
    }
  };

  // const readTemp = async (
  //   readerStream: ReadableStreamDefaultReader<string>
  // ) => {
  //   // Read the incoming data
  //   while (true) {
  //     try {
  //       const { value, done } = await readerStream.read();
  //       console.log("Value: " + value);
  //       if (done) {
  //         console.log("Stream closed");
  //         break;
  //       }

  //       if (value) {
  //         const temperature = parseFloat(value);
  //         setCurrentTemp(temperature);
  //         console.log(`Temperature data received: ${temperature}`);
  //       }
  //     } catch (readError) {
  //       console.error("Error reading data:", readError);
  //       break;
  //     }
  //   }
  // };

  // Function to read incoming data from the serial port
  const readData = async (
    readerStream: ReadableStreamDefaultReader<string>
  ) => {
    while (true) {
      try {
        const { value, done } = await readerStream.read();
        if (done) break;

        const trimmedValue = value?.trim() || "";

        // Ensure the value is valid and non-blank
        if (!trimmedValue || isNaN(Number(trimmedValue))) {
          console.error("Invalid or blank data received:", value);
          continue; // Ignore invalid or blank data
        }

        const sensorValue = parseFloat(trimmedValue);

        // Prevent updating state if the value is the same as the current value
        if (sensorValue === currentTempRef.current) {
          continue; // Ignore redundant updates
        }

        // Prevent invalid updates (e.g., non-numeric or blank values)
        if (sensorValue > 0) {
          const convertedValue = Number(
            convertTemp(sensorValue, unitRef.current).toFixed(2)
          );
          currentTempRef.current = convertedValue;
          setCurrentTemp(convertedValue);
        }
      } catch (err) {
        console.error("Error reading data:", err);
      }
    }
  };

  // Function to set current temperature with debouncing
  const setCurrentTempDebounced = (value: number) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    const timeout = setTimeout(() => {
      setCurrentTemp(value);
    }, 50); //50ms debounce
    setDebounceTimeout(timeout);
  };

  useEffect(() => {
    // Cleanup when the component unmounts
    return () => {
      if (port) {
        port.close();
      }
    };
  }, [port]);

  return (
    <div>
      {!port && (
        <Button onClick={connectToSerialPort}>Connect to Sensor</Button>
      )}
    </div>
  );
};

export default ArduinoComponent;

const convertTemp = (value: number, unit: string) => {
  if (unit === "°C") return value;
  return value * 1.8 + 32;
};
