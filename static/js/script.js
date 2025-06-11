        document.addEventListener('DOMContentLoaded', function() {
            // DOM elements
            const messageInput = document.getElementById('messageInput');
            const sendButton = document.getElementById('sendButton');
            const chatMessages = document.getElementById('chatMessages');
            const newChatBtn = document.getElementById('newChatBtn');
            const settingsModal = document.getElementById('settingsModal');
            const quickSettingsBtn = document.getElementById('quickSettingsBtn');
            const closeSettings = document.getElementById('closeSettings');
            const cancelSettings = document.getElementById('cancelSettings');
            const saveSettings = document.getElementById('saveSettings');
            const themeToggle = document.getElementById('themeToggle');
            const themeOptions = document.getElementById('themeOptions');
            const fileInput = document.getElementById('fileInput');
            const attachButton = document.getElementById('attachButton');

            // Slider elements
            const tempSlider = document.getElementById('tempSlider');
            const tokenSlider = document.getElementById('tokenSlider');
            const topPSlider = document.getElementById('topPSlider');
            const tempValue = document.getElementById('tempValue');
            const tokenValue = document.getElementById('tokenValue');
            const topPValue = document.getElementById('topPValue');

            // Theme toggle functionality
            const themeOptionButtons = document.querySelectorAll('.theme-option');
            const body = document.body;

            // Load saved theme from localStorage
            const savedTheme = localStorage.getItem('theme') || 'aurora';
            body.setAttribute('data-theme', savedTheme);

            // Set active button
            themeOptionButtons.forEach(btn => {
                btn.classList.remove('active');
                if(btn.dataset.theme === savedTheme) {
                    btn.classList.add('active');
                }
            });

            // Toggle theme options visibility
            themeToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                themeOptions.style.display = themeOptions.style.display === 'flex' ? 'none' : 'flex';
            });

            // Theme option click handler
            themeOptionButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const theme = this.dataset.theme;
                    body.setAttribute('data-theme', theme);
                    localStorage.setItem('theme', theme);

                    // Update active button
                    themeOptionButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');

                    // Hide options
                    themeOptions.style.display = 'none';
                });
            });

            // Close theme options when clicking outside
            document.addEventListener('click', function(e) {
                if (!themeToggle.contains(e.target) && !themeOptions.contains(e.target)) {
                    themeOptions.style.display = 'none';
                }
            });

            // Modal functions
            function openSettings() {
                settingsModal.classList.add('active');
            }

            function closeSettingsModal() {
                settingsModal.classList.remove('active');
            }

            // Event listeners
            quickSettingsBtn.addEventListener('click', openSettings);
            closeSettings.addEventListener('click', closeSettingsModal);
            cancelSettings.addEventListener('click', closeSettingsModal);

            saveSettings.addEventListener('click', function() {
                // In a real app, you would save these settings
                closeSettingsModal();
                showNotification('Settings saved successfully!');
            });

            // Slider value updates
            tempSlider.addEventListener('input', function() {
                tempValue.textContent = this.value;
            });

            tokenSlider.addEventListener('input', function() {
                tokenValue.textContent = this.value;
            });

            topPSlider.addEventListener('input', function() {
                topPValue.textContent = this.value;
            });

            // File attachment
            fileInput.addEventListener('change', function(e) {
                if (this.files.length > 0) {
                    const fileName = this.files[0].name;
                    showNotification(`File attached: ${fileName}`);
                }
            });

            // New chat button
            newChatBtn.addEventListener('click', function() {
                // Animation effect
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 200);

                // Clear chat
                chatMessages.innerHTML = '';

                // Show welcome message again
                const welcomeMessage = document.createElement('div');
                welcomeMessage.className = 'welcome-message';
                welcomeMessage.innerHTML = `
                    <div class="ui-icon">
                        <i class="fas fa-robot"></i>
                        <div class="glow"></div>
                    </div>
                    <div class="chatbot-ui-text">Chatbot UI</div>
                    <div class="tech-tagline">
                        Advanced conversational AI interface with real-time processing and adaptive learning capabilities
                    </div>
                `;
                chatMessages.appendChild(welcomeMessage);

                showNotification('New chat started');
            });

            // Send message
            sendButton.addEventListener('click', sendMessage);

            // Send message on Enter key
            messageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && this.value.trim() !== '') {
                    sendMessage();
                }
            });

            function sendMessage() {
                const message = messageInput.value.trim();
                if (message === '') return;

                // Animation effect
                sendButton.style.transform = 'scale(0.9) rotate(-15deg)';
                setTimeout(() => {
                    sendButton.style.transform = 'scale(1) rotate(0)';
                }, 300);

                // Add user message
                addMessage(message, 'user');
                messageInput.value = '';

                // Simulate bot typing
                setTimeout(() => {
                    addTypingIndicator();

                    // Simulate bot response after delay
                    setTimeout(() => {
                        removeTypingIndicator();
                        const responses = [
                            "I understand your question. Based on my analysis, the solution involves...",
                            "That's an interesting point. My research shows that...",
                            "Great question! The approach I recommend is...",
                            "I've processed your request and here's what I found...",
                            "After considering various perspectives, I suggest...",
                            "Based on the latest data, my recommendation would be..."
                        ];
                        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                        addMessage(randomResponse, 'bot');
                    }, 2000);
                }, 500);
            }

            function addMessage(text, sender) {
                // Remove welcome message if it's the first user message
                const welcomeMessage = document.querySelector('.welcome-message');
                if (welcomeMessage) {
                    welcomeMessage.remove();
                }

                const now = new Date();
                const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                const messageElement = document.createElement('div');
                messageElement.className = `message ${sender}-message`;
                messageElement.innerHTML = `
                    <div class="message-header">
                        <i class="fas ${sender === 'user' ? 'fa-user' : 'fa-robot'}"></i>
                        ${sender === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div class="message-content">${text}</div>
                    <div class="message-time">${timeString}</div>
                `;

                chatMessages.appendChild(messageElement);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }

            function addTypingIndicator() {
                const typingElement = document.createElement('div');
                typingElement.className = 'typing-indicator';
                typingElement.innerHTML = `
                    <span></span>
                    <span></span>
                    <span></span>
                `;
                chatMessages.appendChild(typingElement);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }

            function removeTypingIndicator() {
                const typingElement = document.querySelector('.typing-indicator');
                if (typingElement) {
                    typingElement.remove();
                }
            }

            function showNotification(message) {
                // Create notification element
                const notification = document.createElement('div');
                notification.className = 'notification';
                notification.textContent = message;
                notification.style.cssText = `
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    padding: 15px 25px;
                    background: var(--primary-accent);
                    color: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                    z-index: 1000;
                    transform: translateY(100px);
                    opacity: 0;
                    transition: all 0.4s ease;
                `;

                document.body.appendChild(notification);

                // Animate in
                setTimeout(() => {
                    notification.style.transform = 'translateY(0)';
                    notification.style.opacity = '1';
                }, 10);

                // Animate out after 3 seconds
                setTimeout(() => {
                    notification.style.transform = 'translateY(100px)';
                    notification.style.opacity = '0';

                    // Remove after animation
                    setTimeout(() => {
                        notification.remove();
                    }, 400);
                }, 3000);
            }

            // Initialize chat with a welcome message from the bot
            setTimeout(() => {
                addMessage("Hello! I'm your AI assistant. How can I help you today?", 'bot');
            }, 1000);
        });