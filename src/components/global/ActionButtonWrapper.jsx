"use client";



import { openWhatsAppAdmin, openInstagram } from "@/lib/mediasocial";

import { DraggableRadialMenu } from "@/components/ui/radial-menu";

import AppIcon from "@/components/global/AppIcon";

export default function ActionButtonWrapper({}) {

    const actions = [
  {
    id: "whatsapp",
    label: "Hubungi Admin",
    icon: <AppIcon name="whatsapp" size={20} />,
    onClick: () => openWhatsAppAdmin(
        "Halo Rafi Picture, saya ingin bertanya mengenai layanan Rafi Picture."
    ),
  },
  {
    id: "instagram",
    label: "Instagram @rafipicture",
    icon: <AppIcon name="instagram" size={20} />,
    onClick: () => openInstagram(),
  },
];


  return <DraggableRadialMenu items={actions} openIcon={<AppIcon name="social" size={20} />} />;
}