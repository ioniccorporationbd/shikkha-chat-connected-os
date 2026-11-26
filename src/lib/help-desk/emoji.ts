/**
 * Emoji set for the conversation composer.
 *
 * A curated, hand-picked list rather than the full Unicode table: it covers
 * what people actually send in a support chat (reaction-style faces, hands and
 * a few status marks) and keeps the picker one short scroll, which matters on a
 * phone. Grouped so the picker can label each block, and every entry is a
 * plain string — no images, no font dependency.
 */

export interface EmojiGroup {
  /** Localisation key the picker renders as the block label. */
  id: "smileys" | "gestures" | "objects";
  emojis: string[];
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    id: "smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
      "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
      "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜",
      "🤪", "🤨", "🧐", "🤓", "😎", "🥳", "😏", "😒",
      "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖",
      "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡",
      "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰",
      "😥", "😓", "🤗", "🤔", "🤭", "🤫", "😶", "😐",
      "🙄", "😯", "😮", "😲", "🥱", "😴", "🤤", "😪",
    ],
  },
  {
    id: "gestures",
    emojis: [
      "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙",
      "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️",
      "🖖", "👋", "🤝", "🙏", "💪", "👏", "🙌", "👐",
      "🤲", "🫶", "🫡", "👀", "🧠", "💁", "🙋", "🙆",
    ],
  },
  {
    id: "objects",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘",
      "✨", "⭐", "🌟", "💫", "🔥", "🎉", "🎊", "✅",
      "❌", "⚠️", "📌", "📎", "📄", "💡", "⏰", "🚀",
    ],
  },
];
