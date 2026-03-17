import { UsersIcon } from "@/components/icons";

export function SeatsAvailable({ spots }: { spots: number }) {
  if (spots <= 0) {
    return <span className="badge badge-full">Fullbokad</span>;
  }

  if (spots < 5) {
    return (
      <span className="badge badge-few">
        <UsersIcon />
        {spots} platser kvar
      </span>
    );
  }

  return (
    <span className="badge badge-available">
      <UsersIcon />
      {spots} platser kvar
    </span>
  );
}
