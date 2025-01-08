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
              setCurrentTemp(convertTemp(temperature, unitRef.current));
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
