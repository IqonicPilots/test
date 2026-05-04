/**
 * Peer read pointer is the newest message id they have opened through (Mongo ObjectId hex).
 * Lexicographic compare matches chronological order for ids generated in normal use.
 */
export function isMessageSeenByPeer(
  messageId: string | undefined | null,
  peerLastReadMessageId: string | null | undefined
): boolean {
  if (
    !peerLastReadMessageId ||
    !messageId ||
    messageId === "none" ||
    !/^[a-f0-9]{24}$/i.test(messageId) ||
    !/^[a-f0-9]{24}$/i.test(peerLastReadMessageId)
  ) {
    return false
  }
  return peerLastReadMessageId >= messageId
}
