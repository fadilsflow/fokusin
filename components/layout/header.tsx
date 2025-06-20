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
import { createOrUpdateProfile } from "@/app/actions/profile";
import { Suspense } from "react";

async function ProfileInitializer() {
  await createOrUpdateProfile();
  return null;
}

export default async function Header() {
  return (
    <nav className="fixed max-w-xl mx-auto top-0 left-0 right-0 z-50  items-center py-5 px-5 flex flex-col gap-3">
      <div className="justify-between flex w-full">
        <h1 className="text-2xl font-bold text-background">Focus</h1>
        <div className="flex items-center gap-2">
          <SignedIn>
            <Suspense fallback={null}>
              <ProfileInitializer />
            </Suspense>
            <SettingsDialog />
            <KeyboardShortcuts />
            <UserButton />
            <StatsDialog />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal" />
            <SignUpButton mode="modal" />
          </SignedOut>
        </div>
      </div>
      <ProgressTimer />
    </nav>
  );
}
