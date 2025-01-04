import { useState } from "react";
import "./App.css";
import ArduinoComponent from "./datalogger/aurdino";
import Datalogger from "./datalogger/datalogger";

function App() {
  const [currentTemp, setCurrentTemp] = useState<Temp>(null);
  const [port, setPort] = useState<SerialPort | null>(null);
  const [unit, setUnit] = useState("°C"); // Default unit

  return (
    <div>
      <div className="container mx-auto p-4">
        <h1 className="text-6xl font-bold mb-4">Datalogger</h1>
        <ArduinoComponent
          port={port}
          setPort={setPort}
          setCurrentTemp={setCurrentTemp}
          unit={unit}
        />
        {port && (
          <Datalogger currentTemp={currentTemp} unit={unit} setUnit={setUnit} />
        )}
      </div>

      <div className="my-6 fixed bottom-0 left-0 w-full">
        <p className="mx-6 text-right text-sm">
          Matthew Malone &copy; {new Date().getFullYear()}{" "}
        </p>
      </div>
    </div>
  );
}

export type Temp = number | null;

export default App;
