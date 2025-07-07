import { useEffect, useState, useCallback } from "react";
import { assetUrl } from "../../utilities/assets";
import {
  Modal as HeroModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@heroui/react";

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

  const dontShowAgain = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, close]);

  const { isOpen } = useDisclosure({ isOpen: open });

  if (!open) return null;

  return (
    <HeroModal isOpen={isOpen} size="md" onOpenChange={() => setOpen(false)}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader>How to Play</ModalHeader>
            <ModalBody>
              <div style={{ width: 400, height: 300 }} className="flex items-center justify-center">
                <img src={assetUrl('/images/how-to-play.webp')} alt="How to play" className="max-w-full max-h-full" />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={dontShowAgain}>Don&#39;t show again</Button>
              <Button color="danger" variant="light" onPress={close}>
                Close (Enter or Space)
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </HeroModal>
  );
};
