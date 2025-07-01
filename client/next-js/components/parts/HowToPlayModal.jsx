import { useEffect, useState, useCallback } from "react";
import {
  Modal as HeroModal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import { ConnectionButton } from "@/components/connection-button";

const STORAGE_KEY = 'hideHowToPlay';

export const HowToPlayModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const hide = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : 'true';
    if (!hide) {
      setOpen(true);
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);


  useEffect(() => {
    if (!open) return;
    const keyHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        close();
      }
    };
    const clickHandler = () => {
      close();
    };
    window.addEventListener('keydown', keyHandler);
    window.addEventListener('mousedown', clickHandler);
    return () => {
      window.removeEventListener('keydown', keyHandler);
      window.removeEventListener('mousedown', clickHandler);
    };
  }, [open, close]);

  const { isOpen } = useDisclosure({ isOpen: open });

  if (!open) return null;

  return (
    <HeroModal isOpen={isOpen} size="md" onOpenChange={() => setOpen(false)}>
      <ModalContent>
        {() => (
          <ModalBody className="flex items-center justify-center">
            <ConnectionButton text="Connect" className="m-auto" />
          </ModalBody>
        )}
      </ModalContent>
    </HeroModal>
  );
};
