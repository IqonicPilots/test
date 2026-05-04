import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  getChatContext, 
  listIncomingChatRequests, 
  getConversationMessages,
  markConversationRead
} from "@/services/chat.service"

export function useChatContext(enabled = true) {
  return useQuery({
    queryKey: ["chat-context"],
    queryFn: getChatContext,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useIncomingChatRequests(enabled = true) {
  return useQuery({
    queryKey: ["chat-requests-incoming"],
    queryFn: listIncomingChatRequests,
    enabled,
    refetchInterval: 30000, // Refresh every 30 seconds instead of 8s
    staleTime: 10000,
  })
}

export function useConversationMessages(conversationId: string, enabled = true) {
  return useQuery({
    queryKey: ["chat-messages", conversationId],
    queryFn: () => getConversationMessages(conversationId),
    enabled: enabled && !!conversationId,
    staleTime: 5000,
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (conversationId: string) => markConversationRead(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["chat-context"] })
    }
  })
}
