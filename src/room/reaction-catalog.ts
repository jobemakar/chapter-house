export interface ReactionChoice {
  readonly emoji: string;
  readonly label: string;
  readonly value: `emoji:${string}`;
}

const choices = [
  ["😀", "Grinning"],
  ["😃", "Delighted"],
  ["😄", "Happy"],
  ["😁", "Beaming"],
  ["😆", "Laughing"],
  ["😅", "Relieved"],
  ["😂", "Tears of joy"],
  ["🙂", "Smiling"],
  ["🙃", "Silly"],
  ["😉", "Winking"],
  ["😊", "Warm smile"],
  ["😇", "Angel"],
  ["🥰", "Loved"],
  ["😍", "Heart eyes"],
  ["🤩", "Star struck"],
  ["😘", "Kiss"],
  ["😋", "Yum"],
  ["😎", "Cool"],
  ["🤗", "Hug"],
  ["🤭", "Giggle"],
  ["🤔", "Thinking"],
  ["🫡", "Salute"],
  ["🤨", "Curious"],
  ["😐", "Neutral"],
  ["😑", "Unamused"],
  ["😶", "Speechless"],
  ["🫠", "Melting"],
  ["🙄", "Eye roll"],
  ["😏", "Smirk"],
  ["😮", "Surprised"],
  ["😲", "Astonished"],
  ["😳", "Flushed"],
  ["🥺", "Pleading"],
  ["😢", "Sad"],
  ["😭", "Crying"],
  ["😤", "Huffing"],
  ["😠", "Angry"],
  ["😱", "Shocked"],
  ["🤯", "Mind blown"],
  ["😴", "Sleepy"],
  ["🥳", "Celebrating"],
  ["🤠", "Cowpoke"],
  ["👻", "Spooky"],
  ["🐾", "Paw prints"],
  ["❤️", "Love"],
  ["🧡", "Orange heart"],
  ["💛", "Yellow heart"],
  ["💚", "Green heart"],
  ["💙", "Blue heart"],
  ["💜", "Purple heart"],
] as const;

/** Data-driven so the picker can grow without adding shell markup or handlers. */
export const REACTION_CHOICES: readonly ReactionChoice[] = choices.map(
  ([emoji, label]) => ({ emoji, label, value: `emoji:${emoji}` }),
);

