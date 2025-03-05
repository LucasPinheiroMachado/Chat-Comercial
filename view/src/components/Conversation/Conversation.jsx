import React from 'react';
import { Link } from 'react-router-dom';
import './Conversation.css';

const Conversation = ({ 
  name, 
  lastMessageDate, 
  conversationId, 
  otherUserId, 
  lastMessageContent 
}) => {
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(lastMessageDate);

  // Determina o link com base na existência da conversa
  const linkPath = conversationId 
    ? `/chat/${conversationId}`
    : `/beginconversation/${otherUserId}`;

  return (
    <Link to={linkPath} className="conversation-link">
      <div className="conversation">
        <div className="imgAndUser">
          <img 
            src="https://static.vecteezy.com/system/resources/previews/019/879/186/non_2x/user-icon-on-transparent-background-free-png.png" 
            alt="User"
          />
          <div className="user-info">
            <h2>{name}</h2>
            {lastMessageContent && (
              <p className="last-message">{lastMessageContent}</p>
            )}
          </div>
        </div>
        <p className="lastMessageDate">{formattedDate}</p>
      </div>
    </Link>
  );
};

// Definir default prop para segurança
Conversation.defaultProps = {
  lastMessageContent: null
};

export default Conversation;