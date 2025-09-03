const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const port = 3000;

// --- Middleware Setup ---
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (like index.html, images, etc.) from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// --- API Endpoints ---

/**
 * @api {post} /api/contact Process Contact Form
 * @description Receives contact form data and sends it via email.
 */
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone) {
        return res.status(400).json({ message: 'Name, email, and phone are required.' });
    }

    // IMPORTANT: Replace with your actual email service credentials.
    // For security, use environment variables (e.g., process.env.EMAIL_USER) in production.
    const transporter = nodemailer.createTransport({
        host: 'smtp.example.com', // Your SMTP host
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'your-email@example.com', // Your email address
            pass: 'your-email-password'     // Your email password
        }
    });

    const mailOptions = {
        from: `"Computer Solution Contact" <your-email@example.com>`,
        to: 'ComputerSolution0105@gmail.com',
        subject: 'New Contact Form Submission',
        html: `
            <h2>New Contact Request</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Message:</strong></p>
            <p>${message || 'No message provided.'}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send message.' });
    }
});

/**
 * @api {get} /api/verify/:id Verify a Certificate
 * @description Looks up a certificate by its ID from certificates.json.
 */
const certificatesPath = path.join(__dirname, 'certificates.json');

// This function reads the certificate data on each request.
// This is great for development as you don't need to restart the server
// when you change the certificates.json file.
async function getCertificates() {
    try {
        const data = await fs.readFile(certificatesPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Could not read or parse certificates.json.', error);
        // Return an empty array to prevent crashes, the find will just fail.
        return [];
    }
}

app.get('/api/verify/:id', async (req, res) => {
    const certificatesData = await getCertificates();
    const credentialId = req.params.id;
    const normalizedId = credentialId.trim().toLowerCase();

    const certificate = certificatesData.find(row => {
        const idValue = (row['Certificate ID'] || '').toString().trim().toLowerCase();
        return idValue === normalizedId;
    });

    if (certificate) {
        res.json(certificate);
    } else {
        res.status(404).json({ message: 'Certificate not found.' });
    }
});

// --- Server Start ---
app.listen(port, async () => {
    // We can do an initial load to check if the file is present and valid on startup.
    const initialCerts = await getCertificates();
    if (initialCerts.length > 0) {
        console.log(`Certificate data loaded successfully. Found ${initialCerts.length} certificates.`);
    } else {
        console.warn('Warning: certificates.json is empty or could not be loaded. Verification will fail until the file is fixed.');
    }
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Serving website from: ${path.join(__dirname, '..')}`);
});