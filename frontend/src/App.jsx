
import { useState } from 'react';
import './App.css'
import Dashboard from './pages/dashboard';

function App() {
  const [message,setMessage] = useState('');

  async function handleFetch(){
      let response = await fetch('http://127.0.0.1:8000');
      let data = await response.json();
      console.log(data);
      setMessage(data.message);
  }

  return (
    <>
        <Dashboard/>
    </>
  )
}

export default App
