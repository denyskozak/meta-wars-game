import {
  Modal as HeroModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@heroui/react";
import { ReactNode } from "react";

interface Action {
  label: string;
  onPress: () => void;
}

interface IModalProps {
  open: boolean;
  title: string;
  onChange: (open: boolean) => void;
  children: ReactNode;
  size?: "5xl" | "xl" | "md" | "lg" | "sm";
  actions: Action[];
}

export function Modal({
  open,
  size = "5xl",
  actions,
  title,
  onChange,
  children,
}: IModalProps) {
  const { isOpen } = useDisclosure({
    isOpen: open,
  });

  return (
    <HeroModal isOpen={isOpen} size={size} onOpenChange={() => onChange(false)}>
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
            <ModalBody className="flex justify-center items-center">
              {children}
              {/*<p>*/}
              {/*    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non*/}
              {/*    risus hendrerit venenatis. Pellentesque sit amet hendrerit risus, sed porttitor*/}
              {/*    quam.*/}
              {/*</p>*/}
              {/*<p>*/}
              {/*    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non*/}
              {/*    risus hendrerit venenatis. Pellentesque sit amet hendrerit risus, sed porttitor*/}
              {/*    quam.*/}
              {/*</p>*/}
              {/*<p>*/}
              {/*    Magna exercitation reprehenderit magna aute tempor cupidatat consequat elit dolor*/}
              {/*    adipisicing. Mollit dolor eiusmod sunt ex incididunt cillum quis. Velit duis sit*/}
              {/*    officia eiusmod Lorem aliqua enim laboris do dolor eiusmod. Et mollit incididunt*/}
              {/*    nisi consectetur esse laborum eiusmod pariatur proident Lorem eiusmod et. Culpa*/}
              {/*    deserunt nostrud ad veniam.*/}
              {/*</p>*/}
            </ModalBody>
            <ModalFooter>
              {actions.map(({ label, onPress }) => (
                <Button key={label} color="primary" onPress={onPress}>
                  {label}
                </Button>
              ))}
              <Button
                color="danger"
                variant="light"
                onPress={() => onChange(false)}
              >
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </HeroModal>
  );
}
