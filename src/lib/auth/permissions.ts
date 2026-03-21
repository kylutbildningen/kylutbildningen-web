export function isParticipant(role: string) {
  return role === "participant";
}

export function canBook(role: string) {
  return role === "company_admin" || role === "contact_person" || role === "participant";
}

export function canManageMembers(role: string) {
  return role === "company_admin";
}

export function canViewCompany(role: string) {
  return role === "company_admin" || role === "contact_person";
}

export function canModifyBooking(role: string, isOwnParticipant: boolean) {
  if (role === "company_admin" || role === "contact_person") return true;
  return isOwnParticipant;
}
