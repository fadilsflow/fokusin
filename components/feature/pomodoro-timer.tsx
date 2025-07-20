"use client";
// src/components/pomodoro-timer.tsx
import { useEffect, useRef, useCallback } from "react";
import { SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTimerStore } from "@/lib/store/timer";
import { toast } from "sonner";
import { formatTime } from "@/lib/utils";
import type { TimerMode } from "@/lib/store/timer";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Footer from "../layout/footer";
import { useTimerBackground } from "@/lib/hooks/use-timer-background";

export function PomodoroTimer() {
  const {
    mode,
    isRunning,
    timeLeft,
    setMode,
    toggleTimer,
    settings,
    incrementCompletedPomodoros,
  } = useTimerStore();
  const backgroundColor = useTimerBackground();
  const hasSentFocusTime = useRef(false);
  const router = useRouter();
  const { userId } = useAuth();
  // Audio refs
  const backsoundRef = useRef<HTMLAudioElement | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const alarmRepeatCountRef = useRef<number>(0);

  const prevTimeLeft = useRef(timeLeft);

  // Get background color based on current mode
  const getBackgroundColor = () => {
    switch (mode) {
      case "pomodoro":
        return settings.pomodoroColor;
      case "shortBreak":
        return settings.shortBreakColor;
      case "longBreak":
        return settings.longBreakColor;
      default:
        return settings.pomodoroColor;
    }
  };

  // Play button press sound
  const playButtonSound = useCallback(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio("sounds/button-press.wav");
      audio.volume = settings.volume ?? 1;
      audio.play().catch(() => {});
      // Cleanup after playing
      audio.onended = () => audio.remove();
    }
  }, [settings.volume]);

  // Play alarm sound
  const playAlarm = useCallback(() => {
    if (typeof window !== "undefined") {
      const alarmFile = settings.alarmSound || "alarm-bell.mp3";
      if (!alarmFile) return;

      // Clear any existing alarm
      if (alarmRef.current) {
        alarmRef.current.pause();
        alarmRef.current.src = "";
      }

      alarmRef.current = new Audio(`sounds/alarm/${alarmFile}`);
      alarmRef.current.volume = settings.volume ?? 1;
      alarmRepeatCountRef.current = 0;

      const playNextAlarm = () => {
        if (alarmRepeatCountRef.current < (settings.alarmRepeat || 1)) {
          alarmRepeatCountRef.current++;
          if (alarmRef.current) {
            alarmRef.current.currentTime = 0;
            alarmRef.current.play().catch(() => {});
          }
        } else {
          // Cleanup after all repeats are done
          if (alarmRef.current) {
            alarmRef.current.src = "";
            alarmRef.current = null;
          }
        }
      };

      if (alarmRef.current) {
        alarmRef.current.addEventListener("ended", () => {
          if (alarmRepeatCountRef.current < (settings.alarmRepeat || 1)) {
            playNextAlarm();
          }
        });

        playNextAlarm();
      }
    }
  }, [settings.alarmSound, settings.volume, settings.alarmRepeat]);

  // Play/pause backsound logic
  useEffect(() => {
    if (!backsoundRef.current) {
      backsoundRef.current = new Audio();
    }

    // Only update and play in pomodoro mode and running
    if (mode === "pomodoro" && isRunning && settings.backsound) {
      const backsoundFile = settings.backsound;
      // Only update src if it changed
      if (
        backsoundRef.current.src !==
        `${window.location.origin}/sounds/backsound/${backsoundFile}`
      ) {
        backsoundRef.current.src = `sounds/backsound/${backsoundFile}`;
      }
      backsoundRef.current.volume = settings.volume ?? 1;
      backsoundRef.current.loop = true;

      // Only play if not already playing
      if (backsoundRef.current.paused) {
        backsoundRef.current.play().catch(() => {});
      }
    } else {
      // Stop playing if mode changes, timer stops, or backsound is set to none
      backsoundRef.current.pause();
      backsoundRef.current.currentTime = 0;
      if (!settings.backsound) {
        backsoundRef.current.src = "";
      }
    }

    // Cleanup on unmount
    return () => {
      if (backsoundRef.current) {
        backsoundRef.current.pause();
        backsoundRef.current.src = "";
      }
    };
  }, [mode, isRunning, settings.backsound, settings.volume]);

  // Play alarm when timer ends
  useEffect(() => {
    if (
      prevTimeLeft.current > 0 &&
      timeLeft === 0 &&
      (mode === "pomodoro" || mode === "shortBreak" || mode === "longBreak")
    ) {
      playAlarm();
    }
    prevTimeLeft.current = timeLeft;
  }, [timeLeft, mode, playAlarm]);

  // Cleanup alarm on unmount
  useEffect(() => {
    return () => {
      if (alarmRef.current) {
        alarmRef.current.pause();
        alarmRef.current.src = "";
        alarmRef.current = null;
      }
      if (backsoundRef.current) {
        backsoundRef.current.pause();
        backsoundRef.current.src = "";
        backsoundRef.current = null;
      }
    };
  }, []);

  // Handler for Start/Pause button
  const handleToggleTimer = useCallback(() => {
    playButtonSound();
    toggleTimer();
  }, [playButtonSound, toggleTimer]);

  const handleSkip = async () => {
    // Try to save focus time if user is logged in
    let nextMode: TimerMode = "pomodoro"; // Default if skipping a break
    if (mode === "pomodoro") {
      // Increment first, then check
      incrementCompletedPomodoros();
      const currentCompleted = useTimerStore.getState().completedPomodoros; // Get updated count
      const shouldTakeLongBreak =
        currentCompleted > 0 &&
        settings.longBreakInterval > 0 &&
        currentCompleted % settings.longBreakInterval === 0;
      nextMode = shouldTakeLongBreak ? "longBreak" : "shortBreak";
    }

    await setMode(nextMode);
    if (mode === "pomodoro") {
      const userid = userId;

      if (userid) {
        const initialTime = settings.pomodoroTime * 60;
        const focusTime = initialTime - timeLeft;
        // Send focus time, but don't wait for it
        fetch("/api/stats/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ focusTime }),
        }).catch(console.error); // Log error if fetch fails
      } else {
        toast.warning("Please login to save your focus time", {
          description: "Document your focus time to track your progress",
          duration: 10000,
          action: {
            label: "Login",
            onClick: () => {
              router.push("/login");
            },
          },
        });
      }
    }

    // Determine next mode
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const handleTimerEnd = async () => {
      useTimerStore.setState({ isRunning: false });

      let nextModeDetermined: TimerMode | null = null;

      // Determine next mode when pomodoro ends
      if (mode === "pomodoro") {
        incrementCompletedPomodoros(); // Increment first
        const currentCompleted = useTimerStore.getState().completedPomodoros; // Get updated count
        const shouldTakeLongBreak =
          currentCompleted > 0 &&
          settings.longBreakInterval > 0 &&
          currentCompleted % settings.longBreakInterval === 0;
        nextModeDetermined = shouldTakeLongBreak ? "longBreak" : "shortBreak";
      } else {
        // Break ended
        nextModeDetermined = "pomodoro";
        hasSentFocusTime.current = false; // Reset the flag for the next pomodoro
      }

      // Auto start next timer based on settings or just set the mode
      if (nextModeDetermined) {
        const shouldAutoStart =
          (mode === "pomodoro" && settings.autoStartBreaks) ||
          ((mode === "shortBreak" || mode === "longBreak") &&
            settings.autoStartPomodoros);

        await setMode(nextModeDetermined);
        if (shouldAutoStart) {
          useTimerStore.setState({ isRunning: true });
        }
      }
    };

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        useTimerStore.setState((state) => ({
          timeLeft: state.timeLeft - 1,
        }));
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handleTimerEnd();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isRunning,
    timeLeft,
    mode,
    settings,
    setMode,
    incrementCompletedPomodoros,
  ]);

  // Separate effect for tracking focus time
  useEffect(() => {
    if (mode === "pomodoro" && timeLeft === 0 && !hasSentFocusTime.current) {
      const initialTime = settings.pomodoroTime * 60;
      const focusTime = initialTime;

      fetch("/api/stats/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focusTime }),
      }).catch(console.error);

      hasSentFocusTime.current = true;
    } else if (mode !== "pomodoro") {
      hasSentFocusTime.current = false;
    }
  }, [mode, timeLeft, settings.pomodoroTime]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case " ": // Space
          e.preventDefault();
          handleToggleTimer();
          break;
        case "1":
          setMode("pomodoro");
          break;
        case "2":
          setMode("shortBreak");
          break;
        case "3":
          setMode("longBreak");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleToggleTimer, setMode]);

  return (
    <div className="flex flex-col items-center   " style={{ backgroundColor }}>
      {/* Hidden audio element for backsound */}
      <audio ref={backsoundRef} preload="auto" />
      <div className=" pb-8  rounded-sm  w-[95%] lg:w-md mt-10 ">
        <Tabs
          defaultValue="pomodoro"
          value={mode}
          onValueChange={(value) => setMode(value as TimerMode)}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-3 w-fit mx-auto    bg-transparent">
            <TabsTrigger value="pomodoro" className="  border-0 font-fredoka   ">
              Pomodoros
            </TabsTrigger>
            <TabsTrigger value="shortBreak" className=" border-0 font-fredoka  ">
              Short Break
            </TabsTrigger>
            <TabsTrigger value="longBreak" className=" border-0  ">
              Long Break
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pomodoro" className="mt-0"></TabsContent>
          <TabsContent value="shortBreak" className="mt-0"></TabsContent>
          <TabsContent value="longBreak" className="mt-0"></TabsContent>
        </Tabs>

        <div className="text-center mb-8">
          <span className="text-9xl font-fredoka font-semibold text-primary ">
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="flex justify-center space-x-4 relative">
          <div className="relative">
            <Button
              onClick={handleToggleTimer}
              variant="default"
              className={`px-16 py-7 bg-primary hover:bg-primary/90 rounded-sm text-lg font-bold
              transition-all duration-75 ease-in-out
              shadow-[0_8px_0_0_rgba(255,255,255,0.2),0_0_0_2px_rgba(255,255,255,0.05)]
              active:shadow-[0_0_0_0_rgba(255,255,255,0.1),0_0_0_2px_rgba(255,255,255,0.05)]
              active:translate-y-2
              ${
                isRunning
                  ? "translate-y-2 shadow-[0_0_0_0_rgba(255,255,255,0.1),0_0_0_2px_rgba(255,255,255,0.05)]"
                  : ""
              }`}
              style={{ color: getBackgroundColor() }}
            >
              {isRunning ? "PAUSE" : "START"}
            </Button>

            <div
              className={`
                  absolute -right-20 top-[60%] -translate-y-1/2
                  transition-all duration-300 ease-in-out
                  ${
                    isRunning
                      ? "opacity-70 visible scale-100"
                      : "opacity-0 invisible scale-95"
                  }
                `}
            >
              <SkipForward
                className="h-8 w-8  cursor-pointer text-foreground"
                onClick={handleSkip}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="pt-32 pb-10 ">
        <Footer />
      </div>
    </div>
  );
}
