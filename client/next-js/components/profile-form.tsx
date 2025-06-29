"use client";

import { useState, useEffect } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";

import { useWS } from "@/hooks/useWS";

export interface ProfileFormProps {
  onCreated?: () => void;
}
export function ProfileForm({ onCreated }: ProfileFormProps) {
  const [nickname, setNickname] = useState("");
  const { socket, sendToSocket } = useWS();
  const router = useRouter();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      let message: any = {};

      try {
        message = JSON.parse(event.data);
      } catch (e) {
        return;
      }

      if (message.type === "PROFILE_CREATED" && message.success) {
        setNickname("");
        onCreated?.();
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, onCreated]);

  const handleCreate = () => {
    if (!nickname) return;
    sendToSocket({ type: "CREATE_PROFILE", nickname });
  };

  return (
    <div className="flex flex-col gap-2 items-start">
      <Input label="Nickname" value={nickname} onValueChange={setNickname} />
      <Button color="primary" isDisabled={!nickname} onPress={handleCreate}>
        Create Profile
      </Button>
      <Button variant="light" onPress={() => router.push("/matches")}>
        Skip
      </Button>
    </div>
  );
}
