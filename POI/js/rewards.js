// Funcionalidad global
document.addEventListener('DOMContentLoaded', function () {
    // Inicializar navegación de pestañas
    initTabNavigation();

    // Variables y lógica para el chat
    const chatWidget = document.querySelector('.chat-widget');
    const chatToggle = document.querySelector('.chat-toggle');
    const chatIcon = chatToggle.querySelector('i');
    const chatInput = document.querySelector('.chat-input input');
    const sendButton = document.querySelector('.chat-input button');

    // Alternar estado del chat
    chatToggle.addEventListener('click', function () {
        chatWidget.classList.toggle('chat-expanded');
        chatWidget.classList.toggle('chat-collapsed');

        if (chatWidget.classList.contains('chat-expanded')) {
            chatIcon.classList.remove('fa-plus');
            chatIcon.classList.add('fa-minus');
        } else {
            chatIcon.classList.remove('fa-minus');
            chatIcon.classList.add('fa-plus');
        }
    });

    // Enviar mensaje al presionar Enter
    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Enviar mensaje al hacer clic en el botón
    sendButton.addEventListener('click', sendMessage);

    // Función para enviar el mensaje
    function sendMessage() {
        const messageText = chatInput.value.trim();
        if (messageText !== '') {
            const messagesContainer = document.querySelector('.chat-messages');
            const newMessage = document.createElement('div');
            newMessage.classList.add('message', 'self');

            const currentTime = new Date();
            const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            newMessage.innerHTML = `
                <div class="sender">Tú <span class="badge">🔮</span></div>
                <div class="text">${messageText}</div>
                <div class="timestamp">${timeString}</div>
            `;

            messagesContainer.appendChild(newMessage);
            chatInput.value = '';

            // Hacer scroll al último mensaje
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Simular respuesta después de un tiempo
            setTimeout(simulateResponse, 1000 + Math.random() * 2000);
        }
    }

    // Función para simular una respuesta
    function simulateResponse() {
        const responses = [
            { user: "FutbolFan23", message: "¡Buena predicción!", badge: "🥇" },
            { user: "TheExpert", message: "No estoy seguro, España tiene un equipo sólido este año", badge: "🎯" },
            { user: "FootballOracle", message: "Mi predicción: Francia vs Brasil en la final", badge: "🏅" },
            { user: "Messi10", message: "¡Vamos Argentina!", badge: "" }
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const messagesContainer = document.querySelector('.chat-messages');
        const newMessage = document.createElement('div');
        newMessage.classList.add('message', 'other');

        const currentTime = new Date();
        const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        newMessage.innerHTML = `
            <div class="sender">${randomResponse.user} ${randomResponse.badge ? `<span class="badge">${randomResponse.badge}</span>` : ''}</div>
            <div class="text">${randomResponse.message}</div>
            <div class="timestamp">${timeString}</div>
        `;

        messagesContainer.appendChild(newMessage);
        // Hacer scroll al último mensaje
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Función para la navegación entre pestañas
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
});