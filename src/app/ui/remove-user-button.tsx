"use client";

import { useState } from "react";
import { removeUserAction } from "../actions/invites";
import { TEXT_LINK } from "@/care-desk/web/dashboard/styles";

export default function RemoveUserButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className={`${TEXT_LINK} cursor-pointer`}
      >
        Remove
      </button>
    );
  }

  return (
    <form
      action={removeUserAction.bind(null, id)}
      className="inline-flex items-center gap-3"
    >
      <span className="text-[13px] text-gray-600">Remove {name}?</span>
      <button
        type="submit"
        className="cursor-pointer text-sm font-medium text-red-600 hover:underline"
      >
        Yes, remove
      </button>
      <button
        type="button"
        onClick={() => setAsking(false)}
        className={`${TEXT_LINK} cursor-pointer`}
      >
        Cancel
      </button>
    </form>
  );
}
