/**
 * One rule for "is this attachment a picture / a voice note?".
 *
 * The chat bubble and the Activity list both draw the same `File` rows, so the
 * decision must not fork: a file the bubble shows as a thumbnail must show as a
 * thumbnail in the trail too. The ERP's stored `fileType` can be empty (older
 * rows carry no mime), so the extension is the fallback.
 */

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i;
const AUDIO_EXT = /\.(webm|mp3|m4a|wav|ogg|oga|aac|mp4)$/i;

export const isImageAttachment = (mime: string | undefined, name: string | undefined): boolean =>
  (mime || "").startsWith("image/") || IMAGE_EXT.test(name || "");

export const isAudioAttachment = (mime: string | undefined, name: string | undefined): boolean =>
  (mime || "").startsWith("audio/") || AUDIO_EXT.test(name || "");
