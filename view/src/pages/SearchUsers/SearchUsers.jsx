import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import SearchMenu from "../../components/SearchMenu/SearchMenu";
import Loading from "../../components/Loading/Loading";
import Conversation from "../../components/Conversation/Conversation";
import { API_CONFIG } from '../../config';

const fetchUsers = async (search) => {
  const token = localStorage.getItem('token');

  if (!token) {
    console.error("Token não encontrado");
    return [];
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/search/${search}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar usuários');
    }

    const text = await response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error(error);
    return [];
  }
};

const checkConversation = async (otherUserId) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/twousersconversation/${otherUserId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      mode: 'cors'
    });
    
    if (response.status === 403 || response.status === 404) {
      return null;
    }
    
    if (!response.ok) throw new Error('Erro ao verificar conversa');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const SearchUsers = () => {
  const { search } = useParams();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const loggedUserId = parseInt(localStorage.getItem('userId'));

  useEffect(() => {
    const loadUsersAndConversations = async () => {
      try {
        const userList = await fetchUsers(search || '');
        
        if (!userList || !Array.isArray(userList)) {
          throw new Error('Resposta inválida da API');
        }

        const filteredUsers = userList.filter(user => user.id !== loggedUserId);
        
        const usersWithStatus = await Promise.all(
          filteredUsers.map(async (user) => {
            const conversation = await checkConversation(user.id);
            return {
              ...user,
              conversationId: conversation?.id || null
            };
          })
        );

        setUsers(usersWithStatus.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        ));
      } catch (error) {
        console.error(error);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsersAndConversations();
  }, [search, loggedUserId]);

  return (
    <div>
      <SearchMenu />
      {isLoading ? (
        <Loading />
      ) : users.length === 0 ? (
        <p>Nenhum usuário encontrado para "{search}".</p>
      ) : (
        users.map((user) => (
          <Conversation
            key={user.id}
            name={user.name}
            lastMessageDate={new Date(user.created_at)}
            conversationId={user.conversationId}
            otherUserId={user.id}
          />
        ))
      )}
    </div>
  );
};

export default SearchUsers;