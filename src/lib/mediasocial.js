export const openWhatsAppAdmin = (msg) => {

  const phone = "6281334272810";
  const message = encodeURIComponent(msg || "Halo Rafi Picture, saya ingin bertanya mengenai layanan Rafi Picture.");


  window.open(
    `https://wa.me/${phone}?text=${message}`,
    "_blank",
    "noopener,noreferrer"
  );
};

export const openInstagram = () => {
  const instagramUrl = "https://www.instagram.com/rafipicture/";
  
  window.open(instagramUrl, "_blank", "noopener,noreferrer");
};