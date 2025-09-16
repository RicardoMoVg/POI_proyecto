// Variables globales
const rootStyles = getComputedStyle(document.documentElement);
const fifaGreen = rootStyles.getPropertyValue('--fifa-green').trim();
const fifaRed = rootStyles.getPropertyValue('--fifa-red').trim();

document.addEventListener('DOMContentLoaded', () => {
    // Inicialización de todas las funciones
    initCounters();
    initUserStatus();
    initAdminPanel();
    initTabNavigation(); // Nueva función para la navegación entre pestañas
});

// ====================
// Funciones
// ====================

// Animar contadores
function initCounters() {
    const statValues = document.querySelectorAll('.stat-value');
    if (!statValues.length) return;

    statValues.forEach(stat => {
        const target = parseInt(stat.textContent.replace(/,/g, ''));
        let current = 0;
        const increment = target / 50;

        const updateCounter = () => {
            if (current < target) {
                current += increment;
                stat.textContent = Math.round(current).toLocaleString();
                setTimeout(updateCounter, 25);
            } else {
                stat.textContent = target.toLocaleString();
            }
        };
        updateCounter();
    });
}

// Alternar estado activo/inactivo
function initUserStatus() {
    const statusButtons = document.querySelectorAll('.table-btn .fa-ban, .table-btn .fa-check');
    if (!statusButtons.length) return;

    statusButtons.forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const statusCell = row.querySelector('.status-badge');

            if (this.classList.contains('fa-ban')) {
                statusCell.textContent = 'Inactivo';
                statusCell.className = 'status-badge status-inactive';
            } else {
                statusCell.textContent = 'Activo';
                statusCell.className = 'status-badge status-active';
            }
        });
    });
}

// Configuración de admin
function initAdminPanel() {
    const saveButton = document.querySelector('.btn-primary');
    const resetButton = document.querySelector('.btn-outline');
    const deleteButton = document.querySelector('.danger-button');
    const toggleSwitches = document.querySelectorAll('.toggle-switch input');
    const bioTextarea = document.getElementById('bio');
    const bioHint = bioTextarea ? document.querySelector('#bio + .form-hint') : null;

    // Guardar config
    if (saveButton) {
        saveButton.addEventListener('click', function () {
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            this.disabled = true;

            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-check"></i> ¡Guardado!';
                this.style.backgroundColor = fifaGreen;

                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.style.backgroundColor = '';
                    this.disabled = false;
                }, 2000);
            }, 1500);
        });
    }

    // Restablecer config
    if (resetButton) {
        resetButton.addEventListener('click', function () {
            if (confirm('¿Restablecer toda la configuración?')) {
                toggleSwitches.forEach(switchEl => (switchEl.checked = true));
                document.getElementById('username').value = 'JuanP2026';
                document.getElementById('bio').value = 'Apasionado del fútbol y experto en predicciones. ¡Vamos Argentina!';
                document.getElementById('timezone').value = 'GMT-3:00 (Buenos Aires, São Paulo)';
                document.getElementById('language').value = 'Español';
                document.getElementById('date-format').value = 'MM/DD/AAAA';
                alert('Configuración restablecida correctamente');
            }
        });
    }

    // Eliminar cuenta
    if (deleteButton) {
        deleteButton.addEventListener('click', function () {
            if (confirm('¿ESTÁS ABSOLUTAMENTE SEGURO? Esta acción no se puede deshacer.')) {
                const finalConfirmation = prompt('Para confirmar, escribe "ELIMINAR CUENTA":');
                if (finalConfirmation === 'ELIMINAR CUENTA') {
                    alert('Tu cuenta se eliminará en 48 horas. Se ha enviado un email de confirmación.');
                } else {
                    alert('Eliminación de cuenta cancelada.');
                }
            }
        });
    }

    // Contador de caracteres
    if (bioTextarea && bioHint) {
        bioTextarea.addEventListener('input', function () {
            const length = this.value.length;
            bioHint.textContent = `${length}/160 caracteres`;
            bioHint.style.color = length > 160 ? fifaRed : '#666';
        });
        bioTextarea.dispatchEvent(new Event('input'));
    }
}

// Navegación entre pestañas
function initTabNavigation() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Quitar "active" de todos
            tabLinks.forEach(tab => tab.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activar el tab clicado
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}