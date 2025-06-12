"use client";

import {Card} from "@heroui/react";
import {Navbar} from "@/components/navbar";
import {title} from "@/components/primitives";
import {ProfileForm} from "@/components/profile-form";

export default function ProfilePage() {
    return (
        <div className="h-full">
            <Navbar/>
            <div className="w-full h-full flex justify-center items-start p-4 overflow-y-auto">
                <Card className="w-full max-w-xl p-6 space-y-6">
                    <h1 className={title()}>Create Profile</h1>
                    <ProfileForm/>
                </Card>
            </div>
        </div>
    );
}

