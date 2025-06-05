import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@supabase/supabase-js';
import 'react-calendar/dist/Calendar.css';

const Calendar = dynamic(() => import('react-calendar'), { ssr: false });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

const AulePrenotazione = ({ type, selectedDate, onDateChange }) => {
  const [aule, setAule] = useState([]);
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [prenotazioniPerAula, setPrenotazioniPerAula] = useState({});
  const [selectedAula, setSelectedAula] = useState(null);
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [userName, setUserName] = useState('');
  const [loadingAule, setLoadingAule] = useState(true);
  const [loadingPrenotazioni, setLoadingPrenotazioni] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

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
      } catch (error) {
        console.error('Errore nel recupero delle aule:', error);
      } finally {
        setLoadingAule(false);
      }
    };
    fetchAule();
  }, []);

  useEffect(() => {
    if (aule.length === 0) return;
    const fetchPrenotazioni = async () => {
      setLoadingPrenotazioni(true);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      try {
        const { data, error } = await supabase
          .from('prenotazioni')
          .select('id, id_aula, data, orario, nome_utente, aule (nome)')
          .eq('data', formattedDate)
          .eq('orario', '08:00');
        if (error) throw error;
        setPrenotazioni(data);

        const updated = {};
        aule.forEach(aula => {
          const prenotazione = data.find(p => p.id_aula === aula.id);
          updated[aula.id] = {
            id: prenotazione?.id || null,
            nome: aula.nome,
            orario: '08:00',
            utente: prenotazione ? prenotazione.nome_utente : null
          };
        });
        setPrenotazioniPerAula(updated);
      } catch (error) {
        console.error('Errore nel recupero delle prenotazioni:', error);
      } finally {
        setLoadingPrenotazioni(false);
      }
    };
    fetchPrenotazioni();
  }, [selectedDate, aule]);

  const handlePrenotazione = async () => {
    if (!selectedAula || !userName) {
      alert('Per favore, compila tutti i campi');
      return;
    }
    const formattedDate = selectedDate.toISOString().split('T')[0];
    try {
      const { data: existingPrenotazione, error: fetchError } = await supabase
        .from('prenotazioni')
        .select('id, nome_utente')
        .eq('id_aula', parseInt(selectedAula))
        .eq('data', formattedDate)
        .eq('orario', '08:00')
        .single();
      if (existingPrenotazione) {
        alert(`Aula già prenotata da ${existingPrenotazione.nome_utente}`);
        return;
      }
      const { error: insertError } = await supabase
        .from('prenotazioni')
        .insert([{ id_aula: parseInt(selectedAula), data: formattedDate, orario: '08:00', nome_utente: userName }]);
      if (insertError) throw insertError;
      alert('Prenotazione effettuata con successo!');
      setSelectedAula(null);
      setUserName('');
      await refreshPrenotazioni(formattedDate);
    } catch (error) {
      console.error('Errore durante la prenotazione:', error);
      alert(error.message || 'Errore durante la prenotazione.');
    }
  };

  const handleAnnullaPrenotazione = async (idPrenotazione) => {
    try {
      console.log('ID da cancellare:', idPrenotazione, 'Tipo:', typeof idPrenotazione);
      
      // Converti esplicitamente a numero se necessario
      const idNumerico = Number(idPrenotazione);
      
      // Aggiungi RETURNING per debug
      const { data, error } = await supabase
        .from('prenotazioni')
        .delete()
        .eq('id', idNumerico)
        .select();  // Equivalente a RETURNING *
      
      console.log('Risposta cancellazione:', { data, error });
  
      if (error) throw error;
      
      if (data && data.length > 0) {
        console.log('Record cancellato:', data[0]);
        alert('Prenotazione cancellata con successo!');
        // Aggiorna lo stato
        await refreshPrenotazioni(selectedDate.toISOString().split('T')[0]);
      } else {
        console.log('Nessun record trovato con questo ID');
        alert('Nessuna prenotazione trovata con questo ID');
      }
    } catch (error) {
      console.error('Errore cancellazione:', error);
      alert(`Errore: ${error.message}`);
    }
  };

  // Funzione refreshPrenotazioni aggiornata
  const refreshPrenotazioni = async (formattedDate) => {
    console.log('=== INIZIO REFRESH ===');
    console.log('Data per refresh:', formattedDate);
    
    try {
      setLoadingPrenotazioni(true);
      const { data, error } = await supabase
        .from('prenotazioni')
        .select('id, id_aula, data, orario, nome_utente, aule (nome)')
        .eq('data', formattedDate)
        .eq('orario', '08:00');
  
      console.log('Dati recuperati:', data);
      console.log('Eventuali errori:', error);
  
      if (error) throw error;
  
      // Aggiorna lo stato delle prenotazioni
      setPrenotazioni(data || []);
  
      // Ricostruisci completamente prenotazioniPerAula
      const updated = {};
      aule.forEach(aula => {
        const prenotazione = data?.find(p => p.id_aula === aula.id);
        updated[aula.id] = {
          id: prenotazione?.id || null,
          nome: aula.nome,
          orario: '08:00',
          utente: prenotazione?.nome_utente || null
        };
      });
  
      console.log('Nuovo stato prenotazioniPerAula:', updated);
      setPrenotazioniPerAula(updated);
    } catch (error) {
      console.error('Errore durante il refresh:', error);
    } finally {
      setLoadingPrenotazioni(false);
      console.log('=== FINE REFRESH ===');
    }
  };

  const tileClassName = ({ date, view }) => {
    const formattedDate = date.toISOString().split('T')[0];
    if (prenotazioni.some(p => p.data === formattedDate)) {
      return 'relative bg-blue-100 border border-blue-400 rounded shadow-sm';
    }
    return 'border border-gray-200 rounded';
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 border border-blue-300">
      <h2 className="text-lg font-semibold text-gray-700 mb-6">
        {type === 'calendar' ? 'Calendario Prenotazioni' : 
         type === 'form' ? 'Nuova Prenotazione' : 
         'Lista Aule e Prenotazioni'}
      </h2>
      
      {loadingAule ? (
        <div className="flex justify-center items-center h-40">Caricamento aule in corso...</div>
      ) : (
        <>
          {type === 'calendar' ? (
            // Solo Calendario
            <div className="flex justify-center">
              <div className="border border-blue-400 rounded-lg p-4 shadow-inner w-full max-w-md">
                <Calendar
                  onChange={onDateChange}
                  value={selectedDate}
                  tileClassName={tileClassName}
                  className="w-full"
                  locale="it-IT"
                />
              </div>
            </div>
          ) : type === 'form' ? (
            // Solo Form Prenotazione
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seleziona Aula</label>
                    <select 
                      value={selectedAula || ''} 
                      onChange={(e) => setSelectedAula(e.target.value)} 
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleziona un'aula</option>
                      {aule.map((aula) => (
                        <option key={aula.id} value={aula.id}>{aula.nome}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orario</label>
                    <select 
                      value={selectedTime} 
                      disabled 
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                    >
                      <option value="08:00">08:00</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Utente</label>
                    <input 
                      type="text" 
                      value={userName} 
                      onChange={(e) => setUserName(e.target.value)} 
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Inserisci il tuo nome" 
                    />
                  </div>
                  
                  <button 
                    onClick={handlePrenotazione} 
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Prenota
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Lista Aule e Prenotazioni
            <div className="space-y-4">
              {loadingPrenotazioni ? (
                <div className="flex justify-center items-center h-40">Caricamento prenotazioni in corso...</div>
              ) : (
                <div className="space-y-4">
                  {aule.map((aula) => {
                    const prenotazione = prenotazioniPerAula[aula.id] || {
                      id: null,
                      nome: aula.nome,
                      orario: '08:00',
                      utente: null
                    };
        
                    return (
                      <div key={aula.id} className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-medium text-gray-800 mb-2">{aula.nome}</h4>
                        <div className={`p-2 rounded-md text-sm ${
                          prenotazione.utente ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          <div className="font-medium">08:00</div>
                          <div className="text-xs flex items-center justify-between">
                            {prenotazione.utente ? (
                              <>
                                <span>Prenotato da: {prenotazione.utente}</span>
                                <button
                                  onClick={() => handleAnnullaPrenotazione(prenotazione.id)}
                                  disabled={isCancelling}
                                  className={`ml-2 text-xs ${
                                    isCancelling 
                                      ? 'text-gray-500 cursor-not-allowed' 
                                      : 'text-blue-600 hover:underline hover:text-blue-800'
                                  }`}
                                >
                                  {isCancelling ? 'Cancellazione...' : 'Annulla'}
                                </button>
                              </>
                            ) : (
                              <span>Disponibile</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AulePrenotazione;

