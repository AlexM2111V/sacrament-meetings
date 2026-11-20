"use client";

import { useActionState } from "react";
import MeetingForm from "@/components/MeetingForm";
import { createMeeting } from "@/lib/actions";
import { EMPTY_MEETING_VALUES, initialMeetingFormState } from "@/lib/meeting-form";

export default function CreateMeetingForm() {
  // Must match the State shape createMeeting returns: { message, errors, values? }.
  const [state, formAction, isPending] = useActionState(createMeeting, initialMeetingFormState);

  return (
    <MeetingForm
      state={state}
      formAction={formAction}
      isPending={isPending}
      initialValues={EMPTY_MEETING_VALUES}
      submitLabel="Create meeting"
    />
  );
}
