"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { X, ArrowUpRight, MapPin, Sun, Car, Layers } from "lucide-react";
import type { JourneyPhase } from "@/components/CorridorMap";
import rawSdiData from "../../data/thane_sdi_v1 (1).json";

const CorridorMap = dynamic(() => import("@/components/CorridorMap"), { ssr: false });

interface DayPoint {
  day: number;
  date: string;
  p10_km: number;
  p50_km: number;
  p90_km: number;
}

interface ScenarioData {
  route_shade_pct: number;
  summary: {
    median_daily_solar_km: number;
    p10_daily_solar_km: number;
    p90_daily_solar_km: number;
    annual_free_solar_km: number;
    days_per_year_50pct_commute: number;
    days_per_year_100pct_commute: number;
  };
  seasonal_median_km: Record<string, number>;
  curve_365: DayPoint[];
}

interface SDIDataset {
  scenarios: Record<string, ScenarioData>;
}

const sdiData = (
  Array.isArray(rawSdiData) ? rawSdiData[0] : rawSdiData
) as unknown as SDIDataset;

const SHADE_OPTIONS = [
  {
    key: "shade_0",
    label: "0% No Shade",
    note: "Clear open sky all day with no trees or bridges blocking the sun.",
  },
  {
    key: "shade_10",
    label: "10% Very Light Shade",
    note: "Mostly open roads with a few brief building shadows.",
  },
  {
    key: "shade_15",
    label: "15% Normal Thane Road",
    note: "Our main realistic guess for Ghodbunder Road—some trees and flyovers, mostly open sky.",
  },
  {
    key: "shade_20",
    label: "20% Under Metro Pillars",
    note: "Extra shadows from the overhead Metro Line 4 tracks along the road.",
  },
  {
    key: "shade_25",
    label: "25% Heavy Trees & Buildings",
    note: "Parked or driving near tall buildings and thick trees.",
  },
  {
    key: "shade_35",
    label: "35% Very Shady Route",
    note: "Worst-case street test where shadows block the car for a big part of the day.",
  },
];

const MONTHS = [
  { value: "01", label: "January", days: 31 },
  { value: "02", label: "February", days: 28 },
  { value: "03", label: "March", days: 31 },
  { value: "04", label: "April", days: 30 },
  { value: "05", label: "May", days: 31 },
  { value: "06", label: "June", days: 30 },
  { value: "07", label: "July", days: 31 },
  { value: "08", label: "August", days: 31 },
  { value: "09", label: "September", days: 30 },
  { value: "10", label: "October", days: 31 },
  { value: "11", label: "November", days: 30 },
  { value: "12", label: "December", days: 31 },
];

