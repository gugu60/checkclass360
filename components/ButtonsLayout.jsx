import React from 'react';

const ButtonsLayout = ({
  isStudentNameValid,
  handleButtonClick,
  handlePrintWithoutAdding,
  handleGenerateExcelForDate,
  handleButtonWithPrintDialog,
}) => {
  return (
    <div className="flex flex-wrap justify-start mb-4">
      {/* Contenitore per i pulsanti 1-4 con margine destro */}
      <div className="flex flex-wrap mr-4"> {/* Aggiunto mr-4 per distanziare */}
        {/* Pulsante 1 - Ritardo P e stampa */}
        <button 
          className="relative flex items-center justify-center rounded-lg w-[38px] h-[38px] m-0.5 hover:opacity-80 transition duration-300 bg-no-repeat bg-center bg-gray-200"
          style={{ backgroundImage: 'url("/images/Pprint.png")', backgroundSize: 'auto' }}
          onClick={() => {
            if (!isStudentNameValid()) return;
            handleButtonWithPrintDialog('P');
          }}
          aria-label="Inserisci ritardo P e stampa"
          title="Inserisci ritardo P e stampa"
        >
          <span className="sr-only">Inserisci ritardo P</span>
        </button>

        {/* Pulsante 2 - Ritardo T e stampa */}
        <button 
          className="relative flex items-center justify-center rounded-lg w-[38px] h-[38px] m-0.5 hover:opacity-80 transition duration-300 bg-no-repeat bg-center bg-gray-200"
          style={{ backgroundImage: 'url("/images/Tprint.png")', backgroundSize: 'auto' }}
          onClick={() => {
            if (!isStudentNameValid()) return;
            handleButtonWithPrintDialog('T');
          }}
          aria-label="Inserisci ritardo T e stampa"
          title="Inserisci ritardo T e stampa"
        >
          <span className="sr-only">Inserisci ritardo T</span>
        </button>

        {/* Pulsante 3 - Ritardo M e stampa */}
        <button 
          className="relative flex items-center justify-center rounded-lg w-[38px] h-[38px] m-0.5 hover:opacity-80 transition duration-300 bg-no-repeat bg-center bg-gray-200"
          style={{ backgroundImage: 'url("/images/Mprint.png")', backgroundSize: 'auto' }}
          onClick={() => {
            if (!isStudentNameValid()) return;
            handleButtonWithPrintDialog('M');
          }}
          aria-label="Inserisci ritardo M e stampa"
          title="Inserisci ritardo M e stampa"
        >
          <span className="sr-only">Inserisci ritardo M</span>
        </button>

        {/* Pulsante 4 - Ritardo S e stampa */}
        <button 
          className="relative flex items-center justify-center rounded-lg w-[38px] h-[38px] m-0.5 hover:opacity-80 transition duration-300 bg-no-repeat bg-center bg-gray-200"
          style={{ backgroundImage: 'url("/images/Sprint.png")', backgroundSize: 'auto' }}
          onClick={() => {
            if (!isStudentNameValid()) return;
            handleButtonWithPrintDialog('S');
          }}
          aria-label="Inserisci ritardo S e stampa"
          title="Inserisci ritardo S e stampa"
        >
          <span className="sr-only">Inserisci ritardo S</span>
        </button>
      </div>

      {/* Contenitore per i pulsanti 5-8 con margine destro */}
      <div className="flex flex-wrap mr-4"> {/* Aggiunto mr-4 per distanziare */}
        {/* Pulsante 5 - Ritardo P */}
        <button 
          className="relative flex items-center justify-center rounded-lg w-[36px] h-[36px] m-0.5 hover:opacity-80 transition duration-300 bg-no-repeat bg-center bg-gray-200"
          style={{ backgroundImage: 'url("/images/P.png")', backgroundSize: 'auto' }}
          onClick={() => {
            if (!isStudentNameValid()) return;
            handleButtonClick('P');
          }}
          aria-label="Inserisci ritardo P"
          title="Inserisci ritardo P"
        >
          <span className="sr-only">Inserisci ritardo P</span>
        </button>

        {/* Pulsante 6 - Ritardo T */}
        <button 
          className="relative flex items-center justify-center rounded-lg w-[36px] h-[36px] m-0.5 hover:opacity-80 transition duration-300 bg-no-repeat bg-center bg-gray-200"
          style={{ backgroundImage: 'url("/images/T.png")', backgroundSize: 'auto' }}
          onClick={() => {
            if (!isStudentNameValid()) return;
            handleButtonClick('T');
          }}
          aria-label="Inserisci ritardo T"
          title="Inserisci ritardo T"
        >
          <span className="sr-only">Inserisci ritardo T</span>
        </button>

        {/* Pulsante 7 - Ritardo M */}
        <button 
          className="relative flex items-center justify-center rounded-lg w-[36px] h-[36px] m-0.5 hover:opacity-80 transition duration-300 bg-no-repeat bg-center bg-gray-200"
          style={{ backgroundImage: 'url("/images/M.png")', backgroundSize: 'auto' }}
          onClick={() => {
            if (!isStudentNameValid()) return;
            handleButtonClick('M');
          }}
          aria-label="Inserisci ritardo M"
          title="Inserisci ritardo M"
        >
          <span className="sr-only">Inserisci ritardo M</span>
        </button>

        {/* Pulsante 8 - Ritardo S */}
        <button 
          className="relative flex items-center justify-center rounded-lg w-[36px] h-[36px] m-0.5 hover:opacity-80 transition duration-300 bg-no-repeat bg-center bg-gray-200"
          style={{ backgroundImage: 'url("/images/S.png")', backgroundSize: 'auto' }}
          onClick={() => {
            if (!isStudentNameValid()) return;
            handleButtonClick('S');
          }}
          aria-label="Inserisci ritardo S"
          title="Inserisci ritardo S"
        >
          <span className="sr-only">Inserisci ritardo S</span>
        </button>
      </div>

      {/* Contenitore per i pulsanti 9-10 */}
      <div className="flex flex-wrap">
        {/* Pulsante 9 - Solo Stampa PDF */}
        <button 
          className="relative flex items-center justify-center rounded-lg w-[38px] h-[38px] m-0.5 hover:opacity-80 transition duration-300 bg-no-repeat bg-center bg-gray-200"
          style={{ backgroundImage: 'url("/images/PDFprint.png")', backgroundSize: 'auto' }}
          onClick={() => {
            if (!isStudentNameValid()) return;
            handlePrintWithoutAdding('P');
          }}
          aria-label="Stampa PDF studente"
          title="Stampa PDF studente"
        >
          <span className="sr-only">Stampa PDF studente</span>
        </button>

        {/* Pulsante 10 - Report 1 */}
        <button
          className="relative flex items-center justify-center rounded-lg w-[38px] h-[38px] m-0.5 hover:opacity-80 transition duration-300 bg-no-repeat bg-center bg-gray-200"
          style={{ backgroundImage: 'url("/images/report.png")', backgroundSize: 'auto' }}
          onClick={handleGenerateExcelForDate}
          aria-label="Report giornaliero ritardi"
          title="Report giornaliero"
        >
          <span className="sr-only">Report giornaliero</span>
        </button>
      </div>
    </div>
  );
};

export default ButtonsLayout;