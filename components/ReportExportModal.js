import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import GeneratePDFDocument from './GeneratePDFDocument';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ReportExportModal = ({ isOpen, onClose }) => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isLoading, setIsLoading] = useState(false);

  // Carica le aule e i docenti all'apertura del modal
  useEffect(() => {
    if (isOpen) {
      fetchRooms();
      fetchTeachers();
    }
  }, [isOpen]);

  const fetchRooms = async () => {
    try {
      console.log('=== INIZIO FETCH ROOMS ===');
      const { data, error } = await supabase
        .from('aule')
        .select('id, nome')
        .order('nome');
      
      console.log('Risultato query aule:', { data, error });
      
      if (error) {
        console.error('Errore Supabase aule:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('Nessuna aula trovata');
        setRooms([]);
        return;
      }

      // Mappiamo i dati nel formato corretto per il componente
      const formattedRooms = data.map(room => ({
        id_aula: room.id,
        nome_aula: room.nome
      }));

      console.log('Aule formattate:', formattedRooms);
      setRooms(formattedRooms);
      console.log('=== FINE FETCH ROOMS ===');
    } catch (error) {
      console.error('Errore nel recupero delle aule:', error);
      Swal.fire('Errore', 'Impossibile recuperare le aule: ' + error.message, 'error');
    }
  };

  const fetchTeachers = async () => {
    try {
      console.log('=== INIZIO FETCH TEACHERS ===');
      // Recupera i docenti dalla tabella utenti
      const { data: utenti, error } = await supabase
        .from('utenti')
        .select('id, nome, qualifica')
        .order('nome');
      
      console.log('Risultato query utenti:', { utenti, error });
      
      if (error) {
        console.error('Errore Supabase utenti:', error);
        throw error;
      }

      if (!utenti || utenti.length === 0) {
        console.log('Nessun utente trovato');
        setTeachers([]);
        return;
      }

      // Mappiamo i dati nel formato corretto per il componente
      const formattedTeachers = utenti.map(utente => {
        const nomeCompleto = utente.nome;
        const partiNome = nomeCompleto.split(' ');
        return {
          id_docente: utente.id,
          cognome: partiNome[0] || '',
          nome: partiNome.slice(1).join(' ') || '',
          qualifica: utente.qualifica
        };
      });

      console.log('Docenti formattati:', formattedTeachers);
      setTeachers(formattedTeachers);
      console.log('=== FINE FETCH TEACHERS ===');
    } catch (error) {
      console.error('Errore dettagliato nel recupero dei docenti:', error);
      Swal.fire('Errore', 'Impossibile recuperare i docenti: ' + error.message, 'error');
    }
  };

  const handleExport = async () => {
    if (!dateRange.start || !dateRange.end) {
      Swal.fire('Attenzione', 'Seleziona un intervallo di date', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      console.log('=== INIZIO EXPORT ===');
      console.log('Parametri:', { dateRange, selectedRoom, selectedTeacher });

      let query = supabase
        .from('prenotazioni')
        .select(`
          *,
          aule(id, nome),
          utenti(id, nome, qualifica)
        `)
        .gte('data', dateRange.start)
        .lte('data', dateRange.end);

      if (selectedRoom) {
        console.log('Filtro per aula:', selectedRoom);
        query = query.eq('id_aula', selectedRoom);
      }
      if (selectedTeacher) {
        console.log('Filtro per docente:', selectedTeacher);
        query = query.eq('id_utente', selectedTeacher);
      }

      console.log('Esecuzione query...');
      const { data: prenotazioni, error } = await query;
      console.log('Risultato query:', { prenotazioni, error });

      if (error) {
        console.error('Errore query:', error);
        throw error;
      }

      if (!prenotazioni || prenotazioni.length === 0) {
        console.log('Nessuna prenotazione trovata');
        Swal.fire('Nessun risultato', 'Non ci sono prenotazioni per i criteri selezionati', 'info');
        return;
      }

      console.log('Prenotazioni trovate:', prenotazioni.length);

      if (exportFormat === 'pdf') {
        await exportToPDF(prenotazioni);
      } else {
        await exportToExcel(prenotazioni);
      }

      console.log('=== FINE EXPORT ===');
      Swal.fire('Successo', 'Report esportato con successo!', 'success');
      onClose();
    } catch (error) {
      console.error('Errore dettagliato durante l\'esportazione:', error);
      Swal.fire('Errore', 'Impossibile esportare il report: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = async (prenotazioni) => {
    console.log('Preparazione dati per PDF...');
    const selectedTeacherInfo = selectedTeacher ? teachers.find(t => t.id_docente === selectedTeacher) : null;
    const reportData = {
      title: 'Report Prenotazioni',
      filters: {
        periodo: `${dateRange.start} - ${dateRange.end}`,
        aula: selectedRoom ? rooms.find(r => r.id_aula === selectedRoom)?.nome_aula : 'Tutte',
        docente: selectedTeacherInfo ? `${selectedTeacherInfo.cognome} ${selectedTeacherInfo.nome}` : 'Tutti'
      },
      prenotazioni: prenotazioni.map(p => {
        // Calcola l'ora di fine basata sull'orario di inizio
        const startTime = p.orario?.slice(0, 5) || '';
        let endTime = '';
        if (startTime) {
          const [hours, minutes] = startTime.split(':').map(Number);
          const endDate = new Date();
          endDate.setHours(hours + 1, minutes);
          endTime = endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        }

        return {
          data: p.data,
          ora_inizio: startTime,
          ora_fine: endTime,
          aula: p.aule?.nome || '',
          docente: p.utenti ? `${p.utenti.nome} (${p.utenti.qualifica})` : '',
          motivo: p.motivo || ''
        };
      })
    };

    console.log('Dati PDF preparati:', reportData);
    const blob = await pdf(<GeneratePDFDocument reportData={reportData} />).toBlob();
    const fileName = `Report_Prenotazioni_${dateRange.start}_${dateRange.end}.pdf`;
    saveAs(blob, fileName);
  };

  const exportToExcel = async (prenotazioni) => {
    console.log('Preparazione dati per Excel...');
    const rows = prenotazioni.map(p => {
      // Calcola l'ora di fine basata sull'orario di inizio
      const startTime = p.orario?.slice(0, 5) || '';
      let endTime = '';
      if (startTime) {
        const [hours, minutes] = startTime.split(':').map(Number);
        const endDate = new Date();
        endDate.setHours(hours + 1, minutes);
        endTime = endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      }

      return {
        Data: p.data,
        'Ora Inizio': startTime,
        'Ora Fine': endTime,
        Aula: p.aule?.nome || '',
        Docente: p.utenti ? `${p.utenti.nome} (${p.utenti.qualifica})` : '',
        Motivo: p.motivo || ''
      };
    });

    console.log('Dati Excel preparati:', rows);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Prenotazioni');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const fileName = `Report_Prenotazioni_${dateRange.start}_${dateRange.end}.xlsx`;
    saveAs(blob, fileName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Esporta Report</h2>
        
        <div className="space-y-4">
          {/* Filtro Periodo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Periodo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtro Aula */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aula
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Tutte le aule</option>
              {rooms.map(room => (
                <option key={room.id_aula} value={room.id_aula}>
                  {room.nome_aula}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Docente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Docente
            </label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Tutti i docenti</option>
              {teachers.map(teacher => (
                <option key={teacher.id_docente} value={teacher.id_docente}>
                  {teacher.cognome} {teacher.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Formato di esportazione */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formato
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2">PDF</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="form-radio text-blue-600"
                />
                <span className="ml-2">Excel</span>
              </label>
            </div>
          </div>
        </div>

        {/* Pulsanti */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Annulla
          </button>
          <button
            onClick={handleExport}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Esportazione...' : 'Esporta'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportExportModal; 