// User authentication state
        let currentUser = null;
        let currentChatId = null;
        let isProcessing = false;
        let isGuest = false;

        // Initialize with Midnight Galaxy theme as default
        document.body.setAttribute('data-theme', 'midnight');

        // Simulated database
        const users = [
            { id: 1, name: "John Doe", email: "john@example.com", password: "password123", settings: {} }
        ];

        const chats = {
            1: [
                { id: "chat1", title: "Welcome Chat", preview: "Hello! How can I assist you today?", timestamp: new Date() },
                { id: "chat2", title: "Project Discussion", preview: "Let's discuss the project timeline...", timestamp: new Date(Date.now() - 86400000) }
            ]
        };

        const messages = {
            chat1: [
                { sender: "bot", content: "Hello! I'm your AI assistant. How can I help you today?", timestamp: new Date() }
            ],
            chat2: [
                { sender: "user", content: "Can we discuss the project timeline?", timestamp: new Date(Date.now() - 86400000) },
                { sender: "bot", content: "Of course! The project is currently on schedule with completion expected by next month.", timestamp: new Date(Date.now() - 86400000) }
            ]
        };

        document.addEventListener('DOMContentLoaded', function() {
            // DOM elements
            const chatInterface = document.getElementById('chatInterface');
            const userAuthButton = document.getElementById('userAuthButton');
            const authButtonText = document.getElementById('authButtonText');
            const messageInput = document.getElementById('messageInput');
            const sendButton = document.getElementById('sendButton');
            const chatMessages = document.getElementById('chatMessages');
            const newChatBtn = document.getElementById('newChatBtn');
            const settingsModal = document.getElementById('settingsModal');
            const websiteSettingsModal = document.getElementById('websiteSettingsModal');
            const quickSettingsBtn = document.getElementById('quickSettingsBtn');
            const websiteSettingsBtn = document.getElementById('websiteSettingsBtn');
            const closeSettings = document.getElementById('closeSettings');
            const closeWebsiteSettings = document.getElementById('closeWebsiteSettings');
            const cancelSettings = document.getElementById('cancelSettings');
            const cancelWebsiteSettings = document.getElementById('cancelWebsiteSettings');
            const saveSettings = document.getElementById('saveSettings');
            const saveWebsiteSettings = document.getElementById('saveWebsiteSettings');
            const fileInput = document.getElementById('fileInput');
            const attachButton = document.getElementById('attachButton');
            const chatList = document.getElementById('chatList');
            const searchChats = document.getElementById('searchChats');
            const sidebarIconLinks = document.querySelectorAll('.sidebar-icon-link');

            // Theme elements
            const themeMidnight = document.getElementById('themeMidnight');
            const themeDarkPurple = document.getElementById('themeDarkPurple');
            const themeLight = document.getElementById('themeLight');

            // Font size elements
            const fontSizeSlider = document.getElementById('fontSizeSlider');
            const fontSizeValue = document.getElementById('fontSizeValue');
            const lineHeightSlider = document.getElementById('lineHeightSlider');
            const lineHeightValue = document.getElementById('lineHeightValue');

            // Font options
            const fontOptions = document.querySelectorAll('.font-option');

            // Set Midnight Galaxy as active theme in settings
            themeMidnight.classList.add('active');

            // Font size slider
            fontSizeSlider.addEventListener('input', function() {
                const size = this.value;
                fontSizeValue.textContent = `${size}px`;
                document.documentElement.style.setProperty('--font-size', `${size}px`);
                saveAppearanceSettings();
            });

            // Line height slider
            lineHeightSlider.addEventListener('input', function() {
                const height = this.value;
                lineHeightValue.textContent = height;
                document.documentElement.style.setProperty('line-height', height);
                saveAppearanceSettings();
            });

            // Theme selection
            themeMidnight.addEventListener('click', function() {
                setActiveThemeOption(this);
                document.body.setAttribute('data-theme', 'midnight');
                saveAppearanceSettings();
            });

            themeDarkPurple.addEventListener('click', function() {
                setActiveThemeOption(this);
                document.body.setAttribute('data-theme', 'dark-purple');
                saveAppearanceSettings();
            });

            themeLight.addEventListener('click', function() {
                setActiveThemeOption(this);
                document.body.setAttribute('data-theme', 'light');
                saveAppearanceSettings();
            });

            function setActiveThemeOption(element) {
                document.querySelectorAll('.setting-option').forEach(option => {
                    option.classList.remove('active');
                });
                element.classList.add('active');
            }

            // Font selection
            fontOptions.forEach(option => {
                option.addEventListener('click', function() {
                    fontOptions.forEach(opt => opt.classList.remove('active'));
                    this.classList.add('active');
                    document.body.style.fontFamily = this.dataset.font;
                    saveAppearanceSettings();
                });
            });

            // Save appearance settings to localStorage
            function saveAppearanceSettings() {
                const theme = document.querySelector('.setting-option.active').id.replace('theme', '').toLowerCase();
                const fontSize = fontSizeSlider.value;
                const lineHeight = lineHeightSlider.value;
                const fontFamily = document.querySelector('.font-option.active').dataset.font;

                localStorage.setItem('theme', theme);
                localStorage.setItem('fontSize', fontSize);
                localStorage.setItem('lineHeight', lineHeight);
                localStorage.setItem('fontFamily', fontFamily);
            }

            // Save website settings
            saveWebsiteSettings.addEventListener('click', function() {
                saveAppearanceSettings();
                closeWebsiteSettingsModal();
                showNotification('Appearance settings saved!');
            });

            // Modal functions
            function openSettings() {
                settingsModal.classList.add('active');
            }

            function openWebsiteSettings() {
                websiteSettingsModal.classList.add('active');
            }

            function closeSettingsModal() {
                settingsModal.classList.remove('active');
            }

            function closeWebsiteSettingsModal() {
                websiteSettingsModal.classList.remove('active');
            }

            // Event listeners
            quickSettingsBtn.addEventListener('click', openSettings);
            websiteSettingsBtn.addEventListener('click', openWebsiteSettings);
            closeSettings.addEventListener('click', closeSettingsModal);
            closeWebsiteSettings.addEventListener('click', closeWebsiteSettingsModal);
            cancelSettings.addEventListener('click', closeSettingsModal);
            cancelWebsiteSettings.addEventListener('click', closeWebsiteSettingsModal);

            saveSettings.addEventListener('click', function() {
                // Save settings to user profile
                if (currentUser) {
                    currentUser.settings = {
                        temperature: parseFloat(tempSlider.value),
                        maxTokens: parseInt(tokenSlider.value),
                        topP: parseFloat(topPSlider.value),
                        model: document.getElementById('modelSelect').value,
                        apiKey: document.getElementById('apiKeyInput').value
                    };
                    localStorage.setItem('userSettings', JSON.stringify(currentUser.settings));
                }

                closeSettingsModal();
                showNotification('Model settings saved!');
            });

            // User auth button
            userAuthButton.addEventListener('click', function() {
                if (isGuest) {
                    window.location.href = '/login';
                } else {
                    window.location.href = '/login';
                }
            });

            // Load user chats
            function loadUserChats() {
                if (!currentUser) return;

                chatList.innerHTML = '';

                const userChats = chats[currentUser.id] || [];

                if (userChats.length === 0) {
                    chatList.innerHTML = `
                        <div class="no-chats-message">
                            <i class="fas fa-comment-alt"></i>
                            <p>No chats available. Start a new conversation!</p>
                        </div>
                    `;
                    return;
                }

                userChats.sort((a, b) => b.timestamp - a.timestamp);

                userChats.forEach(chat => {
                    const chatElement = document.createElement('div');
                    chatElement.className = 'chat-item';
                    chatElement.dataset.chatId = chat.id;
                    chatElement.innerHTML = `
                        <i class="fas fa-comment"></i>
                        <div class="chat-item-content">
                            <div class="chat-item-title">${chat.title}</div>
                            <div class="chat-item-preview">${chat.preview}</div>
                        </div>
                    `;

                    chatElement.addEventListener('click', function() {
                        // Remove active class from all chat items
                        document.querySelectorAll('.chat-item').forEach(item => {
                            item.classList.remove('active');
                        });

                        // Add active class to clicked chat
                        this.classList.add('active');

                        // Load chat messages
                        loadChatMessages(chat.id);
                    });

                    chatList.appendChild(chatElement);
                });

                // Activate the first chat
                if (userChats.length > 0) {
                    const firstChat = chatList.querySelector('.chat-item');
                    firstChat.classList.add('active');
                    loadChatMessages(userChats[0].id);
                }
            }

            // Create a new chat
            function createNewChat() {
                if (!currentUser) return;

                const chatId = 'chat' + Date.now();
                currentChatId = chatId;

                const newChat = {
                    id: chatId,
                    title: 'New Chat',
                    preview: 'Start a new conversation...',
                    timestamp: new Date()
                };

                // Add to user's chats
                if (!chats[currentUser.id]) {
                    chats[currentUser.id] = [];
                }
                chats[currentUser.id].push(newChat);

                // Initialize empty messages for this chat
                messages[chatId] = [];

                // Reload chat list
                loadUserChats();

                // Clear chat messages area
                chatMessages.innerHTML = `
                    <div class="welcome-message">
                        <div class="ui-icon">
                            <i class="fas fa-robot"></i>
                            <div class="glow"></div>
                        </div>
                        <div class="chatbot-ui-text">Chatbot UI</div>
                        <div class="tech-tagline">
                            Advanced conversational AI interface with real-time processing and adaptive learning capabilities
                        </div>
                    </div>
                `;

                showNotification('New chat started');
            }

            // Load chat messages
            function loadChatMessages(chatId) {
                if (!chatId) return;

                currentChatId = chatId;
                const chatMessagesArray = messages[chatId] || [];

                chatMessages.innerHTML = '';

                if (chatMessagesArray.length === 0) {
                    chatMessages.innerHTML = `
                        <div class="welcome-message">
                            <div class="ui-icon">
                                <i class="fas fa-robot"></i>
                                <div class="glow"></div>
                            </div>
                            <div class="chatbot-ui-text">Chatbot UI</div>
                            <div class="tech-tagline">
                                Advanced conversational AI interface with real-time processing and adaptive learning capabilities
                            </div>
                        </div>
                    `;
                    return;
                }

                chatMessagesArray.forEach(msg => {
                    addMessageToUI(msg.content, msg.sender, msg.timestamp);
                });

                chatMessages.scrollTop = chatMessages.scrollHeight;
            }

            // New chat button
            newChatBtn.addEventListener('click', function() {
                createNewChat();
            });

            // Search chats
            searchChats.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const chatItems = document.querySelectorAll('.chat-item');

                chatItems.forEach(item => {
                    const title = item.querySelector('.chat-item-title').textContent.toLowerCase();
                    const preview = item.querySelector('.chat-item-preview').textContent.toLowerCase();

                    if (title.includes(searchTerm) || preview.includes(searchTerm)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });

            // Sidebar icon functionality
            sidebarIconLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();

                    // Remove active class from all icons
                    sidebarIconLinks.forEach(item => {
                        item.classList.remove('active');
                    });

                    // Add active class to clicked icon
                    this.classList.add('active');

                    const section = this.dataset.section;

                    // For now, we'll just show notifications
                    switch(section) {
                        case 'files':
                            showNotification('File management section will be implemented soon');
                            break;
                        case 'settings':
                            // Handled separately by websiteSettingsBtn
                            break;
                        case 'analytics':
                            showNotification('Analytics dashboard coming soon');
                            break;
                        case 'knowledge':
                            showNotification('Knowledge base management coming soon');
                            break;
                        default:
                            // Chat is already visible
                    }
                });
            });

            // Send message
            sendButton.addEventListener('click', sendMessage);

            // Send message on Enter key
            messageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && this.value.trim() !== '' && !isProcessing) {
                    sendMessage();
                }
            });

            function sendMessage() {
                const message = messageInput.value.trim();
                if (message === '' || isProcessing) return;

                // Disable input while processing
                isProcessing = true;
                messageInput.disabled = true;
                sendButton.disabled = true;

                // Animation effect
                sendButton.style.transform = 'scale(0.9) rotate(-15deg)';
                setTimeout(() => {
                    sendButton.style.transform = 'scale(1) rotate(0)';
                }, 300);

                // Add user message to UI
                addMessageToUI(message, 'user', new Date());

                // Add to messages storage
                if (currentChatId && messages[currentChatId]) {
                    messages[currentChatId].push({
                        sender: 'user',
                        content: message,
                        timestamp: new Date()
                    });
                }

                // Update chat preview
                if (currentChatId && chats[currentUser.id]) {
                    const chat = chats[currentUser.id].find(c => c.id === currentChatId);
                    if (chat) {
                        chat.preview = message.length > 30 ? message.substring(0, 30) + '...' : message;
                        chat.timestamp = new Date();
                    }
                }

                // Reload chat list to update order
                loadUserChats();

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

                        // Add bot message to UI
                        addMessageToUI(randomResponse, 'bot', new Date());

                        // Add to messages storage
                        if (currentChatId && messages[currentChatId]) {
                            messages[currentChatId].push({
                                sender: 'bot',
                                content: randomResponse,
                                timestamp: new Date()
                            });
                        }

                        // Re-enable input
                        isProcessing = false;
                        messageInput.disabled = false;
                        sendButton.disabled = false;
                        messageInput.focus();
                    }, 2000);
                }, 500);
            }

            function addMessageToUI(text, sender, timestamp) {
                // Remove welcome message if it's the first user message
                const welcomeMessage = document.querySelector('.welcome-message');
                if (welcomeMessage) {
                    welcomeMessage.remove();
                }

                const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

            function showNotification(message, type = 'success') {
                // Create notification element
                const notification = document.createElement('div');
                notification.className = 'notification';
                notification.textContent = message;

                // Set color based on type
                let bgColor = 'var(--primary-accent)';
                if (type === 'error') bgColor = 'var(--error)';
                if (type === 'warning') bgColor = 'var(--warning)';

                notification.style.cssText = `
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    padding: 15px 25px;
                    background: ${bgColor};
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

            // Check if user is logged in
            fetch('/api/chats')
                .then(response => {
                    if (response.ok) {
                        // User is logged in
                        authButtonText.textContent = '{{ current_user.name }}';
                        loadUserChats();
                    } else {
                        // Use as guest
                        isGuest = true;
                        currentUser = { id: 'guest', name: 'Guest User' };
                        authButtonText.textContent = 'Login / Register';
                        loadUserChats();
                        showNotification('Using as guest. Your chats will be saved locally');
                    }
                })
                .catch(error => {
                    console.error('Error checking auth status:', error);
                    // Use as guest
                    isGuest = true;
                    currentUser = { id: 'guest', name: 'Guest User' };
                    authButtonText.textContent = 'Login / Register';
                    loadUserChats();
                    showNotification('Using as guest. Your chats will be saved locally');
                });
        });