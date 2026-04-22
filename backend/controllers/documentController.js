import UserDocument from '../models/UserDocument.js';
import { encrypt, decrypt } from '../utils/encryption.js';

export const uploadDocument = async (req, res) => {
    try {
        const { walletAddress, documentBase64 } = req.body;

        if (!walletAddress || !documentBase64) {
            return res.status(400).json({ error: "Missing walletAddress or documentBase64" });
        }

        console.log(`Received document upload request for: ${walletAddress}`);

        // Check if user already exists
        const existingDoc = await UserDocument.findOne({ walletAddress: walletAddress.toLowerCase() });
        if (existingDoc) {
            return res.status(400).json({ error: "Document already submitted for this address." });
        }

        // Encrypt the base64 string
        const encryptedData = encrypt(documentBase64);

        // Save to Database
        const newDoc = new UserDocument({
            walletAddress: walletAddress.toLowerCase(),
            encryptedDocument: encryptedData,
            status: 'Pending'
        });

        await newDoc.save();

        console.log(`Document saved securely for ${walletAddress}`);

        return res.status(200).json({ 
            success: true, 
            message: "Document encrypted and stored securely off-chain."
        });

    } catch (error) {
        console.error("Error saving document:", error);
        return res.status(500).json({ error: "Failed to securely store document" });
    }
};

export const checkStatus = async (req, res) => {
    try {
        const { address } = req.params;
        
        const doc = await UserDocument.findOne({ walletAddress: address.toLowerCase() });
        
        if (!doc) {
            return res.status(200).json({ registered: false });
        }

        return res.status(200).json({
            registered: true,
            status: doc.status,
            uploadedAt: doc.uploadedAt
        });

    } catch (error) {
        console.error("Error checking status:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

export const getPendingRequests = async (req, res) => {
    try {
        // Exclude the heavy encryptedDocument field to save bandwidth
        const pendingDocs = await UserDocument.find({ status: 'Pending' }, '-encryptedDocument');
        return res.status(200).json({ pending: pendingDocs });
    } catch (error) {
        console.error("Error fetching pending requests:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

export const getDocumentDetails = async (req, res) => {
    try {
        const { address } = req.params;
        const doc = await UserDocument.findOne({ walletAddress: address.toLowerCase() });
        
        if (!doc) {
            return res.status(404).json({ error: "Document not found" });
        }

        // Decrypt the document safely on the backend
        const decryptedBase64 = decrypt(doc.encryptedDocument);

        return res.status(200).json({
            walletAddress: doc.walletAddress,
            documentBase64: decryptedBase64,
            status: doc.status,
            uploadedAt: doc.uploadedAt
        });

    } catch (error) {
        console.error("Error fetching document details:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

export const updateDocumentStatus = async (req, res) => {
    try {
        const { address } = req.params;
        const { status, verifierAddress } = req.body;

        if (!['Verified', 'Revoked'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const doc = await UserDocument.findOne({ walletAddress: address.toLowerCase() });
        if (!doc) {
            return res.status(404).json({ error: "Document not found" });
        }

        doc.status = status;
        doc.verifiedBy = verifierAddress;
        doc.verifiedAt = new Date();

        await doc.save();

        return res.status(200).json({ success: true, message: `Identity ${status} successfully.` });
    } catch (error) {
        console.error("Error updating status:", error);
        return res.status(500).json({ error: "Server error" });
    }
};
