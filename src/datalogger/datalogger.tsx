"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TemperatureDisplay from "./temperature-display";
import TemperatureChart from "./temperature-chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CSVLink } from "react-csv";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw } from "lucide-react";

interface LoggedData {
  time: number;
  temperature: number;
}

export default function Datalogger({
  currentTemp,
  unit,
  setUnit,
}: {
  currentTemp: number | null;
  unit: string;
  setUnit: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [loggedData, setLoggedData] = useState<LoggedData[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [frequency, setFrequency] = useState(500); // Default frequency in ms
  const [startTime, setStartTime] = useState<number | null>(null); // Store start time of logging
  const currentTempRef = useRef(currentTemp); // Ref to store the latest currentTemp value for use inside setInterval
  const { toast } = useToast();

  // Update the ref whenever currentTemp changes
  useEffect(() => {
    currentTempRef.current = currentTemp;
  }, [currentTemp]);

  // Start logging data when `isLogging` is true
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isLogging && currentTemp !== null) {
      // Record the start time when logging starts
      if (startTime === null) {
        setStartTime(Date.now()); // Store the current time as the start time
      }

      interval = setInterval(() => {
        const temp = currentTempRef.current;
        if (temp !== null && startTime !== null) {
          // Calculate the time elapsed since logging started (in seconds)
          const timeElapsed = (Date.now() - startTime) / 1000;

          setLoggedData((prev) => [
            ...prev,
            { time: timeElapsed, temperature: temp },
          ]);
        }
      }, frequency);
    }

    // Cleanup interval on stop or component unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLogging, frequency, startTime]);

  const handleStartLogging = () => setIsLogging(true);
  const handleStopLogging = () => setIsLogging(false);
  const handleReset = () => {
    setIsLogging(false);
    setLoggedData([]);
    setStartTime(null); // Reset start time when logging is reset
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Current Temperature</CardTitle>
        </CardHeader>
        <CardContent>
          <TemperatureDisplay temperature={currentTemp} unit={unit} />
        </CardContent>
      </Card>

      <div className="flex space-x-2">
        {!isLogging && (
          <Button onClick={handleStartLogging} disabled={isLogging}>
            Log Data
          </Button>
        )}
        {loggedData.length > 0 && !isLogging && (
          <Button onClick={handleReset} variant="outline">
            <RotateCcw />
            Reset
          </Button>
        )}
        <Select
          onValueChange={(value) => setFrequency(Number(value))}
          defaultValue="500"
          value={frequency.toString()}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="250">250ms</SelectItem>
            <SelectItem value="500">500ms</SelectItem>
            <SelectItem value="1000">1s</SelectItem>
            <SelectItem value="5000">5s</SelectItem>
            <SelectItem value="15000">15s</SelectItem>
            <SelectItem value="30000">30s</SelectItem>
            <SelectItem value="60000">1m</SelectItem>
          </SelectContent>
        </Select>
        {!isLogging && loggedData.length === 0 && (
          <Select
            onValueChange={(unit) => setUnit(unit)}
            defaultValue="°C"
            value={unit}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="°C">°C</SelectItem>
              <SelectItem value="°F">°F</SelectItem>
            </SelectContent>
          </Select>
        )}

        {isLogging && (
          <Button onClick={handleStopLogging} disabled={!isLogging}>
            Stop
          </Button>
        )}

        {loggedData.length > 0 && !isLogging && (
          <CSVLink
            onClick={() => {
              toast({
                title: "Downloading CSV",
                // description: "Storing in Downloads",
              });
            }}
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:bg-primary/80 transition"
            data={loggedData}
            headers={[
              { label: "Time (s)", key: "time" },
              { label: `Temperature (${unit})`, key: "temperature" },
            ]}
            target="_blank"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="white"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
          </CSVLink>
        )}
      </div>

      {(isLogging || loggedData.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Temperature Log</CardTitle>
          </CardHeader>
          <CardContent>
            <TemperatureChart data={loggedData} unit={unit} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
