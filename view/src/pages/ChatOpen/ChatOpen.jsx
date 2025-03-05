import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import './ChatOpen.css';
import Loading from '../../components/Loading/Loading';
import { API_CONFIG } from '../../config';

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

const ChatOpen = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otherUserName, setOtherUserName] = useState('Carregando...');
  const messagesEndRef = useRef(null);
  const userId = parseInt(localStorage.getItem('userId'));

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchConversationDetails = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/conversationdetails/${id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error('Erro ao buscar detalhes da conversa');
      
      const conversationData = await response.json();
      const otherUserId = conversationData.user1_id === userId ? conversationData.user2_id : conversationData.user1_id;
      
      // Buscar nome do outro usuário
      const userResponse = await fetch(`${API_CONFIG.BASE_URL}/userid/${otherUserId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        mode: 'cors'
      });
      
      if (!userResponse.ok) throw new Error('Erro ao buscar usuário');
      const userData = await userResponse.json();
      setOtherUserName(userData.name);
    } catch (err) {
      setError(err.message);
      setOtherUserName('Usuário Desconhecido');
    }
  }, [id, userId]);

  const fetchMessages = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Token não encontrado");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/conversation/${id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        mode: 'cors'
      });
      if (!response.ok) throw new Error('Erro ao buscar conversa');
      const text = await response.text();
      const messagesData = safeParseJSON(text);
      if (!Array.isArray(messagesData)) {
        throw new Error('Dados da conversa inválidos.');
      }
      setMessages(messagesData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const initializeChat = async () => {
      await fetchConversationDetails();
      await fetchMessages();
      setLoading(false);
    };
    
    if (id) initializeChat();
  }, [id, fetchConversationDetails, fetchMessages]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 7000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Token não encontrado");
      return;
    }
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/sendmessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        mode: 'cors',
        body: JSON.stringify({
          message: newMessage,
          conversation_id: id
        })
      });
      if (!response.ok) {
        const text = await response.text();
        const errorData = safeParseJSON(text);
        throw new Error((errorData && errorData.message) || 'Erro ao enviar mensagem.');
      }
      const textMsg = await response.text();
      const newMsgData = safeParseJSON(textMsg);
      setMessages(prev => [
        ...prev,
        {
          id: newMsgData.id || Date.now(),
          message: newMsgData.message,
          user_id: userId || 0,
          created_at: new Date().toISOString()
        }
      ]);
      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  if (loading) return <div className="chat-loading"><Loading /></div>;
  if (error) return <div className="chat-error">{error}</div>;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>{otherUserName}</h2>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => {
          const isCurrentUser = msg.user_id === userId;
          return (
            <div
              key={msg.id || index}
              className={`message ${isCurrentUser ? 'sent' : 'received'}`}
            >
              <div className="message-content">{msg.message}</div>
              <div className="message-time">
                {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <button onClick={handleSendMessage}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#FF8C00">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatOpen;