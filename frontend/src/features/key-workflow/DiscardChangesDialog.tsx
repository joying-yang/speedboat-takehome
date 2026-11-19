import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "../../components/ui/Button/Button";
import dialogStyles from "../../components/ui/Dialog/Dialog.module.css";

type DiscardChangesDialogProps = {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
};

export function DiscardChangesDialog({
  open,
  onKeepEditing,
  onDiscard,
}: DiscardChangesDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onKeepEditing()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={`${dialogStyles.overlay} ${dialogStyles.confirmationOverlay}`} />
        <AlertDialog.Content className={`${dialogStyles.content} ${dialogStyles.confirmationContent}`}>
          <AlertDialog.Title>Discard changes?</AlertDialog.Title>
          <AlertDialog.Description className={dialogStyles.confirmationDescription}>
            Your edits have not been saved. This action cannot be undone.
          </AlertDialog.Description>
          <div className={dialogStyles.actions}>
            <AlertDialog.Cancel asChild>
              <Button>Keep editing</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button variant="danger" onClick={onDiscard}>Discard changes</Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
