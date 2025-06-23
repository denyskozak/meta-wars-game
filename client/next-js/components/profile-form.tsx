"use client";

import { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";

import { useTransaction } from "@/hooks";

export interface ProfileFormProps {
  onCreated?: () => void;
}
export function ProfileForm({ onCreated }: ProfileFormProps) {
  const [nickname, setNickname] = useState("");
  const { createProfile } = useTransaction();
  const router = useRouter();

  const handleCreate = async () => {
    if (!nickname) return;
    try {
      await createProfile(nickname);
      setNickname("");
      onCreated?.();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <Input label="Nickname" value={nickname} onValueChange={setNickname} />
      <Button color="primary" isDisabled={!nickname} onPress={handleCreate}>
        Create Profile
      </Button>
      <Button variant="light" onPress={() => router.push("/matches")}>Skip</Button>
    </div>
  );
}
