import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';
import 'react-calendar/dist/Calendar.css';

const Calendar = dynamic(() => import('react-calendar'), { ssr: false });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

// Definire gli orari per tutte le aule
const orari = [
  '08:15', '09:15', '10:15', '11:15', 
  '12:15', '13:15', '14:15', '15:15', 
  '16:15', '17:15'
];

const AulePrenotazione = ({ type, selectedDate, onDateChange, onRoomClick, selectedRoom }) => {
  const [aule, setAule] = useState([]);
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [selectedAula, setSelectedAula] = useState(null);
  const [selectedTime, setSelectedTime] = useState('08:15');
  const [userName, setUserName] = useState('');
  const [loadingAule, setLoadingAule] = useState(true);
  const [loadingPrenotazioni, setLoadingPrenotazioni] = useState(true);
  const [selectedAulaView, setSelectedAulaView] = useState(1);
  const [selectedRoomState, setSelectedRoomState] = useState(null);
  const [roomBookings, setRoomBookings] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  
  // Recupera i dati dell'utente corrente
  useEffect(() => {
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    };

    const authToken = getCookie('auth_token');
    if (authToken) {
      try {
        const decodedData = atob(authToken);
        const user = JSON.parse(decodedData);
        setCurrentUser(user);
        setUserName(user.nome); // Imposta automaticamente il nome utente per le prenotazioni
      } catch (e) {
        console.error('Errore nel parsing dei dati utente:', e);
      }
    }
  }, []);

  // Funzione per verificare se l'utente può cancellare una prenotazione
  const canDeleteBooking = (bookingUserName) => {
    if (!currentUser) return false;
    // L'admin può cancellare tutte le prenotazioni
    if (currentUser.ruolo === 'admin') return true;
    // Un docente può cancellare solo le proprie prenotazioni
    return currentUser.nome === bookingUserName;
  };

  // Funzione refreshPrenotazioni definita prima del useEffect
  const refreshPrenotazioni = useCallback(async (formattedDate) => {
    console.log('=== INIZIO REFRESH ===');
    console.log('Data per refresh:', formattedDate);
    
    try {
      setLoadingPrenotazioni(true);
      const { data, error } = await supabase
        .from('prenotazioni')
        .select('id, id_aula, data, orario, nome_utente, aule (nome)')
        .eq('data', formattedDate)
        .order('orario', { ascending: true });
  
      console.log('Dati recuperati:', data);
      console.log('Eventuali errori:', error);
  
      if (error) throw error;
  
      // Aggiorna lo stato delle prenotazioni
      setPrenotazioni(data || []);
    } catch (error) {
      console.error('Errore durante il refresh:', error);
    } finally {
      setLoadingPrenotazioni(false);
      console.log('=== FINE REFRESH ===');
    }
  }, []);

  useEffect(() => {
    const fetchAule = async () => {
      setLoadingAule(true);
      try {
        const { data, error } = await supabase
          .from('aule')
          .select('*')
          .order('nome');
        if (error) throw error;
        setAule(data);
        if (data && data.length > 0) {
          setSelectedAulaView(data[0].id);
        }
      } catch (error) {
        console.error('Errore nel recupero delle aule:', error);
      } finally {
        setLoadingAule(false);
      }
    };
    fetchAule();
  }, []);

  // Carica le prenotazioni quando cambia la data selezionata
  useEffect(() => {
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString('sv-SE');
      refreshPrenotazioni(formattedDate);
    }
  }, [selectedDate, refreshPrenotazioni]);

  const handlePrenotazione = async () => {
    if (!selectedAula || !userName || !selectedTime) {
      alert('Per favore, compila tutti i campi');
      return;
    }

    const formattedDate = selectedDate.toLocaleDateString('sv-SE');

    try {
      // Verifica se esiste già una prenotazione per quell'aula e orario
      const { data: existing, error: fetchError } = await supabase
        .from('prenotazioni')
        .select('*')
        .eq('id_aula', selectedAula)
        .eq('data', formattedDate)
        .eq('orario', selectedTime);

      if (fetchError) throw fetchError;
      if (existing && existing.length > 0) {
        alert(`L'aula è già prenotata per le ${selectedTime} da ${existing[0].nome_utente}`);
        return;
      }

      // Inserisci la nuova prenotazione
      const { error: insertError } = await supabase
        .from('prenotazioni')
        .insert([{
          id_aula: selectedAula,
          data: formattedDate,
          orario: selectedTime,
          nome_utente: userName
        }]);

      if (insertError) throw insertError;

      alert('Prenotazione effettuata con successo!');
      setUserName(''); // Resetta il campo nome

      // Aggiorna lo stato con le nuove prenotazioni
      await refreshPrenotazioni(formattedDate);

      // Forza il re-render del calendario cambiando data e ripristinandola subito dopo
      const nextDay = new Date(selectedDate);
      nextDay.setDate(selectedDate.getDate() + 1);
      onDateChange(nextDay);  // cambia temporaneamente la data
      setTimeout(() => onDateChange(selectedDate), 50);  // torna alla data originale

    } catch (error) {
      console.error('Errore durante la prenotazione:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const handleAnnullaPrenotazione = async (idPrenotazione, bookingUserName) => {
    // Verifica i permessi prima di procedere
    if (!canDeleteBooking(bookingUserName)) {
      alert('Non hai i permessi per cancellare questa prenotazione');
      return;
    }

    try {
      console.log('ID da cancellare:', idPrenotazione, 'Tipo:', typeof idPrenotazione);
      
      // Converti esplicitamente a numero se necessario
      const idNumerico = Number(idPrenotazione);
      
      const { data, error } = await supabase
        .from('prenotazioni')
        .delete()
        .eq('id', idNumerico)
        .select();
      
      console.log('Risposta cancellazione:', { data, error });
  
      if (error) throw error;
      
      if (data && data.length > 0) {
        console.log('Record cancellato:', data[0]);
        alert('Prenotazione cancellata con successo!');
        // Aggiorna lo stato
        await refreshPrenotazioni(selectedDate.toLocaleDateString('sv-SE'));
      } else {
        console.log('Nessun record trovato con questo ID');
        alert('Nessuna prenotazione trovata con questo ID');
      }
    } catch (error) {
      console.error('Errore cancellazione:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
   
    const formattedDate = date.toLocaleDateString('sv-SE');
    const hasPrenotazioni = prenotazioni.some(p => p.data === formattedDate);
    
    return hasPrenotazioni ? 'occupied-day' : 'free-day';
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const formattedDate = date.toLocaleDateString('sv-SE');
    const prenotazioniGiorno = prenotazioni.filter(p => p.data === formattedDate);

    // Funzione per determinare lo stato delle ore (mattina/pomeriggio)
    const getStatusColor = (startIndex, endIndex) => {
      const orePeriodo = orari.slice(startIndex, endIndex);
      const prenotazioniPeriodo = prenotazioniGiorno.filter(p => 
        orePeriodo.some(ora => p.orario?.startsWith(ora))
      );
      
      if (prenotazioniPeriodo.length === 0) return '#16a34a'; // verde - tutte libere
      if (prenotazioniPeriodo.length === orePeriodo.length) return '#dc2626'; // rosso - tutte occupate
      return '#f97316'; // arancione - parzialmente occupate
    };

    // Stato mattina (prime 6 ore)
    const morningStatus = getStatusColor(0, 6);
    // Stato pomeriggio (ultime 4 ore)
    const afternoonStatus = getStatusColor(6, 10);

    return (
      <div style={{
        position: 'absolute',
        bottom: '4px',
        left: '0',
        right: '0',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0 8px',
        width: '100%',
        zIndex: 1,
        pointerEvents: 'none'
      }}>
        {/* Puntino del mattino a sinistra */}
        <div style={{ 
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: morningStatus,
          border: '1px solid white'
        }} 
        title={`Mattina: ${morningStatus === '#16a34a' ? 'Tutte libere' : 
                         morningStatus === '#dc2626' ? 'Tutte occupate' : 
                         'Parzialmente occupate'}`}
        />
        
        {/* Puntino del pomeriggio a destra */}
        <div style={{ 
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: afternoonStatus,
          border: '1px solid white'
        }}
        title={`Pomeriggio: ${afternoonStatus === '#16a34a' ? 'Tutte libere' : 
                             afternoonStatus === '#dc2626' ? 'Tutte occupate' : 
                             'Parzialmente occupate'}`}
        />
      </div>
    );
  };

  // Aggiorna selectedAula quando cambia selectedRoom
  useEffect(() => {
    if (selectedRoom) {
      const aula = aule.find(a => a.nome === selectedRoom);
      if (aula) {
        setSelectedAula(aula.id);
        setSelectedAulaView(aula.id);
      }
    }
  }, [selectedRoom, aule]);

  // Funzione per gestire il click su un'aula
  const handleAulaClick = (aula) => {
    setSelectedAula(aula.id);
    setSelectedAulaView(aula.id);
    if (onRoomClick) {
      onRoomClick(aula.nome);
    }
  };

  const handleRoomClick = async (roomName) => {
    try {
      setLoadingPrenotazioni(true);
      const roomId = aule.find(a => a.nome === roomName)?.id;
      if (!roomId) return;

      const { data: bookings, error } = await supabase
        .from('prenotazioni')
        .select('*')
        .eq('id_aula', roomId)
        .order('data', { ascending: true });

      if (error) throw error;

      setSelectedRoomState(roomName);
      setRoomBookings({
        [roomName]: bookings
      });
      
      if (onRoomClick) {
        onRoomClick(roomName);
      }
    } catch (error) {
      console.error('Errore nel recupero delle prenotazioni:', error);
    } finally {
      setLoadingPrenotazioni(false);
    }
  };

  return (
    <div className="max-w-[3000px] mx-auto">
      {loadingAule ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {type === 'calendar' && (
            <div className="bg-gray-100 rounded-xl shadow-sm h-[580px] p-2 sm:p-4 border border-blue-400">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                📅 Calendario Prenotazioni
              </h2>
              <div className="h-full">
                <style jsx global>{`
                  .react-calendar {
                    width: 100%;
                    max-width: 1000px;
                    border: 0.5px solid #e5e7eb !important; /* border-gray-200 */
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                  }

                  .react-calendar__navigation__label {
                    font-size: 1.2rem !important;
                    font-weight: 700 !important;
                    color: #1e40af !important;
                    padding: 0.15rem 1rem !important;
                    background-color: #f1f5ff !important;
                    border-radius: 0.5rem !important;
                    margin: 0.15rem 0 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    min-height: 2rem !important;
                    line-height: 1 !important;
                  }

                  .react-calendar__navigation__label__labelText {
                    text-transform: capitalize !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    height: 100% !important;
                  }

                  .react-calendar__navigation__arrow {
                    font-size: 1.5rem !important;
                    color: #1e40af !important;
                    padding: 0.35rem !important;
                    min-width: 2rem !important;
                    min-height: 2rem !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    border-radius: 0.5rem !important;
                    margin: 0.15rem 0 !important;
                  }

                  .react-calendar__navigation__arrow:hover {
                    color: #2563eb !important;
                    transform: scale(1.1) !important;
                    transition: all 0.2s ease !important;
                  }

                  .react-calendar__navigation__arrow:disabled {
                    opacity: 0.5 !important;
                    cursor: not-allowed !important;
                  }

                  .react-calendar__tile {
                    position: relative !important;
                    height: 70px !important;
                    padding-top: 8px !important;
                    margin: 0 !important;
                  }

                  .react-calendar__month-view__days__day {
                    border: 0.5px solid #e5e7eb !important; /* border-gray-200 */
                    background-color: #f3f4f6 !important; /* bg-gray-100 */
                  }

                  .react-calendar__month-view__days__day--neighboringMonth {
                    opacity: 0.5 !important;
                    background-color: #f3f4f6 !important; /* bg-gray-100 */
                  }

                  /* Stile per giorni liberi */
                  .free-day {
                    background-color: #f3f4f6 !important; /* bg-gray-100 */
                  }

                  /* Stile per giorni occupati */
                  .occupied-day {
                    background-color: #fee2e2 !important;
                  }

                  /* Stile base per i numeri del calendario */
                  .react-calendar__tile abbr {
                    color: #000000 !important;
                    font-size: 1rem !important;
                    font-weight: 500 !important;
                    text-decoration: none !important;
                    display: inline-block !important;
                    padding: 4px !important;
                    text-align: center !important;
                  }

                  /* Stile per il giorno corrente */
                  .react-calendar__tile--now {
                    background-color: #f3f4f6 !important; /* bg-gray-100 */
                  }

                  .react-calendar__tile--now abbr {
                    background-color: #e9d5ff !important;
                    color: #000000 !important;
                    border-radius: 50% !important;
                    width: 28px !important;
                    height: 28px !important;
                    line-height: 20px !important;
                    font-weight: 500 !important;
                  }

                  /* Stile per il giorno selezionato */
                  .react-calendar__tile--active {
                    background-color: #f3f4f6 !important; /* bg-gray-100 */
                  }

                  .react-calendar__tile--active abbr {
                    background-color: #2563eb !important;
                    color: white !important;
                    border-radius: 50% !important;
                    width: 28px !important;
                    height: 28px !important;
                    line-height: 20px !important;
                  }

                  /* Rimuovi i bordi esterni del calendario */
                  .react-calendar__month-view {
                    border: none !important;
                  }

                  /* Rimuovi i bordi tra le righe */
                  .react-calendar__month-view__days__day {
                    border-right: 0.5px solid #e5e7eb !important; /* border-gray-200 */
                    border-bottom: 0.5px solid #e5e7eb !important; /* border-gray-200 */
                  }

                  /* Rimuovi il bordo destro dell'ultima colonna */
                  .react-calendar__month-view__days__day:nth-child(7n) {
                    border-right: none !important;
                  }

                  /* Rimuovi il bordo inferiore dell'ultima riga */
                  .react-calendar__month-view__days__day:nth-last-child(-n+7) {
                    border-bottom: none !important;
                  }

                  /* Stile per i giorni della settimana */
                  .react-calendar__month-view__weekdays {
                    margin-top: 0 !important;
                  }

                  .react-calendar__month-view__weekdays__weekday {
                    text-decoration: none !important;
                    font-weight: 700 !important;
                    padding: 6px 0 !important;
                    background-color: #f3f4f6 !important; /* bg-gray-100 */
                    border-bottom: 0.5px solid #e5e7eb !important; /* border-gray-200 */
                  }

                  .react-calendar__month-view__weekdays__weekday abbr {
                    text-decoration: none !important;
                    border-bottom: none !important;
                    font-size: 0.9rem !important;
                    font-weight: 700 !important;
                    color: #1e40af !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                  }

                  .react-calendar__navigation {
                    margin-bottom: 0 !important;
                  }
                `}</style>
                <Calendar
                  onChange={onDateChange}
                  value={selectedDate}
                  tileClassName={tileClassName}
                  tileContent={tileContent}
                  className="w-full border-0"
                  locale="it-IT"
                  prev2Label={null}
                  next2Label={null}
                />
              </div>
            </div>
          )}

          {type === 'form' && (
            <div className="bg-gray-100 p-3 sm:p-5 rounded-xl h-[400px] border border-blue-400">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                ➕ Nuova Prenotazione
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🏢 Aula</label>
                  <select 
                    value={selectedAula || ''} 
                    onChange={(e) => setSelectedAula(e.target.value)} 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Aula...</option>
                    {aule.map((aula) => (
                      <option key={aula.id} value={aula.id}>{aula.nome}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">🕒 Orario</label>
                  <select 
                    value={selectedTime} 
                    onChange={(e) => setSelectedTime(e.target.value)} 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {orari.map((orario, index) => {
                      const nextHour = index < orari.length - 1 ? orari[index + 1] : '18:15';
                      return (
                        <option key={orario} value={orario}>
                          {orario} - {nextHour}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">👤 Nome Utente</label>
                  <select 
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)} 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Utente...</option>
                    <option value="Usai Guglielmo">Usai Guglielmo</option>
                    <option value="Roggio AnnaMaria">Roggio AnnaMaria</option>
                    <option value="Palma Alessio">Palma Alessio</option>
                    <option value="Multazzu Salvatore">Multazzu Salvatore</option>
                    <option value="Gianino Sara">Gianino Sara</option>
                    <option value="Cherchi Marcello">Cherchi Marcello</option>
                  </select>
                </div>
                
                <div>
                  <button 
                    onClick={handlePrenotazione}
                    disabled={!selectedAula || !userName}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 mt-4 ${
                      !selectedAula || !userName 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                    }`}
                  >
                    Conferma
                  </button>
                </div>
              </div>
            </div>
          )}

          {type === 'list' && (
            <div className="bg-gray-100 rounded-xl shadow-sm h-[580px] border border-blue-400">
              <h2 className="text-xl font-semibold text-gray-800 p-4">
                🏫 Prenotazioni Aule
              </h2>
              {loadingPrenotazioni ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  {/* Menu a tendina per selezionare l'aula */}
                  <div className="mb-4 px-4">
                    <select 
                      value={selectedAula || ''} 
                      onChange={(e) => {
                        const aula = aule.find(a => a.id === Number(e.target.value));
                        if (aula) handleAulaClick(aula);
                      }}
                      className="w-full p-2.5 border border-blue-400 rounded-lg bg-gray-100 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleziona un&apos;aula...</option>
                      {aule.map((aula) => (
                        <option key={aula.id} value={aula.id}>
                          {aula.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Lista delle aule filtrata con scrollbar */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                    <div className="grid grid-cols-1 gap-4 h-auto">
                      {aule
                        .filter(aula => aula.id === selectedAulaView)
                        .map((aula) => {
                          const prenotazioniAula = prenotazioni.filter(p => p.id_aula === aula.id);
                          
                          const prenotazioniOrari = orari.map(orario => {
                            const pren = prenotazioniAula.find(p => p.orario?.slice(0,5) === orario);
                            return { orario, prenotazione: pren };
                          });

                          const numPrenotate = prenotazioniOrari.filter(p => p.prenotazione).length;
                          const hasPrenotazioni = numPrenotate > 0;

                          return (
                            <div key={aula.id} className="bg-gray-100 rounded-xl p-5">
                              <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                                  <span className="bg-blue-100 text-blue-800 p-2 rounded-lg mr-3">
                                    {aula.nome}
                                  </span>
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  hasPrenotazioni ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {hasPrenotazioni ? `${numPrenotate}/${orari.length} prenotate` : 'Disponibile'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-2 sm:gap-y-3 max-h-[350px] overflow-y-auto">
                                {prenotazioniOrari.map(({ orario, prenotazione }) => {
                                  const isOccupato = !!prenotazione;
                                  const canDelete = prenotazione && canDeleteBooking(prenotazione.nome_utente);

                                  return (
                                    <div
                                      key={orario}
                                      className={`p-1.5 sm:p-2 rounded-md text-sm min-h-[56px] flex flex-col justify-between ${
                                        isOccupato 
                                          ? 'bg-red-500 border border-red-600 text-white hover:bg-red-600' 
                                          : 'bg-green-100 border border-green-200 text-green-800 hover:bg-green-200'
                                      } transition-colors duration-200`}
                                    >
                                      <div className="font-medium">{orario}</div>
                                      <div className="text-xs flex items-center justify-between flex-wrap">
                                        {isOccupato ? (
                                          <>
                                            <span className="font-medium text-white truncate max-w-[80%]">
                                              Prenotato da: {prenotazione.nome_utente}
                                            </span>
                                            {canDelete && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleAnnullaPrenotazione(prenotazione.id, prenotazione.nome_utente);
                                                }}
                                                className="ml-2 text-xs text-white hover:text-gray-200"
                                                title="Cancella prenotazione"
                                              >
                                                ✕
                                              </button>
                                            )}
                                          </>
                                        ) : (
                                          <span className="text-green-600">Disponibile</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {type === 'detail' && (
            <div className="bg-gray-100 rounded-xl shadow-sm h-[400px] p-2 sm:p-4 border border-blue-400">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📊 Riepilogo Prenotazioni
              </h2>
              <style jsx global>{`
                .custom-scrollbar {
                  scrollbar-width: thin;
                  scrollbar-color: #93c5fd #f1f5ff;
                  -webkit-overflow-scrolling: touch;
                  overscroll-behavior: contain;
                }
                .custom-scrollbar::-webkit-scrollbar {
                  width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #f1f5ff;
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: #93c5fd;
                  border-radius: 4px;
                  border: 2px solid #f1f5ff;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background-color: #60a5fa;
                }
                @media (max-width: 640px) {
                  .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                  }
                  .custom-scrollbar {
                    scrollbar-width: thin;
                    -webkit-overflow-scrolling: touch;
                  }
                }
              `}</style>
              <div className="h-[calc(100%-60px)] overflow-hidden">
                <div className="h-full overflow-y-auto custom-scrollbar pr-2">
                  <div className="bg-white rounded-lg shadow-lg">
                    <div className="sticky top-0 z-10 bg-white border-b border-blue-200">
                      <div className="p-3">
                        <select 
                          value={selectedRoomState || ''} 
                          onChange={(e) => {
                            const roomName = e.target.value;
                            if (roomName) {
                              handleRoomClick(roomName);
                            } else {
                              setSelectedRoomState(null);
                              setRoomBookings({});
                            }
                          }}
                          className="w-full p-2 border border-blue-400 rounded-lg bg-gray-100 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Seleziona un&apos;aula...</option>
                          {aule.map((aula) => (
                            <option key={aula.id} value={aula.nome}>
                              {aula.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full table-fixed">
                          <thead className="bg-gray-50 border-b border-blue-200">
                            <tr>
                              <th scope="col" className="w-1/3 px-3 py-2 text-left text-xs font-bold text-[#1e40af] uppercase tracking-wider">
                                Data
                              </th>
                              <th scope="col" className="w-1/4 px-3 py-2 text-left text-xs font-bold text-[#1e40af] uppercase tracking-wider">
                                Orario
                              </th>
                              <th scope="col" className="w-5/12 px-3 py-2 text-left text-xs font-bold text-[#1e40af] uppercase tracking-wider">
                                Utente
                              </th>
                            </tr>
                          </thead>
                        </table>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full table-fixed divide-y divide-gray-200">
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedRoomState && roomBookings[selectedRoomState] ? (
                            Object.entries(roomBookings[selectedRoomState].reduce((acc, booking) => {
                              const date = new Date(booking.data).toLocaleDateString('it-IT', {
                                weekday: 'short',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              }).replace(',', '').replace(/\//g, '.');
                              if (!acc[date]) acc[date] = [];
                              acc[date].push(booking);
                              return acc;
                            }, {})).map(([date, dateBookings]) => (
                              dateBookings.map((booking, index) => (
                                <tr key={`${date}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  {index === 0 ? (
                                    <td rowSpan={dateBookings.length} className="w-1/3 px-3 py-1.5 whitespace-nowrap text-sm font-medium text-blue-600">
                                      {date}
                                    </td>
                                  ) : null}
                                  <td className="w-1/4 px-3 py-1.5 whitespace-nowrap text-sm text-gray-600">
                                    {booking.orario ? booking.orario.slice(0, 5) : `${booking.ora_inizio?.slice(0, 5)} - ${booking.ora_fine?.slice(0, 5)}`}
                                  </td>
                                  <td className="w-5/12 px-3 py-1.5 whitespace-nowrap text-sm text-gray-800 font-medium">
                                    {booking.nome_utente || '—'}
                                  </td>
                                </tr>
                              ))
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className="px-3 py-4 text-center text-sm text-gray-500">
                                {selectedRoomState ? 'Nessuna prenotazione trovata' : ''}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AulePrenotazione;


