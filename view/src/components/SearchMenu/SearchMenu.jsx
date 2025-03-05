import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import './SearchMenu.css';
import { API_CONFIG } from '../../config';

const SearchMenu = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();
  const location = useLocation(); 

  const handleSearch = () => {
    navigate(`/searchusers/${username}`);
  };

  const handleLogout = async () => {
    if (window.confirm("Você realmente deseja sair?")) {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          localStorage.clear();
          console.log('Logout realizado com sucesso');
          navigate('/login');
          window.location.reload();
        } else {
          throw new Error('Falha ao fazer logout!');
        }
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Falha ao fazer logout!');
      }
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="searchMenu">
      <div className="logoutButton" onClick={handleLogout}>Sair</div>
      <div className="navigationButtons">
        <button className={`navButton ${isActive('/') ? 'active' : ''}`} onClick={() => navigate('/')}>Conversas</button>
        <button className={`navButton ${isActive('/all-users') ? 'active' : ''}`} onClick={() => navigate('/all-users')}>Usuários</button>
      </div>
      <div className="searchInputContainer">
        <input type="text" className="searchInput" placeholder="Buscar usuário..." value={username} onChange={(e) => setUsername(e.target.value)} />
        <button className="searchButton" onClick={handleSearch}>Pesquisar</button>
      </div>
    </div>
  );
};

export default SearchMenu;
