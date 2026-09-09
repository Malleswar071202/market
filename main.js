// State management
let activeTab = 'rateBuilder';
let rateItems = [];
let qrcodeInstance = null;

// Initial sample rate items for SADGURU DALL MILLS
const sampleRateData = [
  { brand: 'Damarukam', gullu: '6450', pappu: '6650' },
  { brand: 'Guntur Gold', gullu: '9200', pappu: '9450' },
  { brand: '7 Horse', gullu: '8100', pappu: '8300' },
  { brand: 'Pinaka', gullu: '7800', pappu: '8000' }
];

document.addEventListener('DOMContentLoaded', () => {
  // Set today's date as default in date input
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('millDate');
  if (dateInput) dateInput.value = today;

  // Load saved data from LocalStorage if available
  loadSavedState();

  // Attach event listeners
  const phoneInput = document.getElementById('phoneNumber');
  const countryCode = document.getElementById('countryCode');
  const customInput = document.getElementById('customMessageInput');
  const millSubtitle = document.getElementById('millSubtitle');
  const millFooter = document.getElementById('millFooter');

  if (phoneInput) phoneInput.addEventListener('input', () => { saveState(); updateOutput(); });
  if (countryCode) countryCode.addEventListener('change', () => { saveState(); updateOutput(); });
  if (customInput) customInput.addEventListener('input', () => { saveState(); updateOutput(); });
  if (dateInput) dateInput.addEventListener('change', updateOutput);
  if (millSubtitle) millSubtitle.addEventListener('input', () => { saveState(); updateOutput(); });
  if (millFooter) millFooter.addEventListener('input', () => { saveState(); updateOutput(); });

  // Update clock in chat preview
  updateChatTime();

  // Initial render
  updateOutput();
});

// Save current form state to LocalStorage
function saveState() {
  const state = {
    rateItems: rateItems,
    subtitle: document.getElementById('millSubtitle')?.value || '',
    footer: document.getElementById('millFooter')?.value || '',
    phoneNumber: document.getElementById('phoneNumber')?.value || '',
    countryCode: document.getElementById('countryCode')?.value || '91'
  };
  localStorage.setItem('sadguru_generator_state', JSON.stringify(state));
}

// Load saved form state from LocalStorage
function loadSavedState() {
  const saved = localStorage.getItem('sadguru_generator_state');
  if (saved) {
    try {
      const state = JSON.parse(saved);
      if (state.rateItems && Array.isArray(state.rateItems) && state.rateItems.length > 0) {
        rateItems = state.rateItems;
      } else {
        rateItems = JSON.parse(JSON.stringify(sampleRateData));
      }
      
      if (state.subtitle !== undefined) document.getElementById('millSubtitle').value = state.subtitle;
      if (state.footer !== undefined) document.getElementById('millFooter').value = state.footer;
      if (state.phoneNumber !== undefined) document.getElementById('phoneNumber').value = state.phoneNumber;
      if (state.countryCode !== undefined) document.getElementById('countryCode').value = state.countryCode;

      renderRateRows();
      return;
    } catch (e) {
      console.error('Failed to parse saved state:', e);
    }
  }

  // Default fallback if no saved data
  loadSampleRates();
}

// Load default sample rates
function loadSampleRates() {
  rateItems = JSON.parse(JSON.stringify(sampleRateData));
  document.getElementById('millSubtitle').value = '';
  document.getElementById('millFooter').value = '';
  renderRateRows();
  saveState();
  updateOutput();
  showToast('Reset to default sample rates!');
}

