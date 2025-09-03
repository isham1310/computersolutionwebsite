const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const port = process.env.PORT || 3000; // ✅ Use Render's provided PORT

// --- Middleware Setup ---
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Serve static files (index.html, css, images, etc.) from current directory
app.use(express.static(__dirname));

// ✅ Serve index.html explicitly at root
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// --- API Endpoints ---

/**
 * @api {post} /api/contact Process Contact Form
 */
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone) {
        return res.status(400).json({ message: 'Name, email, and phone are required.' });
    }

    // ⚠️ Replace with real credentials (use env vars in production)
    const transporter = nodemailer.createTransport({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
            user: 'your-email@example.com',
            pass: 'your-email-password'
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
 */
const certificatesPath = path.join(__dirname, 'certificates.json');

async function getCertificates() {
    try {
        const data = await fs.readFile(certificatesPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Could not read or parse certificates.json.', error);
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
    const initialCerts = await getCertificates();
    if (initialCerts.length > 0) {
        console.log(`Certificate data loaded. Found ${initialCerts.length} certificates.`);
    } else {
        console.warn('Warning: certificates.json is empty or missing.');
    }
    console.log(`✅ Server running on port ${port}`);
    console.log(`Serving website from: ${__dirname}`);
});
