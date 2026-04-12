"use client";

import { useState } from "react";
import { AddFriendDialog } from "@/components/friends/AddFriendDialog";

type HomeAddFriendActionProps = {
  buttonClassName: string;
};

/**
 * Client boundary for the home CTA: owns open state only. Popup UI is {@link AddFriendDialog}
 * (single source of truth). Pass `buttonClassName` from the page for styling.
 */
export function HomeAddFriendAction({ buttonClassName }: HomeAddFriendActionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClassName}>
        Add Friend
      </button>
      <AddFriendDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
