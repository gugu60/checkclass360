import { useState } from 'react';
import styles from '../styles/Login.module.css';
import users from '../config/users';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Cerca l'utente nelle credenziali
      const user = users.find(u => 
        u.username === username && u.password === password
      );

      if (user) {
        // Impostiamo un cookie di autenticazione con i dati dell'utente
        const userData = {
          id: user.id,
          username: user.username,
          nome: user.nome,
          ruolo: user.ruolo
        };
        
        // Codifica i dati in base64 per evitare problemi con caratteri speciali
        const encodedData = btoa(JSON.stringify(userData));
        document.cookie = `auth_token=${encodedData}; path=/; max-age=3600`; // 1 ora
        window.location.href = '/';
        return;
      }

      setError('Credenziali non valide');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>CheckClass360</h1>
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={styles.input}
              disabled={isSubmitting}
              placeholder="Inserisci il tuo username"
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              disabled={isSubmitting}
              placeholder="Inserisci la tua password"
            />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button 
            type="submit" 
            className={styles.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
} 