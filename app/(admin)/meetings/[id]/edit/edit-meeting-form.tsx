"use client";

import { useActionState } from "react";
import MeetingForm from "@/components/MeetingForm";
import type { State } from "@/lib/actions";
import { initialMeetingFormState, type MeetingFormValues } from "@/lib/meeting-form";

export default function EditMeetingForm({
  action,
  initialValues,
}: {
  /** updateMeeting already bound to this meeting's id by the page. */
  action: (prevState: State, formData: FormData) => Promise<State>;
  initialValues: MeetingFormValues;
}) {
  const [state, formAction, isPending] = useActionState(action, initialMeetingFormState);

  return (
    <MeetingForm
      state={state}
      formAction={formAction}
      isPending={isPending}
      initialValues={initialValues}
      submitLabel="Save changes"
    />
  );
}
