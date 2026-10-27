"use client";

import { SystemProvider, useSystem } from "@/components/system/system";
import { DialogProvider } from "./Dialogs";
import { Desktop } from "./Desktop";
import { LoginScreen } from "./LoginScreen";
import { Icon } from "./Icon";

function BootScreen() {
  return (
    <div className="boot-screen" role="status" aria-label="Starting Connected">
      <div className="boot-logo">
        <div className="boot-orb" />
        <div className="boot-title">Starting Connected</div>
        <div className="boot-dots" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function Screens() {
  const { phase, powerOn } = useSystem();
  switch (phase) {
    case "booting":
      return <BootScreen />;
    case "login":
      return <LoginScreen />;
    case "desktop":
      return <Desktop />;
    case "shutting-down":
      return (
        <div className="power-screen" role="status">
          Shutting down...
        </div>
      );
    case "restarting":
      return (
        <div className="power-screen" role="status">
          Restarting...
        </div>
      );
    case "off":
      return (
        <div className="power-off">
          <div>
            <button className="power-button" onClick={powerOn} aria-label="Turn the computer on" autoFocus>
              <Icon name="power" size={40} />
            </button>
            <div className="power-hint">Press the power button to start the computer</div>
          </div>
        </div>
      );
  }
}

export default function Computer() {
  return (
    <SystemProvider>
      <DialogProvider>
        <Screens />
      </DialogProvider>
    </SystemProvider>
  );
}
