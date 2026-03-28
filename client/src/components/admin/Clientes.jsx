import { useState, useEffect } from "react";
import { useClientes } from "../../context/ClientesContext";
import { useNegocios } from "../../context/NegociosContext";
import { FaTrash, FaEdit} from "react-icons/fa";
import Swal from "sweetalert2";

const obtenerFechaNacimientoDeCurp = (curp) => {
  const fechaStr = curp.substring(4, 10); // YYMMDD
  const year = parseInt(fechaStr.substring(0, 2), 10);
  const month = parseInt(fechaStr.substring(2, 4), 10) - 1;
  const day = parseInt(fechaStr.substring(4, 6), 10);
  const fullYear = year >= 0 && year <= 30 ? 2000 + year : 1900 + year;
  return new Date(fullYear, month, day).toLocaleDateString();
};

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [edit, setEdit] = useState(null); 
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    celular: "",
    email: "",
    curp: "",
    negocio_id: ""
  });

  const { crearCliente, clientes: clientesObtenidos, getValorid, eliminarCliente, actualizarCliente } = useClientes();

  const { negocios, getNegocios } = useNegocios();

  const clientesFiltrados = clientesObtenidos.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleRegistrar = () => {
    // Validaciones básicas antes de enviar
    if (!nuevoCliente.nombre || !nuevoCliente.negocio_id) {
      Swal.fire('Campos incompletos', 'Completa los campos nombre y negocio antes de registrar', 'warning');
      return;
    }
    const payload = { ...nuevoCliente, negocio_id: parseInt(nuevoCliente.negocio_id, 10) };
    crearCliente(payload);
    // Optimistic UI opcional
    setClientes([...clientes, { id: Date.now(), ...payload }]);
    setModalOpen(false);
    setNuevoCliente({ nombre: "", celular: "", email: "", curp: "", negocio_id: "" });
  };

  const handleActualizar = () => {
    
    const payload = { ...nuevoCliente, id: edit.id };
    actualizarCliente(payload);
    setModalOpen(false);
    setEdit(null)
    setNuevoCliente({ nombre: "", celular: "", email: "", curp: "", negocio_id: "" });
  };

const abrirEditar = (cliente) => {
  const coincide = Array.isArray(clientesObtenidos)
    ? clientesObtenidos.find(c => (c.id) === (cliente))
    : null;

  setEdit(coincide);

  if (coincide) {
    setNuevoCliente({
      nombre: coincide.nombre ?? "",
      celular: coincide.celular ?? "",
      email: coincide.email ?? "",
      curp: coincide.curp ?? "",
    });
  } else {
    setNuevoCliente({ nombre:"", celular:"", email:"", curp:"", negocio_id:"" });
  }

  setModalOpen(true);
};

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        eliminarCliente(id);
        Swal.fire(
          'Eliminado!',
          'El registro ha sido eliminado correctamente.',
          'success'
        )
      }
    })
  }

    useEffect(() => {
        getNegocios();
        getValorid();
    }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-green-900 mb-6">Clientes</h1>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <input
          type="text"
          placeholder="Buscar cliente..."
          className="border border-green-500 rounded-lg px-4 py-2 w-full md:w-1/3"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-lg w-full md:w-auto cursor-pointer"
          onClick={() => setModalOpen(true)}
        >
          + Agregar Cliente
        </button>
      </div>

      {/* Tabla */}
      <div className="table-scroll">
        <table className="min-w-full border border-green-200 text-left">
          <thead className="bg-green-100 text-green-900">
            <tr>
              <th className="px-4 py-3 border-b">No. Cliente</th>
              <th className="px-4 py-3 border-b">Nombre</th>
              <th className="px-4 py-3 border-b">Celular</th>
              <th className="px-4 py-3 border-b">Email</th>
              <th className="px-4 py-3 border-b">CURP</th>
              <th className="px-4 py-3 border-b">Fecha de Nacimiento</th>
              <th className="px-4 py-3 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map((cliente, index) => (
              <tr key={cliente.id} className="border-t">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3">{cliente.nombre}</td>
                <td className="px-4 py-3">{cliente.celular}</td>
                <td className="px-4 py-3">{cliente.email}</td>
                <td className="px-4 py-3">{cliente.curp}</td>
                <td className="px-4 py-3">
                  {cliente.curp ? obtenerFechaNacimientoDeCurp(cliente.curp) : ''}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => abrirEditar(cliente.id)} className="bg-yellow-500 text-white py-2 px-3 rounded-lg text-md cursor-pointer hover:bg-yellow-600 mr-2">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(cliente.id)} className="bg-red-500 text-white py-2 px-3 rounded-lg text-md cursor-pointer hover:bg-red-600">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
            <button
              onClick={() => {setModalOpen(false), setEdit(null)}}
              className="absolute top-2 right-3 text-gray-500 text-xl"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold text-green-900 mb-4">
              {edit ? 'Actualizar datos del cliente' : 'Registrar Cliente'}
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre completo"
                className="w-full border rounded-lg px-3 py-2"
                value={nuevoCliente.nombre}
                onChange={(e) =>
                  setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })
                }
              />
              <input
                type="tel"
                placeholder="Número de celular"
                className="w-full border rounded-lg px-3 py-2"
                value={nuevoCliente.celular}
                onChange={(e) =>
                  setNuevoCliente({ ...nuevoCliente, celular: e.target.value })
                }
              />
              <input
                type="email"
                placeholder="Correo electrónico"
                className="w-full border rounded-lg px-3 py-2"
                value={nuevoCliente.email}
                onChange={(e) =>
                  setNuevoCliente({ ...nuevoCliente, email: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="CURP"
                className="w-full border rounded-lg px-3 py-2 uppercase"
                maxLength={18}
                value={nuevoCliente.curp}
                onChange={(e) =>
                  setNuevoCliente({ ...nuevoCliente, curp: e.target.value })
                }
              />

              {edit ? (
                <div style={{display: "none"}}>
                  <input
                    className="w-full border rounded-lg px-3 py-2 bg-gray-50"
                    value={
                      negocios.find(n => (n.id) === (nuevoCliente.negocio_id))?.nombre
                      ?? `ID ${nuevoCliente.negocio_id}`
                    }
                    readOnly
                    disabled
                  />
                </div>
              ) : (
                <div>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={nuevoCliente.negocio_id}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, negocio_id: e.target.value })}
                    required
                  >
                    <option value="">Selecciona un punto de venta</option>
                    {negocios.map((negocio) => (
                      <option key={negocio.id} value={negocio.id}>{negocio.nombre}</option>
                    ))}
                  </select>
                </div>
              )}


              <button
                onClick={edit ? handleActualizar : handleRegistrar}
                className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded-lg font-semibold"
              >
                {edit ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
