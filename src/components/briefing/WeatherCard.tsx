import { CloudSun, Droplets, Wind, Thermometer, Umbrella } from "lucide-react";
import { BriefingCard } from "./BriefingCard";
import type { BriefingWeather } from "@/types/briefing";

/**
 * WeatherCard — current weather + forecast for today.
 */
export function WeatherCard({ visible, active, data }: { visible: boolean; active: boolean; data: BriefingWeather }) {
  return (
    <BriefingCard
      visible={visible}
      active={active}
      positionClass="bottom-24 left-6 md:bottom-32 md:left-12"
      width="w-[280px]"
    >
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-primary">
          <CloudSun className="size-3.5" />
          <span className="hud-label">PREVISÃO · CLIMA</span>
        </div>
      </div>
      <h3 className="text-base font-bold">{data.location}</h3>
      <div className="mt-2 flex items-end gap-3">
        <CloudSun className="size-10 text-warning" />
        <span className="text-4xl font-bold leading-none">{data.temp.toFixed(1)}°</span>
      </div>
      <p className="mt-1 text-sm text-primary">{data.condition}</p>
      <div className="mt-3 grid grid-cols-2 gap-y-1.5 gap-x-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Thermometer className="size-3" /> {data.min}° / {data.max}°</span>
        <span className="flex items-center gap-1"><Droplets className="size-3" /> {data.humidity}%</span>
        <span className="flex items-center gap-1"><Wind className="size-3" /> {data.windSpeed} km/h</span>
        <span className="flex items-center gap-1"><Umbrella className="size-3" /> {data.rainChance}% chuva</span>
      </div>
    </BriefingCard>
  );
}
