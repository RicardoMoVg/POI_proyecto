// Asegurar que el DOM esté completamente cargado antes de inicializar todas las funcionalidades.
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el calendario
    new Calendar();

    // Inicializar la navegación entre pestañas
    initTabNavigation();
});

// ====================
// Clase para el Calendario
// ====================
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.today = new Date();
        this.selectedDate = null;

        // Eventos de ejemplo para el simulador de fútbol
        this.events = {
            '2025-01-15': [{ type: 'match', title: 'Partido: Barcelona vs Real Madrid', description: 'El Clásico en vivo - ¡Participa y gana tokens!' }],
            '2025-01-20': [{ type: 'tournament', title: 'Torneo Copa FútbolStream', description: 'Torneo especial con premios exclusivos' }],
            '2025-01-25': [{ type: 'event', title: 'Evento Especial', description: 'Doble experiencia en todos los partidos' }],
            '2025-02-03': [{ type: 'match', title: 'Partido: Manchester United vs Liverpool', description: 'Derby inglés con recompensas especiales' }],
            '2025-02-14': [{ type: 'tournament', title: 'Torneo San Valentín', description: 'Torneo temático del amor al fútbol' }],
            '2025-02-28': [{ type: 'event', title: 'Fin de Temporada', description: 'Últimos partidos de la temporada regular' }],
        };

        this.monthNames = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];

        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });

        // Event listener para cerrar el modal al hacer clic fuera de él.
        const eventModal = document.getElementById('eventModal');
        if (eventModal) {
            eventModal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    this.closeModal();
                }
            });
        }
    }

    render() {
        this.renderHeader();
        this.renderCalendar();
    }

    renderHeader() {
        const monthName = this.monthNames[this.currentDate.getMonth()];
        const year = this.currentDate.getFullYear();

        document.getElementById('monthName').textContent = monthName;
        document.getElementById('yearName').textContent = year;
    }

    renderCalendar() {
        const grid = document.querySelector('.calendar-grid');

        // Limpiar días existentes (mantener headers)
        const dayElements = grid.querySelectorAll('.calendar-day');
        dayElements.forEach(el => el.remove());

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Primer día del mes y último día
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        // Días del mes anterior para llenar la primera semana
        const startDay = firstDay.getDay();
        const prevMonth = new Date(year, month - 1, 0);

        // Días del mes anterior
        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonth.getDate() - i;
            const dayElement = this.createDayElement(day, true);
            grid.appendChild(dayElement);
        }

        // Días del mes actual
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = this.createDayElement(day, false);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Marcar día de hoy
            if (this.isToday(year, month, day)) {
                dayElement.classList.add('today');
            }

            // Agregar eventos
            if (this.events[dateStr]) {
                dayElement.classList.add('has-event');
                const eventsContainer = dayElement.querySelector('.day-events');

                this.events[dateStr].forEach(event => {
                    const dot = document.createElement('div');
                    dot.className = `event-dot ${event.type}`;
                    eventsContainer.appendChild(dot);
                });

                dayElement.addEventListener('click', () => this.showEventModal(dateStr));
            }

            grid.appendChild(dayElement);
        }

        // Días del siguiente mes para completar la grilla
        const remainingDays = 42 - (startDay + daysInMonth);
        for (let day = 1; day <= remainingDays; day++) {
            const dayElement = this.createDayElement(day, true);
            grid.appendChild(dayElement);
        }
    }

    createDayElement(day, otherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        if (otherMonth) {
            dayElement.classList.add('other-month');
        }

        dayElement.innerHTML = `
            <span class="day-number">${day}</span>
            <div class="day-events"></div>
        `;
        return dayElement;
    }

    isToday(year, month, day) {
        return year === this.today.getFullYear() &&
            month === this.today.getMonth() &&
            day === this.today.getDate();
    }

    showEventModal(dateStr) {
        const events = this.events[dateStr];
        if (!events || events.length === 0) return;

        const modal = document.getElementById('eventModal');
        const header = document.getElementById('modalHeader');
        const body = document.getElementById('modalBody');

        const date = new Date(dateStr + 'T00:00:00'); // Corregido para evitar problemas de zona horaria
        const formattedDate = date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        header.textContent = formattedDate;

        let eventsHtml = '';
        events.forEach(event => {
            const icon = event.type === 'match' ? '⚽' :
                event.type === 'tournament' ? '🏆' : '🎯';
            eventsHtml += `
                <div style="margin-bottom: 15px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                    <div style="font-weight: bold; color: #00ff88; margin-bottom: 5px;">
                        ${icon} ${event.title}
                    </div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">
                        ${event.description}
                    </div>
                </div>
            `;
        });

        body.innerHTML = eventsHtml;
        modal.style.display = 'flex';
    }

    closeModal() {
        document.getElementById('eventModal').style.display = 'none';
    }
}

// ====================
// Funciones de la Interfaz
// ====================

// Función para la navegación entre pestañas
function initTabNavigation() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    if (!tabLinks.length || !tabContents.length) return;

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