import { createSupabaseAdmin } from "./supabase-admin";

export type BookingAction = "cancelled_participant" | "moved_participant" | "cancelled_booking" | "added_participant";

export interface LogEventParams {
  eduCustomerId: number;
  bookingId: string | number;
  participantId?: number;
  eduPersonId?: number;
  participantName?: string;
  action: BookingAction;
  fromEventId?: number;
  toEventId?: number;
  actorEmail?: string;
  actorUserId?: string;
}

export async function logBookingEvent(params: LogEventParams): Promise<void> {
  const supabase = createSupabaseAdmin();
  await supabase.from("booking_events").insert({
    edu_customer_id: params.eduCustomerId,
    booking_id: String(params.bookingId),
    participant_id: params.participantId ?? null,
    edu_person_id: params.eduPersonId ?? null,
    participant_name: params.participantName ?? null,
    action: params.action,
    from_event_id: params.fromEventId ?? null,
    to_event_id: params.toEventId ?? null,
    actor_email: params.actorEmail ?? null,
    actor_user_id: params.actorUserId ?? null,
  });
}
