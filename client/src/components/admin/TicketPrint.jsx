import React from 'react';
import { buildAssetUrl } from '../../utils/assets';

const TicketPrint = React.forwardRef(({
  venta,
  seleccionados,
  total,
  negocio,
  config,
  ticketTitle,
  ticketMetaLines = [],
  showPrices = true
}, ref) => {
  const fecha = new Date().toLocaleString();
  
  // Estilos dinámicos según el tamaño de papel y fuente configurado
  const paperWidth = config?.ticket_paper_size || '80mm';
  const fontSize = config?.ticket_font_size || 12;
  const decoration = config?.ticket_decoration || 'none'; // 'hearts', 'desserts', 'stars', 'none'

  const ticketStyle = {
    width: paperWidth,
    fontSize: `${fontSize}px`,
    lineHeight: '1.2',
    fontFamily: 'monospace',
    color: 'black',
    backgroundColor: 'white',
    padding: '4px',
    margin: '0 auto',
  };

  // Iconos de decoración según estilo
  const decoIcons = {
    hearts: '❤  ❤  ❤  ❤  ❤',
    desserts: '🍰  🍧  🍓  🍦  🍰',
    stars: '⭐  ⭐  ⭐  ⭐  ⭐',
    none: '-------------------------'
  };

  const currentDeco = decoIcons[decoration] || decoIcons.none;
  const logoPath = negocio?.logo || negocio?.logo_url;

  return (
    <div ref={ref} style={ticketStyle} className="hidden print:block">
      {/* HEADER / LOGO */}
      <div className="text-center mb-4">
        {ticketTitle && (
          <p className="font-bold uppercase border-b border-dashed pb-1 mb-2" style={{ fontSize: `${fontSize + 1}px` }}>
            {ticketTitle}
          </p>
        )}

        {config?.ticket_show_logo && logoPath ? (
          <img 
            src={buildAssetUrl(logoPath)}
            alt="Logo" 
            className="mx-auto mb-2" 
            style={{ width: paperWidth === '58mm' ? '40mm' : '50mm', height: 'auto', objectFit: 'contain' }}
          />
        ) : (
          <h1 className="font-bold uppercase" style={{ fontSize: `${fontSize + 4}px` }}>
            {negocio?.nombre || 'MI NEGOCIO'}
          </h1>
        )}

        {config?.ticket_show_address && negocio?.ubicacion && (
          <p className="mt-1">{negocio.ubicacion}</p>
        )}
        
        {config?.ticket_show_rfc && negocio?.rfc && (
          <p className="font-bold">RFC: {negocio.rfc}</p>
        )}

        {config?.ticket_show_phone && negocio?.telefono && (
          <p>Tel: {negocio.telefono}</p>
        )}
        
        {decoration !== 'none' && (
          <div className="text-[10px] my-2 text-gray-500 font-bold tracking-widest">{currentDeco}</div>
        )}
        <p className="mt-1 border-t border-dashed pt-1">{fecha}</p>
      </div>

      {/* CUERPO DEL TICKET */}
      <div className="border-b-2 border-double pb-1 mb-2">
        <div className="flex justify-between font-bold">
          <span>DESCRIPCIÓN</span>
          {showPrices && <span>TOTAL</span>}
        </div>
      </div>

      <div className="mb-4">
        {seleccionados.map((item, idx) => (
          <div key={idx} className="mb-2">
            <div className={showPrices ? 'flex justify-between items-start' : ''}>
              <span style={{ flex: 1 }}>
                {item.cantidad}x {item.producto}
              </span>
              {showPrices && (
                <span className="font-bold whitespace-nowrap ml-2">
                  ${item.total}
                </span>
              )}
            </div>
            
            {item.toppings?.length > 0 && (
              <div className="pl-3" style={{ fontSize: `${fontSize - 2}px` }}>
                <span className="italic">Extras:</span> {item.toppings.map(t => t.nombre).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* TOTALES */}
      <div className="border-t border-double pt-2 space-y-1">
        {showPrices && (
          <div className="flex justify-between font-bold" style={{ fontSize: `${fontSize + 2}px` }}>
            <span>TOTAL:</span>
            <span>${total}</span>
          </div>
        )}

        {venta?.metodo_pago && showPrices && (
          <div className="flex justify-between italic" style={{ fontSize: `${fontSize - 1}px` }}>
            <span>MÉTODO:</span>
            <span>{venta.metodo_pago}</span>
          </div>
        )}

        {ticketMetaLines.map((line, idx) => (
          <p key={`${line}-${idx}`} style={{ fontSize: `${fontSize - 1}px` }}>{line}</p>
        ))}
      </div>

      {/* FOOTER / ESLOGAN / DECORACIÓN FINAL */}
      <div className="text-center mt-6 pt-4 border-t-2 border-double">
        {decoration !== 'none' && (
          <div className="text-[10px] mb-4 text-gray-500 font-bold tracking-widest">{currentDeco}</div>
        )}
        
        {config?.ticket_show_slogan && negocio?.eslogan ? (
          <p className="font-bold italic uppercase" style={{ fontSize: `${fontSize + 2}px` }}>
            "{negocio.eslogan}"
          </p>
        ) : (
          <p className="font-bold italic">¡Gracias por su preferencia!</p>
        )}
        
        <p className="mt-4" style={{ fontSize: '8px', opacity: 0.5 }}>
          Desarrollado por PECADITO POS
        </p>
      </div>
      
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body {
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
});

export default TicketPrint;
