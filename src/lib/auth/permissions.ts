export function canBook(role: string) {
  return role === "company_admin" || role === "contact_person";
}

export function canManageMembers(role: string) {
  return role === "company_admin";
}

export function canModifyBooking(role: string, isOwnParticipant: boolean) {
  if (role === "company_admin" || role === "contact_person") return true;
  return isOwnParticipant;
}