// Render dynamic rows in Sadguru Rate Builder
function renderRateRows() {
  const container = document.getElementById('rateRowsContainer');
  if (!container) return;

  container.innerHTML = '';

  rateItems.forEach((item, index) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'rate-row-item';
    rowEl.innerHTML = `
      <input type="text" class="form-input brand-input" placeholder="Brand / Pulse Name" value="${escapeHtml(item.brand)}" oninput="updateRateItem(${index}, 'brand', this.value)">
      <input type="text" class="form-input gullu-input" placeholder="₹ Rate" value="${escapeHtml(item.gullu)}" oninput="updateRateItem(${index}, 'gullu', this.value)">
      <input type="text" class="form-input pappu-input" placeholder="₹ Rate" value="${escapeHtml(item.pappu)}" oninput="updateRateItem(${index}, 'pappu', this.value)">
      <button class="btn-remove-row" onclick="removeRateRow(${index})" title="Remove Item"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(rowEl);
  });
}

// Add new empty item row
function addRateRow() {
  rateItems.push({ brand: '', gullu: '', pappu: '' });
  renderRateRows();
  saveState();
  updateOutput();
}

// Update specific field in rate row
function updateRateItem(index, field, value) {
  if (rateItems[index]) {
    rateItems[index][field] = value;
    saveState();
    updateOutput();
  }
}

// Remove item row
function removeRateRow(index) {
  if (rateItems.length <= 1) {
    showToast('At least one item row is required.', 'warning');
    return;
  }
  rateItems.splice(index, 1);
  renderRateRows();
  saveState();
  updateOutput();
}

// Tab Switching Logic
function switchTab(tabName) {
  activeTab = tabName;
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  if (tabName === 'rateBuilder') {
    document.getElementById('tabRateBuilder').classList.add('active');
    document.getElementById('rateBuilderContent').classList.add('active');
  } else if (tabName === 'customMsg') {
    document.getElementById('tabCustomMsg').classList.add('active');
    document.getElementById('customMsgContent').classList.add('active');
  } else if (tabName === 'templates') {
    document.getElementById('tabTemplates').classList.add('active');
    document.getElementById('templatesContent').classList.add('active');
  }

  updateOutput();
}

// Generate the final WhatsApp formatted text string
function generateFormattedText() {
  if (activeTab === 'customMsg') {
    const customMsg = document.getElementById('customMessageInput').value;
    return customMsg || '*(Your custom message will appear here)*';
  }

  // Sadguru Dall Mills Rate Builder Template
  const rawDate = document.getElementById('millDate').value;
  const subtitle = document.getElementById('millSubtitle').value || 'TODAY MARKET RATES';
  const footerNote = document.getElementById('millFooter').value || '9247484969';

  let formattedDate = '';
  if (rawDate) {
    const [year, month, day] = rawDate.split('-');
    formattedDate = `${day}/${month}/${year}`;
  } else {
    formattedDate = new Date().toLocaleDateString('en-IN');
  }

  let text = `*SADGURU DALL MILLS*\n`;
  text += `Date: *${formattedDate}*\n`;
  text += `*${subtitle.toUpperCase()}*\n\n`;

  text += `*BRAND* | *GULLU* | *PAPPU*\n`;
  text += `---------------------------------\n`;

  rateItems.forEach(item => {
    const brandName = item.brand.trim() || 'Brand Item';
    const gulluVal = item.gullu.trim() ? item.gullu.trim() : '-';
    const pappuVal = item.pappu.trim() ? item.pappu.trim() : '-';

    text += `*${brandName}* : ${gulluVal} | ${pappuVal}\n`;
  });

  text += `---------------------------------\n`;

  if (footerNote.trim()) {
    text += `*Contact for Booking:* ${footerNote.trim()}`;
  }

  return text;
}

// Padding helper for fixed-width monospace columns
function padRight(str, length) {
  let s = String(str);
  if (s.length > length) {
    s = s.substring(0, length - 1) + '.';
  }
  return s + ' '.repeat(Math.max(0, length - s.length));
}

// Update UI (Preview Box & Direct WhatsApp Link)
function updateOutput() {
  const fullText = generateFormattedText();
  
  // Render text inside preview bubble with basic WhatsApp markup conversion
  const previewContainer = document.getElementById('formattedPreviewText');
  if (previewContainer) {
    previewContainer.innerHTML = convertWhatsAppMarkupToHTML(fullText);
  }

  // Format WhatsApp Link
  const phoneVal = document.getElementById('phoneNumber').value.replace(/\D/g, '');
  const countryCode = document.getElementById('countryCode').value;

  let waUrl = 'https://wa.me/';
  if (phoneVal) {
    waUrl += `${countryCode}${phoneVal}`;
  }

  if (fullText) {
    waUrl += `?text=${encodeURIComponent(fullText)}`;
  }

  const linkInput = document.getElementById('generatedLinkInput');
  if (linkInput) {
    linkInput.value = waUrl;
  }
}

// Convert WhatsApp bold (*), italic (_), strikethrough (~), code (```) to HTML for live chat bubble view
function convertWhatsAppMarkupToHTML(text) {
  let html = escapeHtml(text);
  
  // WhatsApp Monospace code block ```text```
  html = html.replace(/```\n?([\s\S]*?)\n?```/g, '<pre style="font-family: monospace; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; overflow-x: auto;">$1</pre>');

  // Bold *text*
  html = html.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  // Italic _text_
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  // Strikethrough ~text~
  html = html.replace(/~(.*?)~/g, '<del>$1</del>');
  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

// Open Direct Link in WhatsApp
function openWhatsApp() {
  const linkInput = document.getElementById('generatedLinkInput');
  if (linkInput && linkInput.value) {
    window.open(linkInput.value, '_blank');
  }
}

// Clipboard Copies
function copyFormattedText() {
  const text = generateFormattedText();
  navigator.clipboard.writeText(text).then(() => {
    showToast('Message text copied to clipboard! 📋');
  }).catch(() => {
    showToast('Failed to copy text', 'error');
  });
}

function copyWhatsAppLink() {
  const linkInput = document.getElementById('generatedLinkInput');
  if (linkInput && linkInput.value) {
    navigator.clipboard.writeText(linkInput.value).then(() => {
      showToast('WhatsApp link copied to clipboard! 🔗');
    }).catch(() => {
      showToast('Failed to copy link', 'error');
    });
  }
}

// Formatting Toolbar for Custom Message
function applyFormat(type) {
  const textarea = document.getElementById('customMessageInput');
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end) || 'text';

  let formatted = selected;
  if (type === 'bold') formatted = `*${selected}*`;
  if (type === 'italic') formatted = `_${selected}_`;
  if (type === 'strike') formatted = `~${selected}~`;
  if (type === 'code') formatted = `\`\`\`${selected}\`\`\``;

  textarea.setRangeText(formatted, start, end, 'select');
  textarea.focus();
  updateOutput();
}

function insertEmoji(emoji) {
  const textarea = document.getElementById('customMessageInput');
  if (!textarea) return;

  const start = textarea.selectionStart;
  textarea.setRangeText(emoji, start, start, 'end');
  textarea.focus();
  updateOutput();
}

// Presets
function applyPreset(presetType) {
  if (presetType === 'dallFull') {
    switchTab('rateBuilder');
    loadSampleRates();
  } else if (presetType === 'orderConfirm') {
    switchTab('customMsg');
    const msg = `*SADGURU DALL MILLS - ORDER CONFIRMATION*\n\nDear Customer,\nThank you for booking your order with us!\n\n📋 *Order Summary:*\n• Item: Desi Chana Dall\n• Quantity: 50 Bags\n• Rate: ₹6,450 / Quintal\n\n🚚 *Dispatch Status:* Ready for loading tomorrow morning.\nPayment due upon delivery. Thank you!`;
    document.getElementById('customMessageInput').value = msg;
    updateOutput();
    showToast('Order Confirmation template applied!');
  } else if (presetType === 'discountPromo') {
    switchTab('customMsg');
    const msg = `🔥 *SPECIAL WEEKEND OFFER - SADGURU DALL MILLS* 🔥\n\nWe are offering a limited period discount of *₹100/Quintal* on all Toor Dall & Moong Mogar bookings!\n\n✅ Premium Quality Guaranteed\n✅ Direct Mill Booking\n\n📞 Call/WhatsApp us today to lock your rates!`;
    document.getElementById('customMessageInput').value = msg;
    updateOutput();
    showToast('Discount Promo template applied!');
  } else if (presetType === 'paymentReminder') {
    switchTab('customMsg');
    const msg = `📌 *SADGURU DALL MILLS - PAYMENT REMINDER*\n\nDear Client,\nThis is a gentle reminder regarding payment for Invoice #SDM-1042.\n\n💰 *Pending Amount:* ₹1,45,000\n📅 *Due Date:* Immediate\n\nKindly process the payment at your earliest convenience. Thank you for your continued business!`;
    document.getElementById('customMessageInput').value = msg;
    updateOutput();
    showToast('Payment Reminder template applied!');
  }
}

// Modal & QR Code Generation
function showQrModal() {
  const link = document.getElementById('generatedLinkInput').value;
  const qrContainer = document.getElementById('qrcodeContainer');
  
  if (!qrContainer) return;
  qrContainer.innerHTML = '';

  qrcodeInstance = new QRCode(qrContainer, {
    text: link,
    width: 200,
    height: 200,
    colorDark: '#0b141a',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  document.getElementById('qrModal').classList.add('active');
}

function closeQrModal() {
  document.getElementById('qrModal').classList.remove('active');
}

function downloadQRCode() {
  const canvas = document.querySelector('#qrcodeContainer canvas');
  if (!canvas) {
    showToast('Unable to export QR image', 'error');
    return;
  }

  const imageURI = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = imageURI;
  a.download = 'Sadguru_Dall_Mills_WhatsApp_QR.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('QR Code downloaded successfully! 📥');
}

// Clock utility for chat simulator
function updateChatTime() {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;

  const timeStr = `${hours}:${minutes} ${ampm}`;
  const el = document.getElementById('chatTime');
  if (el) el.innerText = timeStr;
}

// Toast System
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-whatsapp' : 'fa-circle-exclamation'}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Helper: Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
