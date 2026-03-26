import mongoose from 'mongoose';

const ScanHistorySchema = new mongoose.Schema({
    enter: { type: String, required: true },
    exit: { type: String, default: null }
});

const ScannedUserSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Actual User _id or "visitor_xyz"
    firstName: { type: String },
    lastName: { type: String },
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    club: { type: String, default: 'Non défini' },
    type: { type: String, default: 'Membre' }, // 'Membre' or 'Visiteur'
    history: [ScanHistorySchema]
});

const ScanEventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, default: '' },
    authorizedScanners: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    scannedUsers: [ScannedUserSchema]
}, { timestamps: true });

export default mongoose.models.ScanEvent || mongoose.model('ScanEvent', ScanEventSchema);
