import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// IMPORTANT: Increase payload limit because Base64 strings are large
app.use(express.json({ limit: '50mb' })); 

/**
 * @route POST /api/upload-document
 * @desc Receives encrypted document from frontend and pins it to IPFS
 */
app.post('/api/upload-document', async (req, res) => {
    try {
        const { userAddress, encryptedData } = req.body;

        if (!userAddress || !encryptedData) {
            return res.status(400).json({ error: "Missing userAddress or encryptedData" });
        }

        console.log(`Received encrypted document for address: ${userAddress}`);

        // We wrap the encrypted string in a JSON object to upload to Pinata
        const jsonPayload = {
            pinataOptions: {
                cidVersion: 1
            },
            pinataMetadata: {
                name: `KYC_Doc_${userAddress}`,
            },
            pinataContent: {
                address: userAddress,
                documentData: encryptedData, // This is the AES scrambled string
                timestamp: new Date().toISOString()
            }
        };

        // Make the API call to Pinata to store it on IPFS
        const response = await axios.post(
            "https://api.pinata.cloud/pinning/pinJSONToIPFS",
            jsonPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    pinata_api_key: process.env.PINATA_API_KEY,
                    pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY
                }
            }
        );

        // response.data.IpfsHash is the unique CID (Content Identifier) on IPFS
        const ipfsHash = response.data.IpfsHash;
        console.log(`Successfully uploaded to IPFS. CID: ${ipfsHash}`);

        // Return the IPFS hash back to the frontend
        return res.status(200).json({ 
            success: true, 
            message: "Encrypted document stored safely off-chain.",
            ipfsCid: ipfsHash 
        });

    } catch (error) {
        console.error("Error uploading to IPFS:", error?.response?.data || error.message);
        return res.status(500).json({ error: "Failed to securely store document" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running in Zero-Knowledge mode on http://localhost:${PORT}`);
});