export default function SDIDashboard() {
  const [selectedShade, setSelectedShade] = useState<string>("shade_15");
  const [phase, setPhase] = useState<JourneyPhase>("soak");
  const [selectedMonth, setSelectedMonth] = useState<string>("10");
  const [selectedDay, setSelectedDay] = useState<string>("04");
  const [showV2Modal, setShowV2Modal] = useState<boolean>(false);

  const activeScenario = sdiData?.scenarios?.[selectedShade];
  const activeShadeMeta =
    SHADE_OPTIONS.find((s) => s.key === selectedShade) || SHADE_OPTIONS[2];

  const selectedDateKey = `${selectedMonth}-${selectedDay}`;

  const selectedDayStats = useMemo(() => {
    if (!activeScenario?.curve_365) return null;
    return (
      activeScenario.curve_365.find((d) => d.date === selectedDateKey) ||
      activeScenario.curve_365[0]
    );
  }, [activeScenario, selectedDateKey]);

  if (!activeScenario) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#221912] p-6 text-[#F2ECE1]">
        <div className="max-w-lg rounded-xl border-2 border-[#E5A93B] bg-[#2B2017] p-6">
          <div className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[#E5A93B]">
            WEATHER FILE MISSING
          </div>
          <p className="mt-2 text-sm text-[#D6C9B8]">
            Make sure <code className="text-white">data/thane_sdi_v1 (1).json</code> is saved in your folder and restart the server.
          </p>
        </div>
      </main>
    );
  }

  const { summary, seasonal_median_km, curve_365 } = activeScenario;

  const fiveYearSolarKm = Math.round(summary.median_daily_solar_km * 1826);
  const fiveYearKwh = Math.round(fiveYearSolarKm * 0.1);
  const maxDaysInMonth = MONTHS.find((m) => m.value === selectedMonth)?.days || 31;

  return (
    <div className="relative min-h-screen bg-[#221912] text-[#F2ECE1]">
      {/* Side Quick-Jump Tabs */}
      <nav
        aria-label="Jump to section"
        className="fixed right-0 top-1/3 z-40 hidden flex-col gap-2 xl:flex"
      >
        <a
          href="#summary"
          className="-mr-1 rounded-l-md bg-[#C85A32] px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#F2ECE1] shadow-md transition-transform hover:-translate-x-1"
        >
          RESULTS
        </a>
        <a
          href="#route"
          className="-mr-1 rounded-l-md bg-[#34A87E] px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#18110C] shadow-md transition-transform hover:-translate-x-1"
        >
          THE TRIP
        </a>
        <a
          href="#car-numbers"
          className="-mr-1 rounded-l-md bg-[#E5A93B] px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#18110C] shadow-md transition-transform hover:-translate-x-1"
        >
          CAR MATH
        </a>
        <a
          href="#year-chart"
          className="-mr-1 rounded-l-md bg-[#F2ECE1] px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#18110C] shadow-md transition-transform hover:-translate-x-1"
        >
          365 DAYS
        </a>
        <button
          onClick={() => setShowV2Modal(true)}
          className="-mr-1 rounded-l-md bg-[#8C4A32] px-3 py-1.5 text-left font-mono text-[11px] font-bold uppercase tracking-wider text-[#F2ECE1] shadow-md transition-transform hover:-translate-x-1"
        >
          SDI V2 +
        </button>
      </nav>

      {/* Top Bar */}
      <header className="border-b border-[#3E3024] bg-[#1B130E]/95 px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="rounded bg-[#E5A93B] px-2 py-0.5 font-mono text-xs font-bold uppercase text-[#1B130E]">
              GOLDENBIRD
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-[#C4B5A5]">
              Solar Data Intelligence • Open Study V1
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowV2Modal(true)}
              className="flex items-center gap-1.5 rounded-lg border-2 border-[#E5A93B] bg-[#E5A93B] px-3.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wide text-[#1B130E] transition hover:bg-[#f0b94d]"
            >
              SDI V2 (What&apos;s Next)
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>

            <a
              href="https://github.com/Goldenbird-Motor/sdi-v1"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-[#4A392B] bg-[#2B2017] px-3.5 py-1.5 font-mono text-xs font-medium text-[#F2ECE1] transition hover:border-[#E5A93B]"
            >
              GitHub Code
              <ArrowUpRight className="h-3.5 w-3.5 text-[#E5A93B]" />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-14 px-6 py-10">
        {/* HERO SECTION */}
        <section id="summary" className="relative pt-2">
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <span className="-rotate-1 rounded bg-[#34A87E] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[#18110C]">
              5 Years of Real Weather (2021–2025)
            </span>
            <span className="rotate-1 rounded border border-[#5A4636] bg-[#2B2017] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-[#D6C9B8]">
              Computer Simulation • Thane, India
            </span>
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-4xl uppercase leading-[1.02] tracking-tight text-[#F2ECE1] sm:text-6xl lg:text-[64px]">
            CAN THE SUN POWER A DAILY CAR COMMUTE IN THANE?
          </h1>

          <div className="mt-5 border-b-4 border-[#F2ECE1]" />

          <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#D6C9B8] sm:text-lg">
            Most city cars are driven for less than 2 hours a day and sit parked outside for the other 22 hours. We didn&apos;t do big lab tests for this study—we took <strong className="text-[#F2ECE1]">5 years of real hourly weather records (1,826 days)</strong> for Thane, India, and calculated on a computer how many free kilometers a small solar car gets on a normal <strong className="text-[#E5A93B]">19 km daily office trip</strong>.
          </p>

          {/* 3 Big Headline Numbers */}
          <div className="mt-10 grid grid-cols-1 gap-8 border-b border-[#3E3024] pb-10 md:grid-cols-3">
            <div className="text-center md:text-left">
              <div className="inline-block rounded bg-[#E5A93B]/15 px-2 py-0.5 font-mono text-[11px] uppercase text-[#E5A93B]">
                Free Range on a Normal Day
              </div>
              <div className="mt-2 font-[family-name:var(--font-display)] text-5xl uppercase tracking-tight text-[#F2ECE1] sm:text-6xl">
                {summary.median_daily_solar_km} KM/DAY
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#C4B5A5]">
                On an average day ({activeShadeMeta.label}), sunlight alone gives the car{" "}
                <strong className="text-[#F2ECE1]">{summary.median_daily_solar_km} km</strong> of driving—covering{" "}
                <strong className="text-[#F2ECE1]">
                  {Math.round((summary.median_daily_solar_km / 19) * 100)}%
                </strong>{" "}
                of the 19 km daily trip.
              </p>
            </div>

            <div className="text-center md:text-left">
              <div className="inline-block rounded bg-[#34A87E]/20 px-2 py-0.5 font-mono text-[11px] uppercase text-[#34A87E]">
                Days With Zero Wall Charging
              </div>
              <div className="mt-2 font-[family-name:var(--font-display)] text-5xl uppercase tracking-tight text-[#34A87E] sm:text-6xl">
                {summary.days_per_year_100pct_commute} DAYS/YR
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#C4B5A5]">
                Days every year where the sun covers{" "}
                <strong className="text-[#F2ECE1]">100% of the 19 km round trip</strong>. On{" "}
                <strong className="text-[#F2ECE1]">{summary.days_per_year_50pct_commute} days/year</strong>, it covers at least half the drive.
              </p>
            </div>

            <div className="text-center md:text-left">
              <div className="inline-block rounded bg-[#C85A32]/20 px-2 py-0.5 font-mono text-[11px] uppercase text-[#E68A68]">
                Total Free Distance (5 Years)
              </div>
              <div className="mt-2 font-[family-name:var(--font-display)] text-5xl uppercase tracking-tight text-[#E5A93B] sm:text-6xl">
                {fiveYearSolarKm.toLocaleString()} KM
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#C4B5A5]">
                Free solar driving collected over 5 years ({fiveYearKwh.toLocaleString()} kWh of electricity), saving{" "}
                <strong className="text-[#F2ECE1]">
                  {Number(summary.annual_free_solar_km).toLocaleString()} km/year
                </strong>{" "}
                of plug-in charging.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 1: WHERE THIS IS & HOW THE CAR MOVES */}
        <section id="route" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[#E5A93B]">
                <MapPin className="h-3.5 w-3.5" /> Location &amp; Daily Routine
              </div>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl uppercase tracking-tight text-[#F2ECE1] sm:text-4xl">
                THE TRIP: RUTU ENCLAVE TO THANE STATION
              </h2>
            </div>
            <div className="rounded-lg border border-[#4A392B] bg-[#2B2017] px-3 py-1.5 font-mono text-xs text-[#D6C9B8]">
              Thane, India • 19.26°N, 72.97°E
            </div>
          </div>

          <p className="max-w-4xl text-sm leading-relaxed text-[#D6C9B8] sm:text-base">
            <strong className="text-[#F2ECE1]">Thane</strong> is a major city right next to Mumbai where lakhs of people drive to work every day. We tested a real everyday route starting at <strong className="text-[#34A87E]">Rutu Enclave, Anand Nagar (19.2608° N, 72.9712° E)</strong> and going <strong className="text-[#F2ECE1]">9.5 km south</strong> along Ghodbunder Road to <strong className="text-[#E5A93B]">Thane Railway Station (19.1861° N, 72.9758° E)</strong>—and back home. That equals <strong className="text-[#F2ECE1]">19 km every day</strong>.
          </p>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left 5 Cols: 3-Step Daily Schedule */}
            <div className="flex flex-col justify-between space-y-3 lg:col-span-5">
              <button
                onClick={() => setPhase("morning")}
                className={`w-full rounded-xl border-2 p-4 text-left transition ${
                  phase === "morning"
                    ? "border-[#34A87E] bg-[#2E231A]"
                    : "border-[#3E3024] bg-[#281E17] hover:border-[#5C4736]"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-[#34A87E]">1. 7:00 – 8:00 AM</span>
                  <span className="text-[#B8A99A]">9.5 KM DRIVE</span>
                </div>
                <div className="mt-1 font-semibold text-[#F2ECE1]">
                  Morning Drive to Thane Station
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#C4B5A5]">
                  The car drives south in morning traffic (~20 km/h). Wind flowing over the moving car keeps the solar panels cool while passing under trees and metro bridges.
                </p>
              </button>

              <button
                onClick={() => setPhase("soak")}
                className={`w-full rounded-xl border-2 p-4 text-left transition ${
                  phase === "soak"
                    ? "border-[#E5A93B] bg-[#2E231A]"
                    : "border-[#3E3024] bg-[#281E17] hover:border-[#5C4736]"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-[#E5A93B]">2. 8:00 AM – 5:00 PM</span>
                  <span className="text-[#B8A99A]">9 HOURS PARKED</span>
                </div>
                <div className="mt-1 font-semibold text-[#F2ECE1]">
                  Parked Outside in the Sun All Workday
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#C4B5A5]">
                  While the owner is at work, the car sits outdoors for 9 sunny hours. Because a parked car gets hot in the sun, our math automatically reduces panel power slightly when temperatures rise.
                </p>
              </button>

              <button
                onClick={() => setPhase("evening")}
                className={`w-full rounded-xl border-2 p-4 text-left transition ${
                  phase === "evening"
                    ? "border-[#C85A32] bg-[#2E231A]"
                    : "border-[#3E3024] bg-[#281E17] hover:border-[#5C4736]"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-[#E68A68]">3. 5:00 – 6:00 PM</span>
                  <span className="text-[#B8A99A]">9.5 KM DRIVE</span>
                </div>
                <div className="mt-1 font-semibold text-[#F2ECE1]">
                  Evening Drive Back to Rutu Enclave
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#C4B5A5]">
                  The car drives 9.5 km back home using the solar power collected all day, catching the late-afternoon sun on the way. Click any box to move the car on the map.
                </p>
              </button>
            </div>

            {/* Right 7 Cols: Interactive Map */}
            <div className="lg:col-span-7">
              <CorridorMap phase={phase} />
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#B8A99A]">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-4 rounded-sm bg-[#34A87E]" /> Open Road
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-4 rounded-sm bg-[#E5A93B]" /> Road Under Metro Line 4 Pillars
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: WHAT CAR & NUMBERS WE USED */}
        <section
          id="car-numbers"
          className="rounded-2xl border-2 border-[#3E3024] bg-[#281E17] p-6 sm:p-8"
        >
          <div className="border-b border-[#3E3024] pb-5">
            <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[#34A87E]">
              <Car className="h-4 w-4" /> Honest Assumptions &amp; Simple Math
            </div>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl uppercase tracking-tight text-[#F2ECE1] sm:text-4xl">
              WHAT CAR &amp; NUMBERS WE USED
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#D6C9B8]">
              We used a small Indian hatchback—the <strong className="text-[#F2ECE1]">Maruti Alto K10</strong>—as our computer model. Instead of pretending solar panels work at 100% perfection, we subtracted real-world losses for heat, wires, and city shadows:
            </p>
          </div>

          {/* 4 Plain-English Cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[#3E3024] bg-[#221912] p-4">
              <div className="font-mono text-[11px] uppercase text-[#E5A93B]">1. Solar Panel Size</div>
              <div className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[#F2ECE1]">
                2.0 m² (430 W)
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#C4B5A5]">
                Total solar panel area placed on the car&apos;s roof and front hood (converting 21.5% of sunlight into electricity).
              </p>
            </div>

            <div className="rounded-xl border border-[#3E3024] bg-[#221912] p-4">
              <div className="font-mono text-[11px] uppercase text-[#34A87E]">2. Power Used to Drive</div>
              <div className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[#F2ECE1]">
                100 Wh per km
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#C4B5A5]">
                Normal city traffic energy use. Driving 19 km back and forth takes 1.9 kWh of battery power.
              </p>
            </div>

            <div className="rounded-xl border border-[#3E3024] bg-[#221912] p-4">
              <div className="font-mono text-[11px] uppercase text-[#E68A68]">3. Heat &amp; Wire Loss</div>
              <div className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[#F2ECE1]">
                -0.35% / °C + 10%
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#C4B5A5]">
                Hot afternoon sun warms up the panels and lowers output slightly, and wires/chargers use up about 10%.
              </p>
            </div>

            <div className="rounded-xl border border-[#3E3024] bg-[#221912] p-4">
              <div className="font-mono text-[11px] uppercase text-[#F2ECE1]">4. City Shadows</div>
              <div className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[#E5A93B]">
                Extra Shade Cut
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#C4B5A5]">
                When trees or metro pillars cast a shadow on part of the roof, power drops faster than the shadow size—our math includes that extra drop.
              </p>
            </div>
          </div>

          {/* Interactive Shading Selector */}
          <div className="mt-6 rounded-xl border border-[#4A392B] bg-[#221912] p-5">
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-[#E5A93B]">
                Test Different Road Shadow Levels (Click Any Button)
              </div>
              <p className="mt-1 text-xs text-[#D6C9B8]">
                <strong className="text-[#F2ECE1]">Selected ({activeShadeMeta.label}):</strong>{" "}
                {activeShadeMeta.note}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {SHADE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedShade(opt.key)}
                  className={`rounded-lg px-3.5 py-2 font-mono text-xs font-semibold transition ${
                    selectedShade === opt.key
                      ? "bg-[#E5A93B] text-[#1B130E]"
                      : "border border-[#4A392B] bg-[#2B2017] text-[#D6C9B8] hover:border-[#E5A93B]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: 365-DAY CHART & PICK-A-DATE TOOL */}
        <section id="year-chart" className="space-y-6">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[#34A87E]">
              <Sun className="h-3.5 w-3.5" /> Every Day of the Year
            </div>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl uppercase tracking-tight text-[#F2ECE1] sm:text-4xl">
              HOW MANY KM DOES THE SUN GIVE ON ANY DATE?
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#D6C9B8]">
              Pick any day of the year below to see how far the car can drive on solar power on a <strong className="text-[#34A87E]">Normal Day</strong>, a <strong className="text-[#F2ECE1]">Cloudy Day</strong>, and a <strong className="text-[#E5A93B]">Bright Sunny Day</strong> based on 5 years of Thane weather.
            </p>
          </div>

          {/* Date Picker Box */}
          {selectedDayStats && (
            <div className="rounded-2xl border-2 border-[#3E3024] bg-[#281E17] p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3E3024] pb-4">
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-[#E5A93B]">
                    Date Checker • Day #{selectedDayStats.day} of 365
                  </div>
                  <div className="mt-0.5 text-lg font-bold text-[#F2ECE1]">
                    Free Solar Range on {MONTHS.find((m) => m.value === selectedMonth)?.label}{" "}
                    {selectedDay}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <select
                    aria-label="Select Month"
                    value={selectedMonth}
                    onChange={(e) => {
                      const m = e.target.value;
                      setSelectedMonth(m);
                      const maxD = MONTHS.find((item) => item.value === m)?.days || 28;
                      if (Number(selectedDay) > maxD) {
                        setSelectedDay(String(maxD).padStart(2, "0"));
                      }
                    }}
                    className="rounded-lg border border-[#5A4636] bg-[#221912] px-3 py-2 text-[#F2ECE1] focus:border-[#E5A93B] focus:outline-none"
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Select Day"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="rounded-lg border border-[#5A4636] bg-[#221912] px-3 py-2 text-[#F2ECE1] focus:border-[#E5A93B] focus:outline-none"
                  >
                    {Array.from({ length: maxDaysInMonth }, (_, idx) => {
                      const d = String(idx + 1).padStart(2, "0");
                      return (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      );
                    })}
                  </select>

                  <button
                    onClick={() => { setSelectedMonth("05"); setSelectedDay("10"); }}
                    className="rounded-lg border border-[#4A392B] bg-[#221912] px-2.5 py-2 text-[11px] text-[#E5A93B] hover:border-[#E5A93B]"
                  >
                    May 10 (Hot Summer)
                  </button>
                  <button
                    onClick={() => { setSelectedMonth("07"); setSelectedDay("20"); }}
                    className="rounded-lg border border-[#4A392B] bg-[#221912] px-2.5 py-2 text-[11px] text-[#D6C9B8] hover:border-[#F2ECE1]"
                  >
                    Jul 20 (Rainy Monsoon)
                  </button>
                  <button
                    onClick={() => { setSelectedMonth("10"); setSelectedDay("04"); }}
                    className="rounded-lg border border-[#4A392B] bg-[#221912] px-2.5 py-2 text-[11px] text-[#34A87E] hover:border-[#34A87E]"
                  >
                    Oct 04 (Clear October)
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-[#3E3024] bg-[#221912] p-4">
                  <div className="font-mono text-[11px] uppercase text-[#34A87E]">
                    Normal Day
                  </div>
                  <div className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[#34A87E]">
                    {selectedDayStats.p50_km} KM
                  </div>
                  <div className="mt-1 text-xs text-[#C4B5A5]">
                    Covers <strong className="text-[#F2ECE1]">{Math.round((selectedDayStats.p50_km / 19) * 100)}%</strong> of the 19 km trip
                  </div>
                </div>

                <div className="rounded-xl border border-[#3E3024] bg-[#221912] p-4">
                  <div className="font-mono text-[11px] uppercase text-[#B8A99A]">
                    Cloudy Day
                  </div>
                  <div className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[#F2ECE1]">
                    {selectedDayStats.p10_km} KM
                  </div>
                  <div className="mt-1 text-xs text-[#C4B5A5]">
                    Even with heavy clouds
                  </div>
                </div>

                <div className="rounded-xl border border-[#3E3024] bg-[#221912] p-4">
                  <div className="font-mono text-[11px] uppercase text-[#E5A93B]">
                    Bright Sunny Day
                  </div>
                  <div className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[#E5A93B]">
                    {selectedDayStats.p90_km} KM
                  </div>
                  <div className="mt-1 text-xs text-[#C4B5A5]">
                    Clear blue-sky harvest
                  </div>
                </div>

                <div className="rounded-xl border border-[#3E3024] bg-[#221912] p-4">
                  <div className="font-mono text-[11px] uppercase text-[#E68A68]">
                    Battery Charged
                  </div>
                  <div className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[#F2ECE1]">
                    {(selectedDayStats.p50_km * 0.1).toFixed(2)} KWH
                  </div>
                  <div className="mt-1 text-xs text-[#C4B5A5]">
                    {Math.round(selectedDayStats.p50_km * 100)} Wh added from the sun
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 365-Day Chart + Seasons */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="rounded-2xl border-2 border-[#3E3024] bg-[#281E17] p-5 lg:col-span-9">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono text-xs uppercase tracking-wider text-[#D6C9B8]">
                  Full Year Chart (Jan 1 to Dec 31)
                </div>
                <div className="font-mono text-xs font-semibold text-[#E5A93B]">
                  --- 19.0 km Daily Trip Goal
                </div>
              </div>

              <div className="h-[310px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={curve_365} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3E3024" />
                    <XAxis dataKey="date" tick={{ fill: "#C4B5A5", fontSize: 11 }} interval={29} />
                    <YAxis tick={{ fill: "#C4B5A5", fontSize: 11 }} unit=" km" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1B130E",
                        borderColor: "#5A4636",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#F2ECE1",
                      }}
                    />
                    <ReferenceLine y={19} stroke="#E5A93B" strokeDasharray="5 5" strokeWidth={2} />
                    {selectedDayStats && (
                      <ReferenceLine
                        x={selectedDayStats.date}
                        stroke="#F2ECE1"
                        strokeDasharray="3 3"
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="p90_km"
                      name="Sunny Day (km)"
                      stroke="#E5A93B"
                      fill="#E5A93B"
                      fillOpacity={0.14}
                      strokeWidth={1.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="p50_km"
                      name="Normal Day (km)"
                      stroke="#34A87E"
                      fill="#34A87E"
                      fillOpacity={0.32}
                      strokeWidth={2.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="p10_km"
                      name="Cloudy Day (km)"
                      stroke="#A89888"
                      fill="#A89888"
                      fillOpacity={0.12}
                      strokeWidth={1.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Season Cards */}
            <div className="flex flex-col justify-between rounded-2xl border-2 border-[#3E3024] bg-[#281E17] p-5 lg:col-span-3">
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-[#E5A93B]">
                  Thane Seasons
                </div>
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl uppercase text-[#F2ECE1]">
                  BY SEASON
                </h3>
                <div className="mt-4 space-y-3">
                  {Object.entries(seasonal_median_km).map(([season, km]) => (
                    <div
                      key={season}
                      className="rounded-xl border border-[#3E3024] bg-[#221912] p-3.5"
                    >
                      <div className="font-mono text-xs text-[#C4B5A5]">{season}</div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="font-[family-name:var(--font-display)] text-2xl text-[#F2ECE1]">
                          {km} KM/D
                        </span>
                        <span className="font-mono text-xs font-semibold text-[#34A87E]">
                          {Math.round((Number(km) / 19) * 100)}% of trip
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowV2Modal(true)}
                className="mt-4 flex w-full items-center justify-between rounded-xl border border-[#E5A93B]/60 bg-[#221912] px-3.5 py-2.5 text-left font-mono text-xs font-semibold text-[#E5A93B] transition hover:bg-[#E5A93B] hover:text-[#1B130E]"
              >
                <span>See What Comes in SDI V2</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[#3E3024] pt-6 pb-8 text-xs leading-relaxed text-[#A89888]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <strong className="text-[#F2ECE1]">Goldenbird SDI V1</strong> — Open-source solar range study for Thane commuters.
            </div>
            <div className="font-mono text-[11px]">
              Weather records (2021–2025) from Open-Meteo &amp; Copernicus ERA5 (CC BY 4.0).
            </div>
          </div>
        </footer>
      </main>

      {/* SDI V2 ROADMAP POPUP */}
      {showV2Modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setShowV2Modal(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl border-2 border-[#E5A93B] bg-[#221912] p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowV2Modal(false)}
              aria-label="Close popup"
              className="absolute right-5 top-5 rounded-lg border border-[#4A392B] bg-[#2B2017] p-1.5 text-[#D6C9B8] transition hover:border-[#E5A93B] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="inline-flex items-center gap-1.5 rounded bg-[#E5A93B] px-2.5 py-0.5 font-mono text-xs font-bold uppercase text-[#1B130E]">
              <Layers className="h-3.5 w-3.5" /> Coming Next
            </div>

            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl uppercase tracking-tight text-[#F2ECE1] sm:text-4xl">
              WHAT WE ARE BUILDING IN SDI V2
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#D6C9B8]">
              SDI V1 uses 5 years of past weather data on a computer. Here are the 3 real-world upgrades we are building next:
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-[#4A392B] bg-[#2B2017] p-4">
                <div className="font-mono text-xs font-bold uppercase text-[#34A87E]">
                  1. Real Shade Data from Our Car Prototype
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#F2ECE1]">
                  We are installing solar panels on our actual test car and recording real road shadows and power output—replacing our shade guesses with real measured numbers.
                </p>
              </div>

              <div className="rounded-xl border border-[#4A392B] bg-[#2B2017] p-4">
                <div className="font-mono text-xs font-bold uppercase text-[#E5A93B]">
                  2. Connecting to Live Weather Satellites
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#F2ECE1]">
                  Linking SDI directly to live satellite cloud maps so the system predicts today&apos;s free solar range using real clouds in the sky right now.
                </p>
              </div>

              <div className="rounded-xl border border-[#4A392B] bg-[#2B2017] p-4">
                <div className="font-mono text-xs font-bold uppercase text-[#E68A68]">
                  3. Expanding from Thane to All of Mumbai
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#F2ECE1]">
                  Growing our road and sunlight data collection beyond Thane to cover Mumbai&apos;s main highways, suburbs, and daily delivery routes.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#3E3024] pt-4">
              <span className="font-mono text-[11px] text-[#B8A99A]">
                Goldenbird Motor • SDI V2 Plan
              </span>
              <button
                onClick={() => setShowV2Modal(false)}
                className="rounded-lg bg-[#F2ECE1] px-4 py-2 font-mono text-xs font-bold uppercase text-[#1B130E] transition hover:bg-[#E5A93B]"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}