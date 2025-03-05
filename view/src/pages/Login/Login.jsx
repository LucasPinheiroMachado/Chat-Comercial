import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { API_CONFIG } from '../../config';

function safeParseJSON(text) {
  text = text.trim();
  let extracted = null;

  if (text.startsWith("[") || text.startsWith("{")) {
    let depth = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "[" || text[i] === "{") depth++;
      else if (text[i] === "]" || text[i] === "}") depth--;
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

const handleSubmit = async (e, login, pass, navigate) => {
  e.preventDefault(); // Evita recarregar a página

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/login`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ login, pass })
    });

    if (!response.ok) throw new Error("Erro ao fazer login!");

    const text = await response.text();
    const data = safeParseJSON(text);

    if (data && data.user) {
      localStorage.setItem("userType", data.user.type);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("token", data.token);
      navigate("/");
      window.location.reload();
    } else {
      console.error("Erro: resposta inválida do servidor.");
    }
  } catch (error) {
    console.error(error);
  }
};

const Login = () => {
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/login");
  }, [navigate]);

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={(e) => handleSubmit(e, login, pass, navigate)}>
        <h1 className="login-title">Bem-vindo</h1>

        <div className="input-group">
          <label htmlFor="login">Login</label>
          <input
            type="text"
            id="login"
            placeholder="Digite seu login"
            className="login-input"
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
            className="login-input"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </div>

        <button type="submit" className="login-button">Entrar</button>

        <div className="signup-link">
          Não tem uma conta? <a href="/signup">Cadastre-se</a>
        </div>
      </form>
    </div>
  );
};

export default Login;
