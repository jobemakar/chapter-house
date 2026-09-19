import { VEDA_REWARD_IDS } from "./progress";

export const vedasGreatEscapeManifest = {
  id: "vedas-great-escape",
  book: "The Elephant in the Room",
  title: "Veda’s Great Escape",
  heading: "One big elephant. A few small problems.",
  description: "Help Veda push crates, collect peaches and solve five gentle paths to her new sanctuary home.",
  cardArtUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'%3E%3Crect width='640' height='360' fill='%2389a96b'/%3E%3Cpath d='M0 260Q160 170 320 245T640 215V360H0Z' fill='%23315c41'/%3E%3Ccircle cx='456' cy='157' r='70' fill='%23a9beb0'/%3E%3Ccircle cx='405' cy='116' r='39' fill='%23a9beb0'/%3E%3Ccircle cx='507' cy='116' r='39' fill='%23a9beb0'/%3E%3Cpath d='M456 184q3 68-38 80' fill='none' stroke='%23a9beb0' stroke-width='30' stroke-linecap='round'/%3E%3Ccircle cx='435' cy='149' r='6' fill='%23172e29'/%3E%3Ccircle cx='477' cy='149' r='6' fill='%23172e29'/%3E%3Ctext x='36' y='65' font-family='sans-serif' font-size='34' font-weight='bold' fill='%23172e29'%3EVEDA'S%3C/text%3E%3Ctext x='36' y='105' font-family='sans-serif' font-size='34' font-weight='bold' fill='%23172e29'%3EGREAT ESCAPE%3C/text%3E%3C/svg%3E",
  cardArtAlt: "Veda the elephant crossing a green path toward home",
  rewards: [
    { rewardId: VEDA_REWARD_IDS[0], catalogId: "veda-leafy-bench" },
    { rewardId: VEDA_REWARD_IDS[1], catalogId: "veda-elephant-fountain" },
  ],
} as const;
