import { creditPacks, formatPackPrice } from "./credit-packs";

const packPrices = Object.values(creditPacks)
  .map(({ name, amountCents }) => `${name} ${formatPackPrice(amountCents)}`)
  .join(", ");

export type FaqItem = {
  question: string;
  answer: string;
};

export type StyleOption = {
  id: string;
  title: string;
  description: string;
  image: string;
  tag: string;
};

export type CrowdVariant = {
  id: string;
  title: string;
  description: string;
  image: string;
  prompt: string;
};

export const styles: StyleOption[] = [
  {
    id: "rap",
    title: "Rap star",
    description:
      "Your photo. Big stage energy. A moment that belongs in a music video.",
    image: "/images/style-rap.jpg",
    tag: "THE ORIGINAL",
  },
  {
    id: "dance",
    title: "Dance rap",
    description:
      "Bring a little movement, attitude, and spotlight to your portrait.",
    image: "/images/style-dance.jpg",
    tag: "FEEL THE ENERGY",
  },
  {
    id: "cinematic",
    title: "Cinematic",
    description:
      "Moody light, a slow camera move, and your main character moment.",
    image: "/images/style-cinematic.jpg",
    tag: "SET THE MOOD",
  },
  {
    id: "crowd",
    title: "I Found You",
    description: "A balcony. A crowd. That one person you were looking for.",
    image: "/images/crowd-scene.jpg",
    tag: "THE CROWD EFFECT",
  },
];

export const variants: CrowdVariant[] = [
  {
    id: "couple",
    title: "For your person",
    description: "Everyone else fades into the background.",
    image: "/images/crowd-scene.jpg",
    prompt:
      "A romantic cinematic moment: a person on a balcony notices their partner in a crowded nighttime street. A warm spotlight finds the partner, their eyes meet, and the camera slowly moves closer. Tender expressions, natural faces, soft film grain, no text.",
  },
  {
    id: "friends",
    title: "For your best friend",
    description: "The familiar face in a room full of strangers.",
    image: "/images/crowd-scene.jpg",
    prompt:
      "A warm friendship reunion: a person on a balcony recognizes their best friend in a lively nighttime crowd. A gentle spotlight reveals the friend, they exchange a joyful look, and the camera moves closer. Playful, natural expressions, cinematic lighting, no text.",
  },
  {
    id: "pets",
    title: "For your little sidekick",
    description: "Because some soulmates have paws.",
    image: "/images/crowd-scene.jpg",
    prompt:
      "A heartwarming cinematic scene: a person on a balcony finds their beloved pet in a softly lit crowd below. A warm spotlight frames the pet, the person smiles, and the camera slowly moves toward their connection. Preserve the pet appearance, gentle movement, no text.",
  },
  {
    id: "solo",
    title: "For your main character",
    description: "Two sides of you. One unforgettable scene.",
    image: "/images/crowd-scene.jpg",
    prompt:
      "A dreamy cinematic self-portrait: the same person appears on a balcony and in the nighttime crowd below. A spotlight finds their second self, their eyes meet, and the camera slowly pushes in. Reflective mood, consistent facial identity, soft film grain, no text.",
  },
];

export const homeFaqs: FaqItem[] = [
  {
    question: "How does the AI rap video generator work?",
    answer:
      "Upload a clear photo, choose a visual style, and select your format. The generator uses your photo as a visual reference to create a short video. Preview the result before choosing a download.",
  },
  {
    question: "Can I try my first video for free?",
    answer:
      `Your first preview is free and includes a watermark at 480p. If you like the result, choose a one-time credit pack to unlock an available HD download without the watermark. Pack prices in USD are ${packPrices}. There is no subscription.`,
  },
  {
    question: "Does the video include music or lip sync?",
    answer:
      "This tool creates the visual clip. Music, vocals, and accurate lip sync are not included. Add your own audio in a video editor or use the music tools in the app where you share your video.",
  },
  {
    question: "What photos can I upload?",
    answer:
      "Use a clear, well-lit JPG, PNG, WebP, or iPhone HEIC photo. Choose from your photo library or take a new picture. A visible face with a simple background gives the model a clearer reference to work with.",
  },
  {
    question: "What happens if generation fails?",
    answer:
      "A failed generation does not use your credits. The failure screen explains what happened and lets you try again. If the same photo keeps failing, try a brighter image with a clear face and an uncluttered background.",
  },
];

export const crowdFaqs: FaqItem[] = [
  {
    question: "What is the I Found You in the Crowd AI video effect?",
    answer:
      "It is a cinematic scene in which one person looks from a balcony and finds another person in the crowd below. A spotlight and a slow camera move draw attention to the moment their eyes meet. Use your photos to make your own interpretation of the scene.",
  },
  {
    question: "How do I make an I Found You in the Crowd video?",
    answer:
      "Add a photo for the person on the balcony and a photo for the person in the spotlight. Choose a variation, check the photo-use confirmation, and select your format before generating. You can review the preview when it is ready.",
  },
  {
    question: "Do I need two different photos?",
    answer:
      "Both photo slots need an image. Use two different people for a couple or friendship scene, or upload the same person into both slots for a solo variation. The labels show which role each photo will play.",
  },
  {
    question: "Can I try this effect for free?",
    answer:
      `The first preview is free at 480p with a watermark. You can review it before choosing a one-time credit pack for an available HD download without the watermark. Pack prices in USD are ${packPrices}.`,
  },
  {
    question: "Is the original song included?",
    answer:
      "No. This page creates a silent video. Add your chosen sound afterward in your video editor or the social app where you post. The original trending audio is not included in the download.",
  },
  {
    question: "Which photo works best for the balcony role?",
    answer:
      "Choose a clear portrait with the face visible and evenly lit. Avoid sunglasses, heavy face filters, and several people in the same photo. The model uses the portrait as a reference; you do not need to photograph an actual balcony.",
  },
  {
    question: "Which photo should I use for the person in the crowd?",
    answer:
      "Use a clear portrait of the person you want in the spotlight. A front-facing or slightly turned face is a useful starting point. You do not need to supply a crowd photo; the selected scene supplies that setting.",
  },
  {
    question: "Can I make it with a friend or a pet?",
    answer:
      "Yes. Choose the friend or pet variation to fill in the scene direction, then add your own photos. A pet scene is a creative interpretation of the effect, and the resulting motion and appearance can vary.",
  },
  {
    question: "Does this work with iPhone HEIC photos?",
    answer:
      "Yes. You can select HEIC photos from your iPhone library. The upload flow converts supported HEIC files into an image the generator can use. If a particular file cannot be converted, export it as JPG and upload it again.",
  },
  {
    question: "Can I choose vertical or horizontal video?",
    answer:
      "Use the aspect-ratio selector before you generate. Vertical 9:16 suits a phone screen; square 1:1 and landscape 16:9 offer different framing. Keep important details away from the edges because the model may reframe the scene.",
  },
  {
    question: "How do I remove the watermark?",
    answer:
      "When your video succeeds, use Download HD · no watermark to see the one-time credit packs. Review your preview first. An HD download is available only when the generation service supplies an HD version of that result.",
  },
  {
    question: "What if my video fails or the faces look wrong?",
    answer:
      "A failed job returns any reserved credits and can be retried. For a completed clip with an unwanted expression or a changed face, try clearer portraits or a different scene variation. AI output can vary and is not an exact reproduction of your photos.",
  },
];
