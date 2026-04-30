import Swal from 'sweetalert2';

export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

export const showAlert = (message, type = 'info') => {
  return Swal.fire({
    title: type === 'error' ? 'Oops...' : (type === 'success' ? '¡Éxito!' : 'Información'),
    text: message,
    icon: type,
    confirmButtonColor: '#3b82f6',
  });
};

export const showConfirm = async (message) => {
  const result = await Swal.fire({
    title: '¿Confirmar acción?',
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#ef4444',
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar'
  });
  return result.isConfirmed;
};

export const showPrompt = async (message) => {
  const result = await Swal.fire({
    title: message,
    input: 'text',
    inputAttributes: {
      autocapitalize: 'off'
    },
    showCancelButton: true,
    confirmButtonText: 'Aceptar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
  });
  return result.isConfirmed ? result.value : null;
};
