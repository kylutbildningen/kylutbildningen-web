import { NextResponse } from "next/server";
import { updatePerson, deletePerson } from "@/lib/eduadmin/persons";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    await updatePerson(parseInt(id), body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update person:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunde inte uppdatera" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await deletePerson(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete person:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunde inte ta bort" },
      { status: 500 },
    );
  }
}
