"use client";

import {useState} from "react";
import {Input} from "@heroui/input";
import {Button} from "@heroui/react";
import {useTransaction} from "@/hooks";

export function ProfileForm() {
    const [nickname, setNickname] = useState("");
    const {createProfile} = useTransaction();

    const handleCreate = async () => {
        if (!nickname) return;
        try {
            await createProfile(nickname);
            setNickname("");
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex gap-2 items-end">
            <Input
                label="Nickname"
                value={nickname}
                onValueChange={setNickname}
            />
            <Button color="primary" onPress={handleCreate} isDisabled={!nickname}>
                Create Profile
            </Button>
        </div>
    );
}

