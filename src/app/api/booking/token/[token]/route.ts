import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  // TODO: Look up booking_token in Supabase
  // const supabase = createServerClient();
  // const { data } = await supabase.from('booking_tokens')
  //   .select('*')
  //   .eq('id', token)
  //   .eq('used', false)
  //   .gt('expires_at', new Date().toISOString())
  //   .single();

  return NextResponse.json(
    {
      error: "Magic link-funktionalitet är inte implementerad ännu",
      token,
    },
    { status: 501 },
  );
}
