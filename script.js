// [KEEP ALL DOM ELEMENTS FROM PREVIOUS CODE HERE]
const balanceEl = document.getElementById('balance');
const moneyPlusEl = document.getElementById('money-plus');
const moneyMinusEl = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const category = document.getElementById('category');
const limitInput = document.getElementById('monthly-limit');
const currencySelect = document.getElementById('currency-select');
const search = document.getElementById('search');
const submitBtn = document.getElementById('submit-btn');
const limitDisplay = document.getElementById('limit-display');
const remainingDisplay = document.getElementById('remaining-display');
const progressBar = document.getElementById('progress-bar');
const verdictCard = document.getElementById('verdict-card');
const verdictTitle = document.getElementById('verdict-title');
const verdictMessage = document.getElementById('verdict-message');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let monthlyLimit = localStorage.getItem('monthlyLimit') || 0;
let currentCurrency = localStorage.getItem('currency') || '$';
let isExpense = true;
let expenseChart; 

// [KEEP INIT, THEME, CURRENCY, & LIMIT FUNCTIONS HERE]

function init() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('.theme-toggle').innerText = '☀️';
    }
    currencySelect.value = currentCurrency;
    limitInput.value = monthlyLimit;
    updateValues();
    renderList();
    renderChart();
    renderCalendar();
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.querySelector('.theme-toggle').innerText = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    renderChart();
}

function changeCurrency() {
    currentCurrency = currencySelect.value;
    localStorage.setItem('currency', currentCurrency);
    updateValues();
    renderList();
    renderCalendar();
}

function setLimit() {
    monthlyLimit = +limitInput.value;
    localStorage.setItem('monthlyLimit', monthlyLimit);
    updateValues();
}

function toggleType(type) {
    isExpense = (type === 'expense');
    submitBtn.innerText = isExpense ? "Add Expense" : "Add Income";
    submitBtn.style.background = isExpense ? "var(--danger)" : "var(--success)";
}

// [KEEP TRANSACTION LOGIC & RENDER FUNCTIONS]
function addTransaction(e) {
    e.preventDefault();
    if(text.value.trim() === '' || amount.value.trim() === '') return alert('Please fill details');

    const sign = isExpense ? -1 : 1;
    const finalAmount = +amount.value * sign;

    const transaction = {
        id: Math.floor(Math.random() * 100000000),
        text: text.value,
        amount: finalAmount,
        category: category.value,
        date: new Date().toLocaleDateString('en-US') 
    };

    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    text.value = ''; amount.value = '';
    updateValues(); renderList(); renderChart(); renderCalendar();
}

function removeTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateValues(); renderList(); renderChart(); renderCalendar();
}

function updateValues() {
    const amounts = transactions.map(t => t.amount);
    const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0).toFixed(2);
    const expense = (amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1).toFixed(2);

    balanceEl.innerText = `${currentCurrency}${total}`;
    moneyPlusEl.innerText = `+${currentCurrency}${income}`;
    moneyMinusEl.innerText = `-${currentCurrency}${expense}`;
    limitDisplay.innerText = `${currentCurrency}${monthlyLimit}`;

    const remaining = monthlyLimit - expense;
    remainingDisplay.innerText = `${currentCurrency}${remaining.toFixed(2)}`;
    
    let percentage = 0;
    if(monthlyLimit > 0) percentage = (expense / monthlyLimit) * 100;
    progressBar.style.width = `${Math.min(percentage, 100)}%`;
    if (percentage > 100) progressBar.style.backgroundColor = '#e74c3c';
    else if (percentage > 80) progressBar.style.backgroundColor = '#f1c40f';
    else progressBar.style.backgroundColor = '#2ecc71';
}

