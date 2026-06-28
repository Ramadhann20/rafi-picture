import BookingClient from "@/components/booking/BookingClient";



export const metadata = {
  title: "Book Your Story | Rafi Picture",
  description:
    "Book your photography session with Rafi Picture through a guided booking form.",
};

export default function BookingPage() {

  const dummyBookingRecord = {
  id: "RP-2026-0001",
  status: "waiting_payment",

  client: {
    fullName: "John Doe",
    partnerName: "Jane Doe",
    email: "john@example.com",
    phone: "+62 812 3456 7890",
    instagram: "johndoe",
  },

  event: {
    preferredDate: "2026-07-24",
    location: "Jakarta",
    vision:
      "Elegant editorial wedding session with warm natural lighting and intimate family moments.",
  },

  package: {
    id: "premium",
    name: "Premium",
    price: 2500,
    priceLabel: "$2,500",
    features: [
      "8 Hours Coverage",
      "Engagement Session",
      "400+ Edited Photos",
      "Luxury Photo Book",
    ],
  },

  invoice: {
    previewUrl:
      "https://lh3.googleusercontent.com/aida/AP1WRLuoMFyZuaRBfcb8UTiH3chCV_HS1nac5m46D_R-pHw31F7xudBH3OHY2jhskgWSWgmmo8HXi0n_U2YSV7nbJssyDqpF8ZI768bxAfsxxZZwrV4IoByVPV1iB7M4_EuUu3okAni4zCKVi84GnfnpNLeok6I3gE85hO2y_vJxR1H8FtREt-ACazMnMj6rf6TasuzBWZpenKrBUYVOXhlPXGsCbIp_1hk6TxfiHOjGr4bCShJeabzQHBGb4ITW",
    downloadUrl: "#",
  },

  payment: {
    bankName: "Bank Central Asia (BCA)",
    accountNumber: "123-456-7890",
    accountName: "Rafi Picture Studio",
  },

  source: "website_booking_form",
  submittedAt: "2026-06-20T12:00:00.000Z",
};



  return (
    <main className="max-w-4xl mx-auto px-margin-mobile md:px-4 py-stack-lg">
      <div className="text-center mb-stack-lg">
        <h1 className="font-headline-lg text-headline-lg mb-2">
          Book Your Session
        </h1>

        <p className="text-on-surface-variant font-body-md">
          Capture the moments that define your life's greatest chapters.
        </p>
      </div>

      <BookingClient />
    </main>
  );
}