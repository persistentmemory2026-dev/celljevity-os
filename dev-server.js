// Simple Dev Server with Mock Data
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Mock Data
const mockUser = {
  id: "1",
  email: "admin@celljevity.com",
  name: "Admin User",
  role: "admin"
};

const mockServices = [
  { id: "1", name: "Exosome Therapy - Basic", description: "Basic exosome treatment", price: "2500.00", category: "Exosomes", active: true },
  { id: "2", name: "Exosome Therapy - Premium", description: "Advanced exosome therapy", price: "4500.00", category: "Exosomes", active: true },
  { id: "3", name: "Prometheus Protocol", description: "Comprehensive longevity assessment", price: "8900.00", category: "Prometheus", active: true },
  { id: "4", name: "NK Cell Therapy", description: "Natural killer cell immunotherapy", price: "6200.00", category: "NK Cells", active: true },
  { id: "5", name: "Biomarker Panel - Standard", description: "Complete biomarker analysis", price: "1200.00", category: "Diagnostics", active: true },
  { id: "6", name: "Consultation - Initial", description: "Initial consultation", price: "250.00", category: "Other", active: true },
];

let mockQuotes = [
  {
    id: "1",
    quoteNumber: "QUO-20240316-0001",
    type: "quote",
    status: "draft",
    customerName: "Max Mustermann",
    customerEmail: "max@example.com",
    total: "5000.00",
    createdAt: new Date().toISOString(),
    items: []
  }
];

let mockDocuments = [];

// Auth Routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@celljevity.com" && password === "admin123") {
    res.json({ user: mockUser });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: "Logged out" });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: mockUser });
});

// Services
app.get('/api/services', (req, res) => {
  res.json({ services: mockServices });
});

// Quotes
app.get('/api/quotes', (req, res) => {
  const { type } = req.query;
  let quotes = mockQuotes;
  if (type) {
    quotes = quotes.filter(q => q.type === type);
  }
  res.json({ quotes });
});

app.post('/api/quotes', (req, res) => {
  const data = req.body;
  const newQuote = {
    id: String(mockQuotes.length + 1),
    quoteNumber: `QUO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(mockQuotes.length + 1).padStart(4,'0')}`,
    ...data,
    createdAt: new Date().toISOString(),
  };
  mockQuotes.push(newQuote);
  res.status(201).json({ quote: newQuote });
});

// Documents
app.get('/api/documents', (req, res) => {
  res.json({ documents: mockDocuments });
});

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'dev-mock' });
});

// Serve Frontend (Vite dev server will proxy or we serve built files)
app.use(express.static(path.join(__dirname, 'artifacts/celljevity-app/dist')));

app.listen(PORT, () => {
  console.log('🚀 Celljevity Dev Server running on http://localhost:' + PORT);
  console.log('📊 API: http://localhost:' + PORT + '/api');
  console.log('✅ Login: admin@celljevity.com / admin123');
});
