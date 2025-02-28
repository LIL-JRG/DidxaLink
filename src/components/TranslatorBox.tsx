import React, { useState, useEffect, useCallback } from 'react';

const TranslatorBox = () => {
  const [spanishText, setSpanishText] = useState("")
  const [zapotecText, setZapotecText] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debouncedText, setDebouncedText] = useState("")

  // Debounce function for translation with 3 second delay
  useEffect(() => {
    if (spanishText === "") {
      setZapotecText("")
      setDebouncedText("")
      return
    }

    const timer = setTimeout(() => {
      setDebouncedText(spanishText)
    }, 500) // Reduced to 1 second

    return () => clearTimeout(timer)
  }, [spanishText])

  // Effect to trigger translation when debounced text changes
  useEffect(() => {
    if (debouncedText) {
      handleTranslate(debouncedText)
    }
  }, [debouncedText])

  // Speech recognition setup
  const startListening = () => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.lang = "es-MX"
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setSpanishText(transcript)
        // Translation will be triggered by the debounce effect
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } else {
      alert("La función de voz no está disponible en este navegador.")
    }
  }


  // Updated translation function using the API
  const handleTranslate = async (text: string) => {
    if (!text.trim()) {
      setZapotecText("")
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        throw new Error(errorData.error || `Error en la traducción: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("API Response:", data)
      setZapotecText(data.translated)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al traducir. Por favor, intente de nuevo.")
      console.error("Error de traducción:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(zapotecText);
      alert('Texto copiado al portapapeles');
    } catch (err) {
      alert('Error al copiar el texto');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Traducción DidxaLink',
        text: `Español: ${spanishText}\nZapoteco: ${zapotecText}`,
      }).catch(() => {
        setShowShareModal(true);
      });
    } else {
      setShowShareModal(true);
    }
  };

  const handleDownload = () => {
    const text = `Español: ${spanishText}\nZapoteco: ${zapotecText}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'traduccion-didxalink.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto bg-white shadow-lg border border-gray-200 rounded-xl">
        {/* Translation Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Spanish Input */}
          <div className="border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <select className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800">
                <option value="es">Español</option>
              </select>
            </div>
            <textarea
              className="w-full h-64 p-4 resize-none border-0 focus:ring-0 focus:outline-none bg-transparent text-gray-800 placeholder-gray-500"
              placeholder="Escribe texto en español..."
              value={spanishText}
              onChange={(e) => {
                setSpanishText(e.target.value);
                // Translation will be triggered by the debounce effect
              }}
            />
            <div className="p-4 border-t border-gray-200 flex items-center gap-4">
              <button 
                className={`p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors ${isListening ? 'bg-primary text-white' : ''}`}
                onClick={startListening}
                title="Usar micrófono"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
              <button 
                onClick={() => {
                  setSpanishText('');
                  setZapotecText('');
                }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Limpiar texto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Zapotec Output */}
          <div>
            <div className="p-4 border-b border-gray-200">
              <select className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800">
                <option value="zap">Zapoteco</option>
              </select>
            </div>
            <textarea
              className="w-full h-64 p-4 resize-none border-0 focus:ring-0 focus:outline-none bg-transparent text-gray-800 placeholder-gray-500"
              placeholder="Traducción al zapoteco..."
              value={zapotecText}
              readOnly
            />
            <div className="p-4 border-t border-gray-200 flex items-center gap-4">
              <button 
                onClick={handleCopy}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Copiar traducción"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                  <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                </svg>
              </button>
              <button 
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Descargar traducción"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                  <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                </svg>
              </button>
              <button 
                onClick={handleShare}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Compartir traducción"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Loading and Error Messages */}
        {isLoading && (
          <div className="p-4 text-center text-gray-600 flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Traduciendo...
          </div>
        )}
        {error && (
          <div className="p-4 text-center text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 border border-gray-200 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">Compartir traducción</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-700"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                >
                  Copiar
                </button>
              </div>
              <div className="flex justify-center space-x-4">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Español: ${spanishText}\nZapoteco: ${zapotecText}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-500 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href={`mailto:?subject=Traducción DidxaLink&body=${encodeURIComponent(`Español: ${spanishText}\nZapoteco: ${zapotecText}`)}`}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TranslatorBox;