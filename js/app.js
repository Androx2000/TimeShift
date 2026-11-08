/**
 * TimeShift — Aplicación Principal y Configuración Global
 * Asignatura: DAW901 — Universidad Don Bosco
 */

// Inicialización de componentes globales y verificación de soporte
document.addEventListener('DOMContentLoaded', () => {
  // Asegura que las imágenes con DiceBear tengan fallback automático ante fallas de red
  document.querySelectorAll('img[src*="dicebear.com"]').forEach(img => {
    img.addEventListener('error', function() {
      if (typeof TimeShiftAPI !== 'undefined') {
        TimeShiftAPI.handleAvatarError(this, this.alt || 'TimeShift');
      }
    });
  });
});
