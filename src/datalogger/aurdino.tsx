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
  const debounce = <T extends any[]>(
    func: (...args: T) => void,
    delay: number
  ): ((...args: T) => void) => {
    let timeoutId: NodeJS.Timeout | null = null; // Use a ref to store the timeout ID
    return (...args: T) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Use a debounced version of setCurrentTemp
  const setCurrentTempDebounced = useRef(debounce(setCurrentTemp, 200)).current; // 200mS delay

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
      readData(readerStream);
    } catch (err) {
      console.error("Error connecting to serial port:", err);
    }
  };

  // Function to read incoming data from the serial port
  const readData = async (
    readerStream: ReadableStreamDefaultReader<string>
  ) => {
    while (true) {
      const { value, done } = await readerStream.read();
      if (done) {
        break;
      }
      const sensorValue = parseFloat(value.trim());
      if (!isNaN(sensorValue)) {
        setCurrentTempDebounced(
          Number(convertTemp(sensorValue, unitRef.current).toFixed(2))
        );
      } else {
        console.error("Invalid data received:", value);
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
