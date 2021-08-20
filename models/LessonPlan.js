const mongoose = require('mongoose');

const LessonPlanSchema = new mongoose.Schema({
    author: {
        type: String,
        required: true
    },
    authorEmail: {
        type: String,
        required: true
    },
    theModuleCode: {
        type: String,
        required: true
    },
    dateAndTimeCreated: {
        type: Date,
        default: Date.now
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
    nameOfLessonPlan: [
        {
            type: String
        }
    ],
    commitMsg: [
        {
            type: String
        }
    ],
    lastModified: {
        type: Date
    },
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
    topicOfLesson: [
        {
            type: String
        }
    ],
    postLessonSurveyLink: [
        {
            type: String
        }
    ],
    enableComments: [
        {
            type: Boolean
        }
    ],
    allCommentsInputs: [
        {
            type: String
        }
    ],
    allCommentsEditedby: [
        {
            type: String
        }
    ],
    allCommentsEditedbyEmails: [
        {
            type: String
        }
    ],
    allCommentsBorderColor: [
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

const LessonPlan = mongoose.model('LessonPlan', LessonPlanSchema);

module.exports = LessonPlan;