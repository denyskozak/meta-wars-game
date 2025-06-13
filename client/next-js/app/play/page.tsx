"use client";
import {useWS} from "@/hooks/useWS";
import React, {useEffect, useState} from "react";
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, useDisclosure} from "@heroui/react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter
} from "@heroui/modal";
import {Input} from "@heroui/input";
import {useRouter} from "next/navigation";
import {Navbar} from "@/components/navbar";
import {ProfileForm} from "@/components/profile-form";
import {useCurrentAccount} from "@mysten/dapp-kit";
import {ConnectionButton} from "@/components/connection-button";


export default function MatchesPage() {
    const router = useRouter();
    const account = useCurrentAccount();
    return (
        <div className="h-full">
            <Navbar/>
            {
                account
                    ? (<ConnectionButton />)
                    : (
                        <div className="max-w-[640px] min-w-[480px] flex gap-8 flex-col">
                            <Button size='lg' color="primary" onPress={() => router.push('/play/open-world')}>Join Open
                                World</Button>
                            <Button size='lg' color="primary" onPress={() => router.push('/matches')}>Join Arena
                                Match</Button>
                        </div>
                    )
            }
        </div>
    );
}
