import express from 'express';
import { uploadDocument, checkStatus, getPendingRequests, getDocumentDetails, updateDocumentStatus } from '../controllers/documentController.js';

const router = express.Router();

// POST /api/documents/upload
router.post('/upload', uploadDocument);

// GET /api/documents/pending
router.get('/pending', getPendingRequests);

// GET /api/documents/:address
router.get('/:address', getDocumentDetails);

// POST /api/documents/:address/status
router.post('/:address/status', updateDocumentStatus);

// GET /api/documents/status/:address
router.get('/status/:address', checkStatus);

export default router;
