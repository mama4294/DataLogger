interface TemperatureDisplayProps {
  temperature: number | null;
  unit: string;
}

export default function TemperatureDisplay({
  temperature,
  unit,
}: TemperatureDisplayProps) {
  return (
    <div className="text-4xl font-bold">
      {temperature !== null ? `${temperature.toFixed(2)} ${unit}` : "N/A"}
    </div>
  );
}
