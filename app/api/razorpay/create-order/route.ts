import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSettings } from "@/lib/data";

// Server-only route. The public Key ID can come from Admin → Settings →
// Payments (that's fine — it's the same value already sent to the browser
// during checkout) or from the RAZORPAY_KEY_ID env var as a fallback.
// The Key SECRET must always come from the environment — it is never stored
// in Firestore/localStorage, since that data can be publicly readable.
export async function POST(req: NextRequest) {
  const settings = await getSettings();

  if (!settings.payments.razorpayEnabled) {
    return NextResponse.json({ error: "Razorpay is currently disabled in Settings." }, { status: 403 });
  }

  const keyId = settings.payments.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Razorpay is not fully configured. Set a Key ID (in Settings or RAZORPAY_KEY_ID) and RAZORPAY_KEY_SECRET as a server environment variable." },
      { status: 500 }
    );
  }

  const { amount } = await req.json();
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });

  try {
    // Razorpay expects the smallest currency unit (paise for INR).
    const order = await instance.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `zaina_${Date.now()}`,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create Razorpay order", details: String(err) }, { status: 500 });
  }
}
