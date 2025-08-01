import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { ButtonWithSound as Button } from "@/components/button-with-sound";

interface ConnectionButton {
  className?: string;
  text?: string;
}

export function ConnectionButton({
  className,
  text = "Connect",
}: ConnectionButton) {
  const currentAccount = useCurrentAccount();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (currentAccount) {
    return (
      <Button color="primary" onPress={() => router.push("/loot")}>
        Your bag
      </Button>
    );
  }

  return (
    <ConnectModal
      open={open}
      trigger={
        <Button className={className} size="lg">
          <span className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 animate-pulse opacity-100 group-hover:opacity-100 blur-md" />
          <span className="relative z-10">{text}</span>
        </Button>
      }
      onOpenChange={(isOpen) => setOpen(isOpen)}
    />
  );
}
