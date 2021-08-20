const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    dateAndTimeCreated: {
        type: Date,
        default: Date.now
    },
    author: {
        type: String,
        required: true
    },
    authorEmail: {
        type: String,
        required: true
    },
    lastModified: {
        type: Date
    },
    headerForNotesName: [
        {
            type: String
        }
    ],
    colorPickerForNote: [
        {
            type: String
        }
    ],
    goTextArea: [
        {
            type: String
        }
    ],
    headerForEventName: [
        {
            type: String
        }
    ],
    textAreasForEvents: [
        {
            type: String
        }
    ],
    colorPickerForEvent: [
        {
            type: String
        }
    ],
    goDuration: [
        {
            type: String
        }
    ],
    goMinutes: [
        {
            type: String
        }
    ],
    goTime: [
        {
            type: String
        }
    ],
    notesLastModifiedBy: [
        {
            type: String
        }
    ],
    eventsLastModifiedBy: [
        {
            type: String
        }
    ],
    startTime: [
        {
            type: String
        }
    ]
});

const Resource = mongoose.model('Resource', ResourceSchema);

module.exports = Resource;