function renderList() {
    list.innerHTML = '';
    const searchTerm = search.value.toLowerCase();
    transactions.forEach(t => {
        if(searchTerm && !t.text.toLowerCase().includes(searchTerm)) return;
        const sign = t.amount < 0 ? '-' : '+';
        const borderClass = t.amount < 0 ? 'minus' : 'plus';
        
        const item = document.createElement('li');
        item.classList.add(borderClass);
        item.innerHTML = `
            <div>
                <strong>${t.category}</strong> <br> ${t.text}
            </div>
            <span>${sign}${currentCurrency}${Math.abs(t.amount)} 
            <button class="btn-small" style="margin-left:5px" onclick="removeTransaction(${t.id})">x</button></span>
        `;
        list.appendChild(item);
    });
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = ''; 
    const daysInMonth = 30; 
    const dailySpending = new Array(daysInMonth + 1).fill(0);

    transactions.forEach(t => {
        const dateParts = t.date.split('/'); 
        const day = parseInt(dateParts[1]); 
        if (t.amount < 0 && day <= daysInMonth) dailySpending[day] += Math.abs(t.amount);
    });

    for (let i = 1; i <= daysInMonth; i++) {
        const box = document.createElement('div');
        box.classList.add('day-box');
        box.innerText = i;
        const spent = dailySpending[i];
        if (spent === 0) box.classList.add('safe'); 
        else if (spent < 50) box.classList.add('moderate'); 
        else box.classList.add('heavy'); 
        grid.appendChild(box);
    }
}

function renderChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const expenseTransactions = transactions.filter(t => t.amount < 0);
    const categories = {};
    expenseTransactions.forEach(t => {
        if(categories[t.category]) categories[t.category] += Math.abs(t.amount);
        else categories[t.category] = Math.abs(t.amount);
    });

    if(expenseChart) expenseChart.destroy();
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#95a5a6'],
                borderWidth: 0 // Cleaner look on mobile
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// --- UPDATED VOICE LOGIC FOR MOBILE ---
function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice control requires Chrome or Safari (HTTPS).");

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    const voiceBtn = document.querySelector('.btn-voice');

    recognition.start();
    voiceBtn.innerText = "🔴 Listening...";
    voiceBtn.classList.add('listening');

    recognition.onresult = function(event) {
        const command = event.results[0][0].transcript.toLowerCase();
        processVoiceCommand(command);
        voiceBtn.classList.remove('listening');
        voiceBtn.innerText = "✅ Done! Speak again?";
        setTimeout(() => voiceBtn.innerText = '🎤 Tap & Speak', 2000);
    };

    recognition.onerror = function(event) {
        console.error(event.error);
        voiceBtn.classList.remove('listening');
        voiceBtn.innerText = "❌ Error. Try again.";
    };
}

function processVoiceCommand(command) {
    const amountMatch = command.match(/\d+/);
    if (amountMatch) amount.value = amountMatch[0];

    const categories = ['food', 'transport', 'shopping', 'bills', 'entertainment', 'salary', 'freelance'];
    categories.forEach(cat => {
        if (command.includes(cat)) category.value = cat.charAt(0).toUpperCase() + cat.slice(1);
    });

    if (command.includes("received") || command.includes("income")) document.getElementById('type-income').click();
    else document.getElementById('type-expense').click();

    text.value = command;
}

function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,ID,Date,Category,Description,Amount\n";
    transactions.forEach(t => { csvContent += `${t.id},${t.date},${t.category},${t.text},${t.amount}\n`; });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "budget_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function endMonth() {
    const expense = (transactions.filter(item => item.amount < 0).reduce((acc, item) => (acc += item.amount), 0) * -1);
    if(monthlyLimit == 0) return alert("Set a limit first!");
    
    verdictCard.classList.remove('hidden', 'win', 'lose');
    verdictCard.classList.add('show');
    
    if (expense <= monthlyLimit) {
        verdictCard.classList.add('win');
        verdictTitle.innerText = "🌟 Win!";
        verdictMessage.innerText = "Reward: Treat yourself!";
    } else {
        verdictCard.classList.add('lose');
        verdictTitle.innerText = "⚠️ Fail!";
        verdictMessage.innerText = "Punishment: No eating out!";
    }
}

function closeVerdict() {
    verdictCard.classList.remove('show');
    verdictCard.classList.add('hidden');
    if(confirm("Start new month?")) {
        transactions = [];
        localStorage.setItem('transactions', JSON.stringify(transactions));
        init();
    }
}

function filterTransactions() { renderList(); }

form.addEventListener('submit', addTransaction);
init();
