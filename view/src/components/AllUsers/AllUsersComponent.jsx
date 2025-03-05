import React, { useEffect, useState } from 'react';
import Conversation from '../Conversation/Conversation';
import Loading from '../Loading/Loading';
import { API_CONFIG } from '../../config';

const fetchUsers = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error("Token não encontrado");
    return [];
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/allusers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar usuários');
    }

    const data = await response.json();
    return data;
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
    
    if (response.status === 403 || response.status === 404 || response.status === 500) {
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

const AllUsersComponent = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const loggedUserId = parseInt(localStorage.getItem('userId'));
  const userType = localStorage.getItem('userType');

  useEffect(() => {
    const loadUsersAndConversations = async () => {
      try {
        const userList = await fetchUsers();
        
        let filteredUsers = userList.filter(user => {
          if (user.id === loggedUserId) return false;
          
          if (userType === 'standard') {
            return user.type === 'admin';
          }
          
          return true;
        });

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
      } finally {
        setIsLoading(false);
      }
    };

    loadUsersAndConversations();
  }, [loggedUserId, userType]);

  return (
    <div>
      {isLoading ? (
        <Loading />
      ) : users.length === 0 ? (
        <p>Nenhum usuário encontrado.</p>
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

export default AllUsersComponent;