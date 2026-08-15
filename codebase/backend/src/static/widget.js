(function () {
  const script = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const apiKey = script.getAttribute('data-api-key');
  if (!apiKey) {
    console.error('jagguAI: data-api-key is required.');
    return;
  }

  const backendUrl = 'http://localhost:3001/api/v1';
  const frontendUrl = 'http://localhost:3000';

  fetch(`${backendUrl}/widget/config?apiKey=${apiKey}`)
    .then(res => {
      if (!res.ok) {
        throw new Error('Invalid widget config');
      }
      return res.json();
    })
    .then(config => {
      initWidget(config);
    })
    .catch(err => {
      console.error('jagguAI: Failed to load widget configuration', err);
    });

  function initWidget(config) {
    const primaryColor = config.primaryColor || '#2563eb';
    const position = config.position || 'bottom-right';

    const bubble = document.createElement('button');
    bubble.id = 'jaggu-chat-bubble';
    bubble.style.position = 'fixed';
    bubble.style.bottom = '20px';
    if (position === 'bottom-right') {
      bubble.style.right = '20px';
    } else {
      bubble.style.left = '20px';
    }
    bubble.style.width = '60px';
    bubble.style.height = '60px';
    bubble.style.borderRadius = '50%';
    bubble.style.backgroundColor = primaryColor;
    bubble.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    bubble.style.border = 'none';
    bubble.style.cursor = 'pointer';
    bubble.style.zIndex = '999999';
    bubble.style.display = 'flex';
    bubble.style.alignItems = 'center';
    bubble.style.justifyContent = 'center';
    bubble.style.transition = 'transform 0.3s ease';

    bubble.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    bubble.onmouseenter = () => bubble.style.transform = 'scale(1.08)';
    bubble.onmouseleave = () => bubble.style.transform = 'scale(1)';

    const container = document.createElement('div');
    container.id = 'jaggu-chat-container';
    container.style.position = 'fixed';
    container.style.bottom = '95px';
    if (position === 'bottom-right') {
      container.style.right = '20px';
    } else {
      container.style.left = '20px';
    }
    container.style.width = '380px';
    container.style.height = '600px';
    container.style.borderRadius = '16px';
    container.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.2)';
    container.style.zIndex = '999999';
    container.style.display = 'none';
    container.style.overflow = 'hidden';
    container.style.border = '1px solid rgba(255, 255, 255, 0.1)';

    const iframe = document.createElement('iframe');
    iframe.src = `${frontendUrl}/widget?apiKey=${apiKey}`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    container.appendChild(iframe);
    document.body.appendChild(bubble);
    document.body.appendChild(container);

    let isOpen = false;

    bubble.onclick = () => {
      isOpen = !isOpen;
      if (isOpen) {
        container.style.display = 'block';
        bubble.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      } else {
        container.style.display = 'none';
        bubble.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      }
    };

    window.addEventListener('message', (event) => {
      if (event.origin !== frontendUrl) {
        return;
      }
      if (event.data === 'jaggu-close-widget') {
        isOpen = false;
        container.style.display = 'none';
        bubble.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      }
    });
  }
})();
