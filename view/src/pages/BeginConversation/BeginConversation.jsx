import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './BeginConversation.css';
import { API_CONFIG } from '../../config';

const BeginConversation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const loggedUserId = parseInt(localStorage.getItem('userId'));

  const handleBeginConversation = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    console.log(id)
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/beginconversation/${id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          mode: 'cors'
        }
      );

      const text = await response.text();
      const data = JSON.parse(text);

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao iniciar conversa');
      }

      if (data.conversation_id) {
        navigate(`/chat/${data.conversation_id}`);
      } else {
        throw new Error('ID da conversa não encontrado na resposta');
      }
      
    } catch (error) {
      console.error('Erro:', error);
      setError(error.message || 'Erro ao iniciar conversa');
    } finally {
      setIsLoading(false);
    }
  };

  const backToMenu = () => {
    navigate('/');
  };

  return (
    <div className='beginConversation'>
      {error && <p className="error-message">{error}</p>}
      
      <button 
        className='btn btn01' 
        onClick={handleBeginConversation}
        disabled={isLoading}
      >
        {isLoading ? 'Criando conversa...' : 'Iniciar conversa com esse usuário'}
      </button>
      
      <button 
        className='btn btn02' 
        onClick={backToMenu}
        disabled={isLoading}
      >
        Não iniciar conversa e retornar ao menu
      </button>
    </div>
  );
};

export default BeginConversation;