import React, { useEffect, useState, useCallback, useRef } from 'react';
import Conversation from '../Conversation/Conversation';
import Loading from '../Loading/Loading';

import { API_CONFIG } from '../../config';

/**
 * Extrai o JSON válido do texto, identificando o final do objeto ou array.
 * Se o texto iniciar com '[' ou '{', faz a contagem de chaves ou colchetes
 * para retornar somente a parte JSON.
 */
function safeParseJSON(text) {
  text = text.trim();
  let extracted = null;

  if (text.startsWith('[')) {
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '[') depth++;
      else if (text[i] === ']') depth--;
      if (depth === 0) {
        extracted = text.substring(0, i + 1);
        break;
      }
    }
  } else if (text.startsWith('{')) {
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') depth--;
      if (depth === 0) {
        extracted = text.substring(0, i + 1);
        break;
      }
    }
  }

  if (!extracted) return null;

  try {
    return JSON.parse(extracted);
  } catch (e) {
    console.error("Erro ao parsear JSON:", e, text);
    return null;
  }
}

const fetchUserConversations = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error("Token não encontrado");
    return [];
  }
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/userconversations`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      mode: 'cors'
    });
    if (!response.ok) throw new Error('Erro ao buscar conversas');
    const text = await response.text();
    const data = safeParseJSON(text);
    return data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

const fetchLastMessages = async (conversationIds) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error("Token não encontrado");
    return {};
  }
  try {
    const promises = conversationIds.map(async (id) => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/lastmessageinconversation/${id}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
          mode: 'cors'
        });
        if (!response.ok) throw new Error(`Erro ao buscar última mensagem para conversa ${id}`);
        const text = await response.text();
        const data = safeParseJSON(text);
        console.log(`Última mensagem para conversa ${id}:`, data);
        if (!data) {
          console.error(`Erro ao parsear JSON para conversa ${id}`, text);
        }
        return data;
      } catch (err) {
        console.error(err);
        return null;
      }
    });
    const results = await Promise.all(promises);
    const mapping = {};
    conversationIds.forEach((id, index) => {
      mapping[id] = results[index];
    });
    return mapping;
  } catch (error) {
    console.error(error);
    return {};
  }
};

const fetchUserDetails = async (userId) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error("Token não encontrado");
    return null;
  }
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/userid/${userId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      mode: 'cors'
    });
    if (!response.ok) throw new Error('Erro ao buscar usuário');
    const text = await response.text();
    return safeParseJSON(text);
  } catch (error) {
    console.error(error);
    return null;
  }
};

const MenuHome = () => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const userId = parseInt(localStorage.getItem('userId'));
  const abortControllerRef = useRef(new AbortController());
  const pollingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const isTabVisibleRef = useRef(true);

  const processConversations = useCallback(async (conversationsData) => {
    try {
      const conversationIds = conversationsData.map(conv => conv.id);
      const lastMessagesMapping = await fetchLastMessages(conversationIds);

      const processed = await Promise.all(
        conversationsData.map(async (conv) => {
          const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
          const otherUser = await fetchUserDetails(otherUserId);
          const lastMessage = lastMessagesMapping[conv.id];

          return {
            id: conv.id,
            userName: otherUser?.name || 'Usuário Desconhecido',
            lastMessageDate: lastMessage?.message.created_at || conv.created_at,
            lastMessageContent: lastMessage?.message.message || null // Adiciona o conteúdo
          };
        })
      );

      const sorted = processed.sort((a, b) =>
        new Date(b.lastMessageDate) - new Date(a.lastMessageDate)
      );

      setConversations(prev => {
        const hasChanged = JSON.stringify(prev) !== JSON.stringify(sorted);
        return hasChanged ? sorted : prev;
      });

      return sorted;

    } catch (error) {
      console.error('Erro ao processar conversas:', error);
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  const updateConversations = useCallback(async () => {
    if (!isTabVisibleRef.current) return;

    try {
      abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      const data = await fetchUserConversations();
      const processed = await processConversations(data);

      const hasChanges = processed && JSON.stringify(processed) !== JSON.stringify(conversations);
      const nextInterval = hasChanges ? 5000 : 15000;

      if (isMountedRef.current) {
        pollingIntervalRef.current = setTimeout(updateConversations, nextInterval);
      }

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao atualizar conversas:', error);
      }
      if (isMountedRef.current) {
        pollingIntervalRef.current = setTimeout(updateConversations, 5000);
      }
    }
  }, [userId, conversations, processConversations]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = document.visibilityState === 'visible';

      if (isTabVisibleRef.current) {
        updateConversations();
      } else {
        clearTimeout(pollingIntervalRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateConversations]);

  useEffect(() => {
    isMountedRef.current = true;
    updateConversations();

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current.abort();
      clearTimeout(pollingIntervalRef.current);
    };
  }, [updateConversations]);

  return (
    <div>
      {isLoading ? (
        <Loading />
      ) : conversations.length === 0 ? (
        <p>Nenhuma conversa encontrada.</p>
      ) : (
        conversations.map((conversation) => (
          <Conversation
            key={conversation.id}
            name={conversation.userName}
            lastMessageDate={new Date(conversation.lastMessageDate)}
            conversationId={conversation.id}
            lastMessageContent={conversation.lastMessageContent} // Nova prop
          />
        ))
      )}
    </div>
  );
};

export default MenuHome;