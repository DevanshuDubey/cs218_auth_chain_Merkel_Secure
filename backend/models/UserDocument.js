import mongoose from 'mongoose';

const userDocumentSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    encryptedDocument: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Verified', 'Revoked', 'Rejected'],
        default: 'Pending',
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
    verifiedBy: {
        type: String,
        default: null,
    },
    verifiedAt: {
        type: Date,
        default: null,
    }
});

const UserDocument = mongoose.model('UserDocument', userDocumentSchema);
export default UserDocument;
