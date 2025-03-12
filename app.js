document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const shortenBtn = document.getElementById('shortenBtn');
    const resultContainer = document.getElementById('resultContainer');
    const shortenedUrl = document.getElementById('shortenedUrl');
    const copyBtn = document.getElementById('copyBtn');
    const errorDiv = document.getElementById('error');
    const toast = document.getElementById('toast');
    const themeToggle = document.getElementById('themeToggle');
    const linksList = document.getElementById('linksList');

    // Theme handling
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.checked = theme === 'dark';

    themeToggle.addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });

    // Load saved links
    loadSavedLinks();

    shortenBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        
        if (!isValidUrl(url)) {
            showError('Please enter a valid URL');
            return;
        }

        try {
            shortenBtn.classList.add('loading');
            errorDiv.textContent = '';
            
            const shortUrl = await shortenUrl(url);
            
            shortenedUrl.value = shortUrl;
            resultContainer.classList.remove('hidden');
            resultContainer.classList.add('visible');
            
            // Save to localStorage
            saveLink(url, shortUrl);
            
            // Update displayed links
            loadSavedLinks();
            
            urlInput.value = '';
        } catch (error) {
            showError('Failed to shorten URL. Please try again.');
        } finally {
            shortenBtn.classList.remove('loading');
        }
    });

    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(shortenedUrl.value);
            showToast('Link copied!');
        } catch (err) {
            showToast('Failed to copy link', true);
        }
    });

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.opacity = '1';
    }

    function showToast(message, isError = false) {
        toast.textContent = message;
        toast.style.backgroundColor = isError ? 'var(--error-color)' : 'var(--success-color)';
        toast.classList.add('visible');
        
        setTimeout(() => {
            toast.classList.remove('visible');
        }, 3000);
    }

    function saveLink(originalUrl, shortUrl) {
        const links = JSON.parse(localStorage.getItem('links') || '[]');
        links.unshift({ originalUrl, shortUrl, timestamp: Date.now() });
        localStorage.setItem('links', JSON.stringify(links.slice(0, 10))); // Keep only last 10 links
    }

    function loadSavedLinks() {
        const links = JSON.parse(localStorage.getItem('links') || '[]');
        linksList.innerHTML = '';
        
        links.forEach(link => {
            const linkItem = document.createElement('div');
            linkItem.className = 'link-item';
            
            const linkInfo = document.createElement('div');
            linkInfo.innerHTML = `
                <div><strong>Short URL:</strong> ${link.shortUrl}</div>
                <div><small>${new URL(link.originalUrl).hostname}</small></div>
            `;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.onclick = () => deleteLink(link.shortUrl);
            
            linkItem.appendChild(linkInfo);
            linkItem.appendChild(deleteBtn);
            linksList.appendChild(linkItem);
        });
    }

    function deleteLink(shortUrl) {
        const links = JSON.parse(localStorage.getItem('links') || '[]');
        const updatedLinks = links.filter(link => link.shortUrl !== shortUrl);
        localStorage.setItem('links', JSON.stringify(updatedLinks));
        loadSavedLinks();
    }

    async function shortenUrl(url) {
        // Simple hash function for demo purposes
        // In production, you'd want to use a proper URL shortening service API
        const hash = await simpleHash(url);
        return `${window.location.origin}/s/${hash}`;
    }

    async function simpleHash(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex.slice(0, 8);
    }
});
