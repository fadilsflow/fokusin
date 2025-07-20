"use client";
import { SettingsDialog } from "@/components/feature/settings-dialog";
import { StatsDialog } from "@/components/feature/stats-dialog";
import { ProgressTimer } from "@/components/feature/progres-timer";
import { KeyboardShortcuts } from "@/components/feature/keyboard-shortcuts";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "../ui/button";
import Link from "next/link";
import { useTimerBackground } from "@/lib/hooks/use-timer-background";
import Image from "next/image";

export default function Header() {
  const backgroundColor = useTimerBackground();

  return (
    <nav style={{ backgroundColor }}>
      <div className="max-w-xl mx-auto top-0 left-0 right-0 z-50 items-center py-5 px-5 flex flex-col gap-3">
        <div className="justify-between flex w-full">
          <Link href="/" className="flex items-center gap-2 ">
            <Image src="/icon.svg" alt="Jeda" width={32} height={32} />
            <h1 className="text-2xl font-bold text-foreground font-fredoka  ">
              Jeda
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <SettingsDialog />
            <KeyboardShortcuts />
            <StatsDialog />
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <Button variant="default" asChild>
                <SignInButton mode="modal" />
              </Button>
              <Button variant="default" asChild>
                <SignUpButton mode="modal" />
              </Button>
            </SignedOut>
          </div>
        </div>
        <ProgressTimer />
      </div>
    </nav>
  );
}
