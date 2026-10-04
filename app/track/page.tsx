import type { Metadata } from "next";
import TrackClient from "./TrackClient";

export const metadata: Metadata = {
  title: "Track Your Zaina Boutique Order Online",
  description: "Sign in and enter your order number to check delivery status, shipment tracking details, and manage your Zaina Boutique order.",
  alternates: { canonical: "/track" },
};

export default function TrackPage() {
  return <TrackClient />;
}
