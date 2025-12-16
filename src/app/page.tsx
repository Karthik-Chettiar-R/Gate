"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type TimeLeft = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const TARGET_DATE = new Date("2027-02-01T00:00:00");

function calculateTimeLeft(): TimeLeft {
  const now = new Date();
  const diff = TARGET_DATE.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  let totalSeconds = Math.floor(diff / 1000);

  const seconds = totalSeconds % 60;
  totalSeconds = Math.floor(totalSeconds / 60);

  const minutes = totalSeconds % 60;
  totalSeconds = Math.floor(totalSeconds / 60);

  const hours = totalSeconds % 24;
  totalSeconds = Math.floor(totalSeconds / 24);

  const days = totalSeconds % 30;
  totalSeconds = Math.floor(totalSeconds / 30);

  const months = totalSeconds % 12;
  const years = Math.floor(totalSeconds / 12);

  return { years, months, days, hours, minutes, seconds };
}

export default function Home() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);
  const [showDaysOnly, setShowDaysOnly] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const format = (num: number) => String(num).padStart(2, "0");

  const totalDays =
    timeLeft.years * 12 * 30 + timeLeft.months * 30 + timeLeft.days;

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <main className="relative flex min-h-screen w-full flex-col items-center px-4 py-8">
        <div className="text-center flex flex-col items-center px-4 py-8 mt-10">
          <button
            type="button"
            onClick={() => setShowDaysOnly((prev) => !prev)}
            className="group mb-8 flex flex-col items-center focus:outline-none"
          >
            {showDaysOnly ? (
              <>
                <div className="mb-4 text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-semibold tracking-tight">
                  {totalDays}
                </div>
                
              </>
            ) : (
              <>
                <div className="mb-4 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-widest">
                  {format(timeLeft.years)} : {format(timeLeft.months)} :{" "}
                  {format(timeLeft.days)} : {format(timeLeft.hours)} :{" "}
                  {format(timeLeft.minutes)} : {format(timeLeft.seconds)}
                </div>
                
              </>
            )}
          </button>
        </div>
        <div className="pointer-events-none absolute left-1/2 bottom-30 -translate-x-1/2">
          <Image
            src="/0x0.webp"
            alt="Timer illustration"
            width={480}
            height={480}
            className="h-auto max-h-[40vh] w-auto object-contain"
            priority
          />
        </div>
      </main>
    </div>
  );
}
