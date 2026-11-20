import type { Metadata } from "next";
import CreateMeetingForm from "./create-meeting-form";

export const metadata: Metadata = { title: "Create Meeting" };

export default function NewMeetingPage() {
  return (
    <>
      <h1 className="text-center text-2xl font-semibold">Create Meeting</h1>
      <CreateMeetingForm />
    </>
  );
}
