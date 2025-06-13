// User authentication state
let currentUser = null;
let currentChatId = null;
let isProcessing = false;

// Initialize with Midnight Galaxy theme as default
document.body.setAttribute('data-theme', 'midnight');

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
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
    const chatList = document.getElementById('chatList');
    const searchChats = document.getElementById('searchChats');
    const sidebarIconLinks = document.querySelectorAll('.sidebar-icon-link');

    // Theme elements
    const themeMidnight = document.getElementById('themeMidnight');
    const themeDark = document.getElementById('themeDark');
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

    themeDark.addEventListener('click', function() {
        setActiveThemeOption(this);
        document.body.setAttribute('data-theme', 'dark');
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
            document.documentElement.style.setProperty('--font-family', this.dataset.font + ', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif');
            saveAppearanceSettings();
        });
    });

    // Save appearance settings to database
    function saveAppearanceSettings() {
        if (!currentUser) return;

        const theme = document.querySelector('.setting-option.active').id.replace('theme', '').toLowerCase();
        const fontSize = fontSizeSlider.value;
        const lineHeight = lineHeightSlider.value;
        const fontFamily = document.querySelector('.font-option.active').dataset.font;

        // Update local settings
        const settings = {
            theme,
            fontSize,
            lineHeight,
            fontFamily
        };

        // Save to database
        fetch('/api/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        })
        .then(response => response.json())
        .then(settings => {
            console.log('Appearance settings saved');
        })
        .catch(error => {
            console.error('Error saving appearance settings:', error);
        });
    }

    // Save website settings button
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
            const settings = {
                temperature: parseFloat(document.getElementById('tempSlider').value),
                maxTokens: parseInt(document.getElementById('tokenSlider').value),
                topP: parseFloat(document.getElementById('topPSlider').value),
                model: document.getElementById('modelSelect').value,
                apiKey: document.getElementById('apiKeyInput').value
            };

            fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            })
            .then(response => response.json())
            .then(settings => {
                currentUser.settings = settings;
                closeSettingsModal();
                showNotification('Model settings saved!');
            })
            .catch(error => {
                console.error('Error saving settings:', error);
                showNotification('Failed to save settings', 'error');
            });
        }
    });

    // User auth button with logout functionality
    userAuthButton.addEventListener('click', function(e) {
        if (currentUser) {
            // Create dropdown menu
            const dropdown = document.createElement('div');
            dropdown.className = 'auth-dropdown';
            dropdown.innerHTML = `
                <div class="auth-dropdown-item">${currentUser.name}</div>
                <div class="auth-dropdown-item" id="logoutButton">Logout</div>
            `;

            // Position dropdown
            const rect = userAuthButton.getBoundingClientRect();
            dropdown.style.position = 'absolute';
            dropdown.style.top = `${rect.bottom + 5}px`;
            dropdown.style.right = `${window.innerWidth - rect.right}px`;
            dropdown.style.zIndex = '1000';

            document.body.appendChild(dropdown);

            // Handle logout
            document.getElementById('logoutButton').addEventListener('click', function() {
                fetch('/logout')
                    .then(() => {
                        window.location.href = '/login';
                    });
            });

            // Remove dropdown when clicking elsewhere
            setTimeout(() => {
                document.addEventListener('click', function closeDropdown() {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }, { once: true });
            });
        } else {
            window.location.href = '/login';
        }
    });

    // Load user chats
    function loadUserChats() {
        if (!currentUser) return;

        chatList.innerHTML = '';

        // Fetch chats from server
        fetch('/api/chats')
            .then(response => response.json())
            .then(data => {
                const userChats = data.chats || [];

                if (userChats.length === 0) {
                    chatList.innerHTML = `
                        <div class="no-chats-message">
                            <i class="fas fa-comment-alt"></i>
                            <p>No chats available. Start a new conversation!</p>
                        </div>
                    `;
                    return;
                }

                userChats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

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
            })
            .catch(error => {
                console.error('Error loading chats:', error);
            });
    }

    // Create a new chat
    function createNewChat() {
        if (!currentUser) return;

        fetch('/api/chats', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(newChat => {
            currentChatId = newChat.id;
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
        })
        .catch(error => {
            console.error('Error creating new chat:', error);
            showNotification('Failed to create new chat', 'error');
        });
    }

    // Load chat messages
    function loadChatMessages(chatId) {
        if (!chatId) return;

        currentChatId = chatId;

        fetch(`/api/chats/${chatId}/messages`)
            .then(response => response.json())
            .then(messages => {
                chatMessages.innerHTML = '';

                if (messages.length === 0) {
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

                messages.forEach(msg => {
                    addMessageToUI(msg.content, msg.sender, new Date(msg.timestamp));
                });

                chatMessages.scrollTop = chatMessages.scrollHeight;
            })
            .catch(error => {
                console.error('Error loading messages:', error);
            });
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

        // Send message to server
        fetch(`/api/chats/${currentChatId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: message,
                sender: 'user'
            })
        })
        .then(response => response.json())
        .then(newMessage => {
            // Update chat preview
            loadUserChats();

            messageInput.value = '';

            // Simulate bot typing
            setTimeout(() => {
                addTypingIndicator();

                // Prepare messages for AI
                fetch(`/api/chats/${currentChatId}/messages`)
                    .then(response => response.json())
                    .then(messages => {
                        const chatHistory = messages.map(msg => ({
                            role: msg.sender === 'user' ? 'user' : 'assistant',
                            content: msg.content
                        }));

                        // Get user settings
                        fetch('/api/settings')
                            .then(response => response.json())
                            .then(settings => {
                                // Call AI endpoint
                                fetch('/api/ai/generate', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Accept': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        messages: chatHistory,
                                        model: settings.model || 'gpt-4-turbo',
                                        temperature: settings.temperature || 0.7,
                                        maxTokens: settings.maxTokens || 2048,
                                        topP: settings.topP || 0.9
                                    })
                                })
                                .then(response => {
                                    if (!response.ok) {
                                        throw new Error('AI request failed');
                                    }
                                    return response.json();
                                })
                                .then(data => {
                                    removeTypingIndicator();

                                    if (data.error) {
                                        throw new Error(data.error);
                                    }

                                    // Add bot message to UI
                                    addMessageToUI(data.content, 'bot', new Date());

                                    // Save bot message to server
                                    return fetch(`/api/chats/${currentChatId}/messages`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            content: data.content,
                                            sender: 'bot'
                                        })
                                    });
                                })
                                .then(() => {
                                    // Re-enable input
                                    isProcessing = false;
                                    messageInput.disabled = false;
                                    sendButton.disabled = false;
                                    messageInput.focus();
                                })
                                .catch(error => {
                                    removeTypingIndicator();
                                    addMessageToUI(`Error: ${error.message}`, 'bot', new Date());
                                    showNotification('AI request failed', 'error');
                                    isProcessing = false;
                                    messageInput.disabled = false;
                                    sendButton.disabled = false;
                                    messageInput.focus();
                                });
                            })
                            .catch(error => {
                                removeTypingIndicator();
                                console.error('Error loading settings:', error);
                                isProcessing = false;
                                messageInput.disabled = false;
                                sendButton.disabled = false;
                                messageInput.focus();
                            });
                    })
                    .catch(error => {
                        removeTypingIndicator();
                        console.error('Error loading messages:', error);
                        isProcessing = false;
                        messageInput.disabled = false;
                        sendButton.disabled = false;
                        messageInput.focus();
                    });
            }, 500);
        })
        .catch(error => {
            console.error('Error sending message:', error);
            isProcessing = false;
            messageInput.disabled = false;
            sendButton.disabled = false;
            showNotification('Failed to send message', 'error');
        });
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

    // File processing functionality
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        showNotification('Processing file...');

        fetch('/api/process-file', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('File processing failed');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }

            // Add file content to message input
            const contentPreview = data.content.length > 1000 ?
                data.content.substring(0, 1000) + '...' : data.content;
            messageInput.value = `File content: ${contentPreview}`;
            showNotification('File processed successfully');
        })
        .catch(error => {
            showNotification(`File error: ${error.message}`, 'error');
        })
        .finally(() => {
            // Reset file input
            fileInput.value = '';
        });
    });

    // Check if user is logged in and load settings
    fetch('/api/chats')
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Not authenticated');
            }
        })
        .then(data => {
            // User is logged in
            currentUser = data.user;
            authButtonText.textContent = currentUser.name;

            // Load user settings
            return fetch('/api/settings');
        })
        .then(response => response.json())
        .then(settings => {
            // Apply theme
            if (settings.theme) {
                document.body.setAttribute('data-theme', settings.theme);
                // Update active theme in settings modal
                document.querySelectorAll('.setting-option').forEach(option => {
                    option.classList.remove('active');
                });
                document.getElementById(`theme${settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}`).classList.add('active');
            }

            // Apply font size
            if (settings.fontSize) {
                fontSizeSlider.value = settings.fontSize;
                fontSizeValue.textContent = `${settings.fontSize}px`;
                document.documentElement.style.setProperty('--font-size', `${settings.fontSize}px`);
            }

            // Apply line height
            if (settings.lineHeight) {
                lineHeightSlider.value = settings.lineHeight;
                lineHeightValue.textContent = settings.lineHeight;
                document.documentElement.style.setProperty('line-height', settings.lineHeight);
            }

            // Apply font family
            if (settings.fontFamily) {
                document.querySelectorAll('.font-option').forEach(option => {
                    option.classList.remove('active');
                    if (option.dataset.font === settings.fontFamily) {
                        option.classList.add('active');
                    }
                });
                document.documentElement.style.setProperty('--font-family', settings.fontFamily + ', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif');
            }

            // Apply model settings
            if (settings.model) {
                document.getElementById('modelSelect').value = settings.model;
            }
            if (settings.temperature) {
                document.getElementById('tempSlider').value = settings.temperature;
                document.getElementById('tempValue').textContent = settings.temperature;
            }
            if (settings.maxTokens) {
                document.getElementById('tokenSlider').value = settings.maxTokens;
                document.getElementById('tokenValue').textContent = settings.maxTokens;
            }
            if (settings.topP) {
                document.getElementById('topPSlider').value = settings.topP;
                document.getElementById('topPValue').textContent = settings.topP;
            }
            if (settings.apiKey) {
                document.getElementById('apiKeyInput').value = settings.apiKey;
            }

            // Load chats
            loadUserChats();
        })
        .catch(error => {
            // Not logged in, redirect to login
            window.location.href = '/login';
        });
});