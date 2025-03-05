import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignUp.css";
import { API_CONFIG } from '../../config';

const SignUp = () => {
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pass !== confirmPass) {
      alert("As senhas não correspondem!");
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/createuser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, login, pass, type: 'standard' })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert("Usuário criado com sucesso!");
        localStorage.setItem("userType", data.user.type);
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user.id);
        navigate("/"); 
        window.location.reload();
      } else {
        throw new Error(data.message || "Não foi possível criar o usuário.");
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      alert(error.message);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h1 className="signup-title">Cadastre-se</h1>

        <div className="input-group">
          <label htmlFor="name">Nome</label>
          <input
            type="text"
            id="name"
            placeholder="Digite seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="login">Login</label>
          <input
            type="text"
            id="login"
            placeholder="Digite seu login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Senha</label>
          <input
            type="password"
            id="password"
            placeholder="Digite sua senha"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="confirmPassword">Confirme sua senha</label>
          <input
            type="password"
            id="confirmPassword"
            placeholder="Confirme sua senha"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
          />
        </div>

        <button type="submit" className="signup-button">Cadastrar</button>
      </form>
    </div>
  );
};

export default SignUp;
