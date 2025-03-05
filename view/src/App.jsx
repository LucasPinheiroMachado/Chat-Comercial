import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Home from './pages/Home/Home';
import AllUsers from './pages/AllUsers/AllUsers';
import Login from './pages/Login/Login';
import SignUp from './pages/SignUp/SignUp';
import ChatOpen from './pages/ChatOpen/ChatOpen';
import BeginConversation from './pages/BeginConversation/BeginConversation';
import SearchUsers from './pages/SearchUsers/SearchUsers';

function App() {
  const token = localStorage.getItem('token')
  return (
  <>
    <Router>
      <Routes>
        <Route path="/" element={token ? <Home /> : <Login/>} />
        <Route path="/all-users" element={<AllUsers />} />
        <Route path="/login" element={!token ? <Login /> : <Home/>} />
        <Route path="/signup" element={!token ? <SignUp /> : <Home/>} />
        <Route path="/chat/:id" element={<ChatOpen />} />
        <Route path="/beginconversation/:id" element={<BeginConversation />} />
        <Route path="/searchusers/:search" element={<SearchUsers />} />
      </Routes>
    </Router>
  </>
  );
}

export default App;