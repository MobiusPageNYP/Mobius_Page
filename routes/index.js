const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const Subject = require('../models/Subject');
const LessonPlan = require('../models/LessonPlan');
const Resource = require('../models/Resource');
var fs = require('fs');
var PDF = require('pdfmake/build/pdfmake')
var PDF_Fonts = require('pdfmake/build/vfs_fonts')
PDF.vfs = PDF_Fonts.pdfMake.vfs;
var htmlToPdfMake = require("html-to-pdfmake");
var jsdom = require("jsdom");
var { JSDOM } = jsdom;
var { window } = new JSDOM("");
const puppeteer = require('puppeteer');
const { debug } = require('console');


// Welcome Page
router.get('/', (req, res) => res.render('welcome'));
// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) =>
    res.render('dashboard', {LoginUser: req.user,
        name: req.user.name
    }));

// New Lesson Plan page
router.get('/home/:_id/new-lessonplan', ensureAuthenticated, async (req, res) => {
    var idOfModuleForLessonPlan = req.params._id;
    const theModuleToCreateLessonPlan = await Subject.findById(idOfModuleForLessonPlan);
    res.render('newlessonplan', {
        LoginUser: req.user,
        name: req.user.name,
        email: req.user.email,
        theModuleToDisplay: theModuleToCreateLessonPlan
    });
});

// Save New lesson plan
router.post('/home/:_id/new-lessonplan', ensureAuthenticated, async (req, res) => {
    var author = req.user.name;
    var authorEmail = req.user.email;

    var idToFindForHere = req.params._id;
    const theModuleToTake = await Subject.findById(idToFindForHere);
    var theModuleCode = theModuleToTake.moduleCode;

    //Pass data to lesson plan object
    let newAvailableLessonPlan = new LessonPlan({
        author,
        authorEmail,
        theModuleCode
    });
    
    newAvailableLessonPlan.headerForNotesName = req.body.headerForNotesName;
    newAvailableLessonPlan.colorPickerForNote = req.body.colorPickerForNote;
    newAvailableLessonPlan.goTextArea = req.body.goTextArea;
    newAvailableLessonPlan.headerForEventName = req.body.headerForEventName;
    newAvailableLessonPlan.textAreasForEvents = req.body.textAreasForEvents;
    newAvailableLessonPlan.colorPickerForEvent = req.body.colorPickerForEvent;
    newAvailableLessonPlan.goDuration = req.body.goDuration;
    newAvailableLessonPlan.goMinutes = req.body.goMinutes;
    newAvailableLessonPlan.goTime = req.body.goTime;
    newAvailableLessonPlan.nameOfLessonPlan = req.body.nameOfLessonPlan;
    newAvailableLessonPlan.notesLastModifiedBy = req.body.labelForLastModifiedBy;
    newAvailableLessonPlan.eventsLastModifiedBy = req.body.labelSetForLastModified;
    newAvailableLessonPlan.topicOfLesson = req.body.topicOfLessonTb;
    newAvailableLessonPlan.postLessonSurveyLink = req.body.postLessonSurveyLinkTbb;
    newAvailableLessonPlan.allCommentsInputs = req.body.commentsTA;
    newAvailableLessonPlan.allCommentsEditedby = req.body.CommentsEditedBy;
    newAvailableLessonPlan.allCommentsEditedbyEmails = authorEmail;
    newAvailableLessonPlan.allCommentsBorderColor = "blue";
    newAvailableLessonPlan.startTime = req.body.startTimeInput;

    console.log(newAvailableLessonPlan.notesLastModifiedBy + typeof newAvailableLessonPlan.notesLastModifiedBy)

    // Checkbox value of allowing to comment, true or false
    req.body.EnableCommentCB = Boolean(req.body.EnableCommentCB);
    newAvailableLessonPlan.enableComments = req.body.EnableCommentCB;

    newAvailableLessonPlan.commitMsg = req.body.commitMsg;
    newAvailableLessonPlan.lastModified = Date.now();

    // for (i in newAvailableLessonPlan.notesLastModifiedBy){
    //     return String(i).trim();
    // }
    // for (i in newAvailableLessonPlan.eventsLastModifiedBy) {
    //     return String(i).trim();
    // }
    // for (i in newAvailableLessonPlan.allCommentsEditedby) {
    //     return String(i).trim();
    // }

    newAvailableLessonPlan.save()
        .then(lessonPlans => {
            res.redirect(`/home/${req.params._id}`);
        });
});

//At read lesson plan page
// Read lesson plan, post-lesson survey links, comments
router.get('/home/module/:_id', ensureAuthenticated, async (req, res) => {
    //Get the lessonplan and subject of given params id
    //Render the data to display on front-end
    var idOfLessonPlan = req.params._id;
    const lessonplanToShow = await LessonPlan.findById(idOfLessonPlan);
    const lessonPlanModule = await Subject.find({ "moduleCode": lessonplanToShow.theModuleCode });

    res.render('showlessonplan', { LoginUser: req.user, name: req.user.name, email: req.user.email, theLessonPlanToDisplay: lessonplanToShow, moduleOfLessonPlan: lessonPlanModule });
});

//At read lesson plan page
//Comment button is clicked at front-end
router.post('/home/module/:_id/comment', ensureAuthenticated, async (req, res) => {
    var idOfLessonPlan = req.params._id;
    //Finds the lessonplan to update the comments
    await LessonPlan.findByIdAndUpdate({ _id: req.params._id}, { allCommentsInputs: req.body.commentsTAHidden, allCommentsEditedby: req.body.CommentsEditedBy,
        allCommentsEditedbyEmails: req.body.commentsEditedByEmail, allCommentsBorderColor: req.body.CommentBorderColor }, (err, doc) => {
        if (!err) {
            console.log("Updated!")
            res.redirect(`/home/module/${idOfLessonPlan}`);
        } else {
            console.log('Error in updating: ' + err)
        }
    });
});

//At read cards page
//Read cards, post-lesson survey links, comments
router.post('/home/module/:_id/showcards/comment', ensureAuthenticated, async (req, res) => {
    var idOfLessonPlan = req.params._id;
    //Finds the lessonplan to update the comments
    await LessonPlan.findByIdAndUpdate({ _id: req.params._id}, { allCommentsInputs: req.body.commentsTAHidden, allCommentsEditedby: req.body.CommentsEditedBy,
        allCommentsEditedbyEmails: req.body.commentsEditedByEmail, allCommentsBorderColor: req.body.CommentBorderColor }, (err, doc) => {
        if (!err) {
            console.log("Updated!")
            res.redirect(`/home/module/${idOfLessonPlan}/showcards`);
        } else {
            console.log('Error in updating: ' + err)
        }
    });
});

//At edit lesson plan & cards page
router.get('/home/module/:_id/edit', ensureAuthenticated, async (req, res) => {
    var idOfTheLessonPlan = req.params._id;
    //Get the lessonplan and subject of given params id
    //Render the data to display on front-end
    const lessonplanToEdit = await LessonPlan.findById(idOfTheLessonPlan);
    const moduleOfLessonPlanToEdit = await Subject.find({ "moduleCode": lessonplanToEdit.theModuleCode });
    res.render('editlessonplan', { name: req.user.name, LoginUser: req.user, email: req.user.email, theLessonPlanToDisplay: lessonplanToEdit, moduleOfLessonPlan: moduleOfLessonPlanToEdit });
});

//At edit lesson plan & cards page
//Save button
router.post('/home/module/:_id/edit', ensureAuthenticated, async (req, res) => {
    var author = req.user.name;
    var authorEmail = req.user.email;
    console.log(author)
    console.log(authorEmail)
    console.log(req.body.postLessonSurveyLink);

    var idToFindHere = req.params._id;
    //Retrieve the specific lesson plan by id
    const lessonplanToTakeHere = await LessonPlan.findById(idToFindHere);
    const theModuleCode = lessonplanToTakeHere.theModuleCode;
    const dateAndTimeCreated = lessonplanToTakeHere.dateAndTimeCreated;
    console.log(theModuleCode)
    console.log(dateAndTimeCreated)
    // Get the module _id
    const moduleThatLessonPlanBelongsTo = await Subject.findOne({ moduleCode: theModuleCode });
    const idOfThisModule = moduleThatLessonPlanBelongsTo._id;
    console.log(idOfThisModule)
    
    // Get data from user input (req.body)
    // Save in database
    // Pass in data to lesson plan object
    let newAvailableLessonPlan = new LessonPlan({
        author,
        authorEmail,
        theModuleCode
    });
    
    newAvailableLessonPlan.dateAndTimeCreated = dateAndTimeCreated;
    newAvailableLessonPlan.headerForNotesName = req.body.headerForNotesName;
    newAvailableLessonPlan.colorPickerForNote = req.body.colorPickerForNote;
    newAvailableLessonPlan.goTextArea = req.body.goTextArea;
    newAvailableLessonPlan.headerForEventName = req.body.headerForEventName;
    newAvailableLessonPlan.textAreasForEvents = req.body.textAreasForEvents;
    newAvailableLessonPlan.colorPickerForEvent = req.body.colorPickerForEvent;
    newAvailableLessonPlan.goDuration = req.body.goDuration;
    newAvailableLessonPlan.goMinutes = req.body.goMinutes;
    newAvailableLessonPlan.goTime = req.body.goTime;
    newAvailableLessonPlan.nameOfLessonPlan = req.body.nameOfLessonPlan;
    newAvailableLessonPlan.notesLastModifiedBy = req.body.labelForLastModifiedBy;
    // to do: trim the data
    newAvailableLessonPlan.eventsLastModifiedBy = req.body.labelSetForLastModified;
    newAvailableLessonPlan.commitMsg = req.body.commitMsg;
    newAvailableLessonPlan.lastModified = Date.now();
    newAvailableLessonPlan.topicOfLesson = req.body.topicOfLessonTb;
    newAvailableLessonPlan.postLessonSurveyLink = req.body.postLessonSurveyLinkTbb;
    newAvailableLessonPlan.allCommentsInputs = req.body.commentsTAHidden;
    newAvailableLessonPlan.allCommentsEditedby = req.body.CommentsEditedBy;
    newAvailableLessonPlan.allCommentsEditedbyEmails = req.body.commentsEditedByEmail;
    newAvailableLessonPlan.allCommentsBorderColor = req.body.CommentBorderColor;
    newAvailableLessonPlan.startTime = req.body.startTimeInput;

    // Checkbox value of allowing to comment, true or false
    req.body.EnableCommentCB = Boolean(req.body.EnableCommentCB);
    newAvailableLessonPlan.enableComments = req.body.EnableCommentCB;
    // console.log(req.body.EnableCommentCB)

    //Allowing to comment is false
    if(!req.body.EnableCommentCB){
        //if edited by has more than one name
        if(newAvailableLessonPlan.allCommentsEditedby.length > 1){
            //Each of newAvailableLessonPlan attribute (allCommentsInputs, allCommentsEditedby, allCommentsEditedbyEmails, allCommentsBorderColor) is an array
            var CommentTAWords = newAvailableLessonPlan.allCommentsInputs;

            var CommentTAEditedby = newAvailableLessonPlan.allCommentsEditedby;

            var CommentTAEditedbyEmail = newAvailableLessonPlan.allCommentsEditedbyEmails;

            var CommentTABorderColor = newAvailableLessonPlan.allCommentsBorderColor;

            //Only display the first of each above array which belongs to Author's
            //Since commenting is false, Author is allowed to comment on his own lesson plan while others cannot
            newAvailableLessonPlan.allCommentsInputs = CommentTAWords[0];
            newAvailableLessonPlan.allCommentsEditedby = CommentTAEditedby[0];
            newAvailableLessonPlan.allCommentsEditedbyEmails = CommentTAEditedbyEmail[0];
            newAvailableLessonPlan.allCommentsBorderColor = CommentTABorderColor[0];
        }
    }

    //Front-end radiobutton choose to update lesson plan
    if(req.body.inlineRadioOptions == 'UpdatedLessonPlan')
    {
        //If comment is enabled, true
        //Update all the comments made to the specific lesson plan by id
        if(req.body.EnableCommentCB){
            await LessonPlan.findByIdAndUpdate({ _id: req.params._id}, { headerForNotesName: req.body.headerForNotesName,
                colorPickerForNote: req.body.colorPickerForNote, goTextArea: req.body.goTextArea, headerForEventName: req.body.headerForEventName, textAreasForEvents: req.body.textAreasForEvents,
                colorPickerForEvent: req.body.colorPickerForEvent, goDuration: req.body.goDuration, goMinutes: req.body.goMinutes, goTime: req.body.goTime, nameOfLessonPlan: req.body.nameOfLessonPlan,
                commitMsg: req.body.commitMsg, notesLastModifiedBy: req.body.labelForLastModifiedBy, eventsLastModifiedBy: req.body.labelSetForLastModified, topicOfLesson: req.body.topicOfLessonTb,
                postLessonSurveyLink: req.body.postLessonSurveyLinkTbb, author: author, authorEmail: authorEmail,
                theModuleCode: theModuleCode, dateAndTimeCreated: dateAndTimeCreated, lastModified: Date.now(), allCommentsInputs: req.body.commentsTAHidden, allCommentsEditedby: req.body.CommentsEditedBy,
                allCommentsEditedbyEmails: req.body.commentsEditedByEmail, allCommentsBorderColor: req.body.CommentBorderColor, enableComments: req.body.EnableCommentCB, startTime: req.body.startTimeInput }, (err, doc) => {
                if (!err) {
                    console.log("Updated!")
                    res.redirect(`/home/${moduleThatLessonPlanBelongsTo._id}`);
                } else {
                    console.log('Error in updating: ' + err)
                }
            });
        }
        else{
            let LessonPlanToUpdate = new LessonPlan({
            });
            LessonPlanToUpdate.allCommentsInputs = req.body.commentsTAHidden;
            LessonPlanToUpdate.allCommentsEditedby = req.body.CommentsEditedBy;
            LessonPlanToUpdate.allCommentsEditedbyEmails = req.body.commentsEditedByEmail;
            LessonPlanToUpdate.allCommentsBorderColor = req.body.CommentBorderColor;

            //Each of LessonPlanToUpdate attribute (allCommentsInputs, allCommentsEditedby, allCommentsEditedbyEmails, allCommentsBorderColor) is an array
                var CommentTAWords = LessonPlanToUpdate.allCommentsInputs;

                var CommentTAEditedby = LessonPlanToUpdate.allCommentsEditedby;

                var CommentTAEditedbyEmail = LessonPlanToUpdate.allCommentsEditedbyEmails;

                var CommentTABorderColor = LessonPlanToUpdate.allCommentsBorderColor;

                //if edited by has more than one name
                //Only display the first of each above array which belongs to Author's
                //Since commenting is false, Author is allowed to comment on his own lesson plan while others cannot
                if(CommentTAEditedby.length > 1){
                    CommentTAWords = LessonPlanToUpdate.allCommentsInputs[0];
                    CommentTAEditedby = LessonPlanToUpdate.allCommentsEditedby[0];
                    CommentTAEditedbyEmail = LessonPlanToUpdate.allCommentsEditedbyEmails[0];
                    CommentTABorderColor = LessonPlanToUpdate.allCommentsBorderColor[0];
                }

                await LessonPlan.findByIdAndUpdate({ _id: req.params._id}, { headerForNotesName: req.body.headerForNotesName,
                    colorPickerForNote: req.body.colorPickerForNote, goTextArea: req.body.goTextArea, headerForEventName: req.body.headerForEventName, textAreasForEvents: req.body.textAreasForEvents,
                    colorPickerForEvent: req.body.colorPickerForEvent, goDuration: req.body.goDuration, goMinutes: req.body.goMinutes, goTime: req.body.goTime, nameOfLessonPlan: req.body.nameOfLessonPlan,
                    commitMsg: req.body.commitMsg, notesLastModifiedBy: req.body.labelForLastModifiedBy, eventsLastModifiedBy: req.body.labelSetForLastModified, topicOfLesson: req.body.topicOfLessonTb,
                    postLessonSurveyLink: req.body.postLessonSurveyLinkTbb, author: author, authorEmail: authorEmail,
                    theModuleCode: theModuleCode, dateAndTimeCreated: dateAndTimeCreated, lastModified: Date.now(), allCommentsInputs: CommentTAWords, allCommentsEditedby: CommentTAEditedby,
                    allCommentsEditedbyEmails: CommentTAEditedbyEmail, allCommentsBorderColor: CommentTABorderColor, enableComments: req.body.EnableCommentCB, startTime: req.body.startTimeInput }, (err, doc) => {
                    if (!err) {
                        console.log("Updated!")
                        res.redirect(`/home/${moduleThatLessonPlanBelongsTo._id}`);
                    } else {
                        console.log('Error in updating: ' + err)
                    }
                });

            }
    }
    else
    {
        //Front-end radiobutton choose to duplicate lesson plan
        //Save newAvailableLessonPlan object
        newAvailableLessonPlan.save()
        .then(lessonplans => {
            res.redirect(`/home/${moduleThatLessonPlanBelongsTo._id}`);
        });
        console.log("Duplicated")
    }
});

// Lesson plan's first page
router.get('/home', ensureAuthenticated, async (req, res) => {
    const school = req.user.school
    if (req.query.search) {
        // res.send(req.query.search);
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        if (school.toLowerCase() != "all") {
            const allModules = await Subject.find({$and: [{ 'moduleSchool': { '$regex': school }}, { $or: [{ moduleCode: regex }, { moduleName: regex }] }]});
            res.render('main', {
                LoginUser: req.user, name: req.user.name,
                records: allModules, admin: req.user.admin
            });
        } else if (school.toLowerCase() == "all") {
            const allModules = await Subject.find({ $or: [{ moduleCode: regex }, { moduleName: regex }]});
            res.render('main', {
                LoginUser: req.user, name: req.user.name,
                records: allModules, admin: req.user.admin
            });
        }
    } else {
        if (school.toLowerCase() != "all"){
            const allModules = await Subject.find({ 'moduleSchool': { '$regex': school } }).sort({ date: 'desc' });
            res.render('main', {
                LoginUser: req.user,
                name: req.user.name,
                records: allModules, admin: req.user.admin
            });
        } else if (school.toLowerCase() == "all"){
            const allModules = await Subject.find().sort({ date: 'desc' });
            res.render('main', {
                LoginUser: req.user,
                name: req.user.name,
                records: allModules, admin: req.user.admin
            });
        }
        
    }
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// Lesson plan's first page
//Select the Module to delete by its id
router.get('/home/:_id/delete', ensureAuthenticated, (req, res) => {
    Subject.findByIdAndRemove(req.params._id, (err, doc) => {
        if (!err) {
            res.redirect('/home');
        } else {
            console.log('Error in deleting: ' + err)
        }
    });
});

// Lesson plan's second page that displays all lesson plans of specific module
//Select lesson plan to delete from module by id
router.get('/home/module/:_id/delete', ensureAuthenticated, async (req, res) => {
    var idToFindSoCanRedirect = req.params._id;
    const theLessonPlanToDelete = await LessonPlan.findById(idToFindSoCanRedirect);
    const moduleCodeOfLessonPlanToDelete = theLessonPlanToDelete.theModuleCode;
    const theSubjectToRedirect = await Subject.findOne({ moduleCode: moduleCodeOfLessonPlanToDelete });
    LessonPlan.findByIdAndRemove(req.params._id, (err, doc) => {
        if (!err) {
            res.redirect(`/home/${theSubjectToRedirect._id}`);
        } else {
            console.log('Error in deleting: ' + err)
        }
    });
});

//Create New module page
router.get('/home/new-module', ensureAuthenticated, (req, res) => {
    res.render('newModule', { subject: new Subject() });
});

//Saving new module created
router.post('/home/new-module', (req, res) => {
    const { moduleCode, moduleName, moduleSchool } = req.body;
    let errors = [];
    //Validating inputs are all filed and no duplicated module code
    if (!moduleCode || !moduleName || !moduleSchool) {
        errors.push({ msg: 'Please fill in all the fields' });
    }

    if (errors.length > 0) {
        res.render('newModule', { errors, moduleCode, moduleName });
    }
    else {
        Subject.findOne({ moduleCode: moduleCode })
            .then(newModule => {
                if (newModule) {
                    // Module Code already used 
                    errors.push({ msg: 'Module Code already used' });
                    res.render('newModule', {
                        errors,
                        moduleCode,
                        moduleName,
                        moduleSchool
                    });
                }
                else {
                    let strModuleSchool = String(moduleSchool);
                    let cleanedStrModuleSchool = strModuleSchool.replace(/ /g, "");
                    let arrayModuleSchool = cleanedStrModuleSchool.split(",");
                    let newAvailableModule = new Subject({
                        moduleCode,
                        moduleName,
                    });
                    
                    for (i in arrayModuleSchool){
                        newAvailableModule.moduleSchool.push(arrayModuleSchool[i]);
                    }

                    newAvailableModule.save()
                        .then(newModule => {
                            req.flash('success_msg', 'New module created');
                            res.redirect(`/home/${newAvailableModule._id}`);
                        });
                }
            })
    }

});

router.post('/home/:_id', ensureAuthenticated, (req, res) => {
    // res.send(req.body.jsonFileSubmitted);
    console.log(req.body.authorBox)
    console.log(req.body.authorEmailBox)
    console.log(req.body.moduleCodeBox)
    console.log(req.body.dateAndTimeCreatedBox)
    console.log(req.body.notesHeaderBox)
    console.log(req.body.notesColorPickerBox)
    console.log(req.body.notesTextAreaBox)
    console.log(req.body.eventHeaderBox)
    console.log(req.body.eventTextAreaBox)
    console.log(req.body.eventColorPickerBox)
    console.log(req.body.durationBox)
    console.log(req.body.minutesBox)
    console.log(req.body.timeBox)
    console.log(req.body.nameOfLessonPlanBox)
    console.log(req.body.commitMsgBox)
    console.log(req.body.lastModifiedBox);
    console.log(req.body.notesLastModifiedByBox);
    console.log(req.body.eventsLastModifiedByBox);

    const author = req.body.authorBox;
    const authorEmail = req.body.authorEmailBox;
    const theModuleCode = req.body.moduleCodeBox;
    let uploadedLessonPlan = new LessonPlan({
        author,
        authorEmail,
        theModuleCode
    });

    uploadedLessonPlan.dateAndTimeCreated = req.body.dateAndTimeCreatedBox;
    uploadedLessonPlan.headerForNotesName = req.body.notesHeaderBox;
    uploadedLessonPlan.colorPickerForNote = req.body.notesColorPickerBox;
    uploadedLessonPlan.goTextArea = req.body.notesTextAreaBox;
    uploadedLessonPlan.headerForEventName = req.body.eventHeaderBox;
    uploadedLessonPlan.textAreasForEvents = req.body.eventTextAreaBox;
    uploadedLessonPlan.colorPickerForEvent = req.body.eventColorPickerBox;
    uploadedLessonPlan.goDuration = req.body.durationBox;
    uploadedLessonPlan.goMinutes = req.body.minutesBox;
    uploadedLessonPlan.goTime = req.body.timeBox;
    uploadedLessonPlan.nameOfLessonPlan = req.body.nameOfLessonPlanBox;
    uploadedLessonPlan.commitMsg = req.body.commitMsgBox;
    uploadedLessonPlan.lastModified = req.body.lastModifiedBox;
    uploadedLessonPlan.notesLastModifiedBy = req.body.notesLastModifiedByBox;
    uploadedLessonPlan.eventsLastModifiedBy = req.body.eventsLastModifiedByBox;
    uploadedLessonPlan.save()
    .then(uploadedlessonplans => {
        req.flash('success_msg', 'Successfully uploaded lesson plan');
        res.redirect(`/home/${req.params._id}`);
    });
});

// Lesson plan's second page that displays all lesson plans of specific module
router.get('/home/:_id', ensureAuthenticated, async (req, res) => {
    if (req.query.search) {
        // res.send(req.query.search);
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        var idToParseIn = req.params._id;
        const thatSpecificModule = await Subject.findById(idToParseIn);
        const lessonPlansInThatModule = await LessonPlan.find({$and:[{theModuleCode: thatSpecificModule.moduleCode},{nameOfLessonPlan: regex}]});
        console.log(lessonPlansInThatModule)
        // var idToFind = req.params._id;
        // const thatSpecificModule = await Subject.findById(idToFind);
        // // console.log(thatSpecificModule);
        // // const lessonPlansInThatModule = await LessonPlan.find({ "theModuleCode": thatSpecificModule.moduleCode });
        // const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // const lessonPlansInThatModule = await LessonPlan.find({$or:[{theModuleCode: thatSpecificModule.moduleCode},{nameOfLessonPlan: regex}]});
        // to do: Check on author for lesson plans and hide delete button
        res.render('showModule', { LoginUser: req.user, name: req.user.name, thatModule: thatSpecificModule, thatLessonPlan: lessonPlansInThatModule, LoginUserEmail: req.user.email });
    } else {
        // res.send(req.params._id);
        var idToFind = req.params._id;
        const thatSpecificModule = await Subject.findById(idToFind);
        // console.log(thatSpecificModule);
        const lessonPlansInThatModule = await LessonPlan.find({ "theModuleCode": thatSpecificModule.moduleCode });
        res.render('showModule', { LoginUser: req.user, name: req.user.name, thatModule: thatSpecificModule, thatLessonPlan: lessonPlansInThatModule, LoginUserEmail: req.user.email });
    }
});

//Edit module page
router.get('/home/:_id/edit', ensureAuthenticated, async (req, res) => {
    var idToSearchSoCanEdit = req.params._id;
    const thatParticularModule = await Subject.findById(idToSearchSoCanEdit);
    res.render('editModule', { particularModule: thatParticularModule });
});

//Edit module page
//Saving the updated module
router.post('/home/:_id/edit', ensureAuthenticated, async (req, res) => {
    var idToSearchForEdit = req.params._id;
    const thatParticularModule = await Subject.findById(idToSearchForEdit);
    const previousModuleCode = thatParticularModule.moduleCode;
    const lessonplanInTheModuleCode = await LessonPlan.find({ "theModuleCode": previousModuleCode });
    const { moduleCode, moduleName } = req.body;
    // console.log("Module Code is " + moduleCode + ", Module Name is " + moduleName);
    let errors = [];

    // Check required fields
    if (!moduleCode || !moduleName) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    if (errors.length > 0) {
        res.render('editModule', { errors, moduleCode, moduleName, particularModule: thatParticularModule });
    } else {
        // Validation passed
        // res.send(req.body);
        // Check if it equals to the previous module text box
        if (moduleCode == previousModuleCode) {
            // Means user is not updating module code field, only module name field
            Subject.findByIdAndUpdate(req.params._id, { $set: { moduleName: moduleName } }, (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log(result)
                }
            });
            res.redirect('/home');
        } else {
            // Check againist other data in database
            Subject.findOne({ moduleCode: moduleCode })
                .then(thatSubject => {
                    if (thatSubject) {
                        // module code used before
                        errors.push({ msg: 'Module Code is already used' });
                        res.render('editModule', { errors, moduleCode, moduleName, particularModule: thatParticularModule });
                    } else {
                        // res.send(req.body);
                        Subject.findByIdAndUpdate(req.params._id, { $set: { moduleCode: moduleCode, moduleName: moduleName } }, (err, result) => {
                            if (err) {
                                console.log(err)
                            } else {
                                console.log(result)
                                console.log(result.moduleCode)
                            }
                        });

                        const noOfLessonPlanInTheModuleCode = lessonplanInTheModuleCode.length;
                        console.log("Number of lesson plans inside this module " + noOfLessonPlanInTheModuleCode)
                        for (var i = noOfLessonPlanInTheModuleCode; i > 0; i--) {
                            LessonPlan.findOneAndUpdate({ theModuleCode: previousModuleCode }, { theModuleCode: moduleCode }, (err, result) => {
                                if (err) {
                                    console.log(err)
                                } else {
                                    console.log(result)
                                }
                            });
                        }

                        res.redirect('/home');
                    }
                });
        }
    }
});

//At read cards page
//Read cards, post-lesson survey links, comments
router.get('/home/module/:_id/showcards', ensureAuthenticated, async (req, res) => {
    var idOfLessonPlan = req.params._id;
    const lessonplanToShow = await LessonPlan.findById(idOfLessonPlan);
    const lessonPlanModule = await Subject.find({ "moduleCode": lessonplanToShow.theModuleCode });

    res.render('showcards', { LoginUser: req.user, name: req.user.name, email: req.user.email, theLessonPlanToDisplay: lessonplanToShow, moduleOfLessonPlan: lessonPlanModule });
});

//At lesson plan's PDF generation page
router.get('/home/module/:_id/generatePDF', ensureAuthenticated, async (req, res) => {
    var idOfLessonPlan = req.params._id;
    const lessonplanToShow = await LessonPlan.findById(idOfLessonPlan);
    const lessonPlanModule = await Subject.find({ "moduleCode": lessonplanToShow.theModuleCode });

    res.render('generatePDF', { LoginUser: req.user, name: req.user.name, email: req.user.email, theLessonPlanToDisplay: lessonplanToShow, moduleOfLessonPlan: lessonPlanModule });
});

//At lesson plan's PDF generation page
//Generate lesson plan in pdf
router.post('/home/module/:_id/generatePDF/pdflessonplan', ensureAuthenticated, async (req, res) => {
    var idOfLessonPlan = req.params._id;
    const lessonplanToShow = await LessonPlan.findById(idOfLessonPlan);

    const browser = await puppeteer.launch({
        headless: true
        // slowMo: 250
    });
    const page = await browser.newPage();

    var theHTMLString = '<!DOCTYPE html><html>'
    + '<head>'
    + '<script src="https://cdn.tiny.cloud/1/s10q09jxylitz9oiyw1l72vaooxgiiygcnpr4kwryw6uemns/tinymce/5/tinymce.min.js" referrerpolicy="origin"></script>'
    + '<script src="https://code.jquery.com/jquery-3.5.0.min.js"></script>'
    + '<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.3/css/all.css" integrity="sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/" crossorigin="anonymous">'
    + '<link rel="stylesheet" href="https://bootswatch.com/4/journal/bootstrap.min.css">'
    + '<style>'
    + '@page  {margin: 0;size: letter;}'
    + 'html {-webkit-print-color-adjust: exact;}'
    + '.timeline-article .meta-date .date {font-size: 21px;line-height: 20px;}'
    + '.timeline-article .meta-date {position: absolute;top: 0;left: 48.25%;width: 95px;height: 62px;margin-left: -31px;color: #fff;border-radius: 15px;background: #00b0bd;}'
    + '#conference-timeline {position: relative;max-width: 920px;width: 100%;margin: 0 auto;margin-top: 50px;margin-bottom: 50px;}'
    + '#conference-timeline .timeline-start,#conference-timeline .timeline-end {display: table;font-family: "Roboto", sans-serif;font-size: 18px;font-weight: 900;text-transform: uppercase;background: #00b0bd;padding: 15px 23px;color: #fff;max-width: 5%;width: 100%;text-align: center;margin: 0 auto;}'
    + '#conference-timeline .conference-center-line {position: absolute;width: 3px;height: 100%;top: 0;left: 50%;margin-left: -2px;background: #00b0bd;z-index: -1;}'
    + '#conference-timeline .conference-timeline-content {padding-top: 67px}'
    + '.timeline-article {width: 100%;height: 100%;position: relative;overflow: hidden;margin: 20px 0;}'
    + '.timeline-article .content-left-container,.timeline-article .content-right-container {max-width: 44%;width: 100%;}'
    + '.timeline-article .timeline-author {display: block;font-weight: 400;font-size: 14px;line-height: 24px;color: #242424;text-align: right;}'
    + '.timeline-article .content-left,.timeline-article .content-right {position: relative;width: auto;border: 1px solid #ddd;background-color: #fff;box-shadow: 0 1px 3px rgba(0, 0, 0, .03);padding: 27px 25px;}'
    + '.timeline-article p {margin: 0 0 0 60px;padding: 0;font-weight: 400;color: #242424;font-size: 14px;line-height: 24px;position: relative;}'
    + '.timeline-article p span.article-number {position: absolute;font-weight: 300;font-size: 44px;top: 10px;left: -60px;color: #00b0bd;}'
    + '.timeline-article .content-left-container {float: left;}'
    + '.timeline-article .content-right-container {float: right;}'
    + '.timeline-article .content-left:before,.timeline-article .content-right:before {position: absolute;top: 20px;font-size: 23px;font-family: "FontAwesome";color: #fff;}'
    + '.timeline-article .content-left:before {right: -8px;}'
    + '.timeline-article .content-right:before {left: -8px;}'
    + '.timeline-article .meta-date {position: absolute;top: 0;left: 48.5%;width: 90px;height: 62px;margin-left: -31px;color: #fff;border-radius: 25px;background: #00b0bd;}'
    + '.timeline-article .meta-date .date,.timeline-article .meta-date .month {display: block;text-align: center;font-weight: 900;padding-top: 20px;}'
    + '.timeline-article .meta-date .date {font-size: 20px;}'
    + '.timeline-article .meta-date .month {font-size: 12px;line-height: 10px;}'
    + '@media only screen and (max-width: 830px) {#conference-timeline .timeline-start,#conference-timeline .timeline-end {margin: 0;}'
    + '#conference-timeline .conference-center-line {margin-left: 0;left: 50px;}'
    + '.timeline-article .meta-date {margin-left: 0;left: 20px;}'
    + '.timeline-article .content-left-container,.timeline-article .content-right-container {max-width: 100%;width: auto;float: none;margin-left: 110px;min-height: 53px;}'
    + '.timeline-article .content-left-container {margin-bottom: 20px;}'
    + '.timeline-article .content-left,.timeline-article .content-right {padding: 10px 25px;min-height: 65px;}'
    + '.timeline-article .content-left:before {content: "\f0d9";right: auto;left: -8px;}'
    + '.timeline-article .content-right:before {display: none;}}'
    + '@media only screen and (max-width: 400px) {.timeline-article p {margin: 0;}'
    + '.timeline-article p span.article-number {display: none;}}'
    + '</style>'
    + '</head>'
    + '<body>'
    + '<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>'
    + '<p style="text-decoration: underline; text-align:center; font-size: 130px;">Lesson Plan</p>'
    + '<table style="margin-left: auto;margin-right: auto;width: 60%; font-size: 33px">'
    + '<tr>'
    + '<td style="font-weight: bold;">Module Code: </td>'
    + '<td>' + lessonplanToShow.theModuleCode + '</td>'
    + '</tr>'
    + '<tr>'
    + '<td style="font-weight: bold;">Name of Lesson Plan: </td>'
    + '<td>' + lessonplanToShow.nameOfLessonPlan[0] + '</td>'
    + '</tr>'
    + '<tr>'
    + '<td style="font-weight: bold;">Topic of Lesson Plan: </td>'
    + '<td>' + lessonplanToShow.topicOfLesson[0] + '</td>'
    + '</tr>'
    + '<tr>'
    + '<td style="font-weight: bold;">Commit Message: </td>'
    + '<td>' + lessonplanToShow.commitMsg[0] + '</td>'
    + '</tr>'
    + '<tr><td colspan="2">&nbsp;<td></tr>'
    + '<tr>'
    + '<td colspan="2">'
    + '<h1 style="text-align:center">LXD Timeline</h1>'
    + '</td>'
    + '</tr>'
    + '</table>'
    + '<p style="page-break-before: always">&nbsp;</p>'
    + '<br/>';
    // + '<h1 style="text-align:center">LXD Timeline</h1>';

    var theContentString;
    theContentString = '<section id="conference-timeline">'
    + '<div class="timeline-start">'
    + '<label>Start Time:</label>'
    + '<br />'
    + '<input name="startTimeInput" id="startTimeInput" type="time" value="' + lessonplanToShow.startTime[0] + '" readonly />'
    + '</div>'
    + '<div class="conference-center-line"></div>'
    + '<div class="conference-timeline-content" id="containerBox">'
    var timingIndex = -1;
    var endTime;
    var previousStartTime;
    var circleTiming;
    var NumtoPageBreak = 0;

    for(x = 0; x < lessonplanToShow.headerForEventName.length; x+=2){
        timingIndex++;
        if(x == 0){
            circleTiming = lessonplanToShow.startTime[0];
            previousStartTime = circleTiming;
            theContentString += "<br/><br/>"
        }
            var previousgoDuration = lessonplanToShow.goDuration[timingIndex];
            var previousgoMinutes = lessonplanToShow.goMinutes[timingIndex];

            if(previousStartTime != '' && previousgoDuration != '' && previousgoMinutes != ''){
                if(x != 0){
                    circleTiming = theHour + ":" + theMin;
                }
                var strTime = previousStartTime.split(":");
                var theHour = parseInt(strTime[0]);
                var theMin = parseInt(strTime[1]);

                theMin += parseInt(previousgoMinutes);
                var NumberOfHoursIntheMinutes = Math.floor((theMin/60));
                theMin -= (NumberOfHoursIntheMinutes * 60);

                theHour += NumberOfHoursIntheMinutes + parseInt(previousgoDuration);

                if(theHour >= 24){
                    theHour -= 24;
                }

                if(theHour < 10){
                    theHour = "0" + theHour;
                }
                
                if(theMin < 10){
                    theMin = "0" + theMin;
                }

                // var theendTime = $('.endTime').eq(0);
                // theendTime.html(theHour + ":" + theMin);
                endTime = theHour + ":" + theMin;
                previousStartTime = endTime;
           }
        // console.log(circleTiming)
        theContentString += '<div class="timeline-article">'
        + '<div class="content-left-container">'
        + '<div class="content-left" style="background-color:' + lessonplanToShow.colorPickerForEvent[x] + '">'
        + '<input name="headerForEventName" class="headerForEvent" value=' + lessonplanToShow.headerForEventName[x] + '>'
        + '<textarea contenteditable="true" style="height: 400px" name="textAreasForEvents" readonly>' + lessonplanToShow.textAreasForEvents[x] + '</textarea>'
        + '<input type="color" name="colorPickerForEvent" value="' + lessonplanToShow.colorPickerForEvent[x] + '" />'
        + '<label style="font-size: small;">Last Modified By:</label>'
        + '<input readonly class="labelSetForLastModified" name="labelSetForLastModified" value="' + lessonplanToShow.eventsLastModifiedBy[x] + '">'
        + '</div>'
        + '<label>Duration:</label><br />'
        + '<input type="number" name="goDuration" style="width: 50px" min="0" max="23" value="' + lessonplanToShow.goDuration[timingIndex] + '" />&nbsp<label>hour(s)</label>&nbsp<input type="number" name="goMinutes" style="width: 50px" min="0" max="59" value="' + lessonplanToShow.goMinutes[timingIndex] + '" />&nbsp<label>minute(s)</label>'
        + '<br />'
        + '</div>'
        //right-content
        + '<div class="content-right-container">'
        + '<div class="content-right" style="background-color: ' +  lessonplanToShow.colorPickerForEvent[(x + 1)] + '">'
        + '<input readonly name="headerForEventName" class="headerForEvent" value="' + lessonplanToShow.headerForEventName[(x + 1)] + '">'
        + '<textarea readonly style="height: 400px" name="textAreasForEvents">' + lessonplanToShow.textAreasForEvents[(x + 1)] + '</textarea>'
        + '<input type="color" name="colorPickerForEvent" value="' + lessonplanToShow.colorPickerForEvent[(x + 1)] + '" />'
        + '<label style="font-size: small;">Last Modified By:</label>'
        + '<input readonly class="labelSetForLastModified" name="labelSetForLastModified" value="' + lessonplanToShow.eventsLastModifiedBy[(x + 1)] + '">'
        + '</div>'
        + '</div>'
        //after right-content
        + '<div class="meta-date">'
        + '<span class="date">' + circleTiming + '</span>'
        // + '<input name="middleTimeHidden" value="00:00" hidden/>'
        + '</div>'
        // + '<input type="checkbox" name="myCheckEvent" style="width: 18px; height: 18px; margin-top: 100px; margin-left: 45px;">'
        + '<button type="button" name="goRemoveEvents" class="btn clever-btn btn-2" style="display: block; margin-left: auto; margin-right: auto; margin-bottom: 50px; margin-top: 200px; cursor: not-allowed"><i class="fa fa-trash" style="font-size: 18px;"></i></button>'
        + '<input disabled readonly type="button" value="+" class="btn clever-btn btn-2" name="goButton" style="display: block; margin:auto; max-width: 300px; margin-top: 150px; background: #00b0bd; color: rgba(0, 0, 0, 0.50); font-size: xx-large; cursor: not-allowed;" />'
        + '</div>';


        if(x == 0 && lessonplanToShow.headerForEventName.length != 2){
            theContentString += '<p style="page-break-before: always">&nbsp;</p>';
        }
        else{
            NumtoPageBreak += 2;
        }
        if((NumtoPageBreak % 4) == 0 && x != 0){
            theContentString += '<p style="page-break-before: always">&nbsp;</p>';
        }
    }


    theContentString += '<br/><br/></div>'
    + '<div class="timeline-end">End Time'
    + '<input class="endTime" type="time" value="' + endTime + '" readonly />'
    + '</div>'
    + '</section>'
    // theContentString = theContentString.replace('undefined','')


    var EndHtmlTagString = '<script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossorigin="anonymous"></script>'
    + '<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>'
    + '<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6" crossorigin="anonymous"></script>'
    + '<script>tinymce.init({selector: "textarea:not(.commentsInput)", readonly: 1, content_css: "//www.tiny.cloud/css/codepen.min.css", plugins: "print preview searchreplace autolink autosave save directionality visualblocks visualchars fullscreen image link media template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists wordcount imagetools textpattern noneditable help charmap emoticons", toolbar: "undo redo | bold italic underline strikethrough | fontselect fontsizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample | a11ycheck ltr rtl | showcomments addcomment", image_title: true, automatic_uploads: true, file_picker_types: "image", file_picker_callback: function (cb, value, meta) {var input = document.createElement("input"); input.setAttribute("type", "file"); input.setAttribute("accept", "image/*"); input.onchange = function () { var file = this.files[0]; var reader = new FileReader(); reader.onload = function () { var id = "blobid" + (new Date()).getTime(); var blobCache = tinymce.activeEditor.editorUpload.blobCache; var base64 = reader.result.split(",")[1]; var blobInfo = blobCache.create(id, file, base64); blobCache.add(blobInfo); cb(blobInfo.blobUri(), { title: file.name }); }; reader.readAsDataURL(file); }; input.click();}});</script>'
    + '</body></html>';


    var FullHTMLString = theHTMLString + theContentString + EndHtmlTagString;
    await page.setContent(FullHTMLString);

    // const pdfDoc = await page.pdf({path: 'hn.pdf', format: 'A4'});
    const pdfDoc = await page.pdf();
    
    await browser.close();
    res.writeHead(200, 
        {
            'Content-Type': 'application/pdf',
            'Content-Disposition':'attachment;filename="LXD_Timeline.pdf"'
        });
    res.end(pdfDoc);
    });


//At lesson plan's PDF generation page
//Generate cards in pdf
router.post('/home/module/:_id/generatePDF/pdfcards', ensureAuthenticated, async (req, res) => {
    var idOfLessonPlan = req.params._id;
    const lessonplanToShow = await LessonPlan.findById(idOfLessonPlan);

    const browser = await puppeteer.launch({
        headless: true
        // slowMo: 250
    });
    const page = await browser.newPage();

    var theHTMLString = '<!DOCTYPE html><html>'
    + '<head>'
    + '<script src="https://cdn.tiny.cloud/1/s10q09jxylitz9oiyw1l72vaooxgiiygcnpr4kwryw6uemns/tinymce/5/tinymce.min.js" referrerpolicy="origin"></script>'
    + '<script src="https://code.jquery.com/jquery-3.5.0.min.js"></script>'
    + '<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.3/css/all.css" integrity="sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/" crossorigin="anonymous">'
    + '<link rel="stylesheet" href="https://bootswatch.com/4/journal/bootstrap.min.css">'
    + '<style>'
    + '@page  {margin: 0;size: letter;}'
    + 'html {-webkit-print-color-adjust: exact;}'
    + '.labelForLastModifiedBy {height: 40px; width: 250px}'
    + '</style>'
    + '</head>'
    + '<body>'
    + '<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>'
    + '<p style="text-decoration: underline; text-align:center; font-size: 130px;">Lesson Plan</p>'
    + '<table style="margin-left: auto;margin-right: auto;width: 60%; font-size: 33px">'
    + '<tr>'
    + '<td style="font-weight: bold;">Module Code: </td>'
    + '<td>' + lessonplanToShow.theModuleCode + '</td>'
    + '</tr>'
    + '<tr>'
    + '<td style="font-weight: bold;">Name of Lesson Plan: </td>'
    + '<td>' + lessonplanToShow.nameOfLessonPlan[0] + '</td>'
    + '</tr>'
    + '<tr>'
    + '<td style="font-weight: bold;">Topic of Lesson Plan: </td>'
    + '<td>' + lessonplanToShow.topicOfLesson[0] + '</td>'
    + '</tr>'
    + '<tr>'
    + '<td style="font-weight: bold;">Commit Message: </td>'
    + '<td>' + lessonplanToShow.commitMsg[0] + '</td>'
    + '</tr>'
    + '<tr><td colspan="2">&nbsp;<td></tr>'
    + '<tr>'
    + '<td colspan="2">'
    + '<h1 style="text-align:center">LXD Notes</h1>'
    + '</td>'
    + '</tr>'
    + '</table>'
    + '<p style="page-break-before: always">&nbsp;</p>'
    + '<br/>';
    // + '<h1 style="text-align:center">LXD Notes</h1>';

    var theContentString;

    for(x = 0; x < lessonplanToShow.headerForNotesName.length; x++){
        theContentString += '<div style="border:1px solid transparent; background-color:' + lessonplanToShow.colorPickerForNote[x] + '; margin-left:50px; float:left; width:430px; margin-top: 60px">'
        + '<input value="' + lessonplanToShow.headerForNotesName[x] + '" style="margin-left:20px; width:250px; height:60px;">'
        + '&nbsp;'
        + '<input type="color" value="' + lessonplanToShow.colorPickerForNote[x] + '" style="color:' + lessonplanToShow.colorPickerForNote[x] + ';">'
        + '&nbsp;'
        + '<button class="btn btn-danger mt-2"> Delete</button>'
        + '<br/>'
        + '<textarea style="height:300px" readonly>' + lessonplanToShow.goTextArea[x] + '</textarea>'
        + '<br/>'
        + '&nbsp;&nbsp;<label style="font-size: large;">Last Modified By:</label>&nbsp;&nbsp;'
        + '<input readonly class="labelForLastModifiedBy" value="' + lessonplanToShow.notesLastModifiedBy[x] + '">'
        + '</div>';

        if(((x + 1) % 4) == 0 && (x + 1) != lessonplanToShow.headerForNotesName.length){
            theContentString += '<p style="page-break-before: always">&nbsp;</p>';
        }
    }
    theContentString = theContentString.replace('undefined','')

    var EndHtmlTagString = '<script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossorigin="anonymous"></script>'
    + '<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>'
    + '<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6" crossorigin="anonymous"></script>'
    + '<script>tinymce.init({selector: "textarea:not(.commentsInput)", readonly: 1, content_css: "//www.tiny.cloud/css/codepen.min.css", plugins: "print preview searchreplace autolink autosave save directionality visualblocks visualchars fullscreen image link media template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists wordcount imagetools textpattern noneditable help charmap emoticons", toolbar: "undo redo | bold italic underline strikethrough | fontselect fontsizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample | a11ycheck ltr rtl | showcomments addcomment", image_title: true, automatic_uploads: true, file_picker_types: "image", file_picker_callback: function (cb, value, meta) {var input = document.createElement("input"); input.setAttribute("type", "file"); input.setAttribute("accept", "image/*"); input.onchange = function () { var file = this.files[0]; var reader = new FileReader(); reader.onload = function () { var id = "blobid" + (new Date()).getTime(); var blobCache = tinymce.activeEditor.editorUpload.blobCache; var base64 = reader.result.split(",")[1]; var blobInfo = blobCache.create(id, file, base64); blobCache.add(blobInfo); cb(blobInfo.blobUri(), { title: file.name }); }; reader.readAsDataURL(file); }; input.click();}});</script>'
    + '</body></html>';


    var FullHTMLString = theHTMLString + theContentString + EndHtmlTagString;

    await page.setContent(FullHTMLString);
    const pdfDoc = await page.pdf();
    
    await browser.close();
    res.writeHead(200, 
        {
            'Content-Type': 'application/pdf',
            'Content-Disposition':'attachment;filename="LXD_Notes.pdf"'
        });
    res.end(pdfDoc);

});

//Playbook page that serves as an explanation page
router.get('/playbook', ensureAuthenticated, async (req, res) => {
    res.render('playbook', {LoginUser: req.user, name: req.user.name});
});

//Playbook page that serves as an explanation page
router.get('/annex_EETL', ensureAuthenticated, async (req, res) => {
    res.render('annexEETL', { LoginUser: req.user, name: req.user.name});
});

//Playbook page that serves as an explanation page
router.get('/annex_glossary', ensureAuthenticated, async (req, res) => {
    res.render('annexGlossary', { LoginUser: req.user, name: req.user.name});
});

//Playbook page that serves as an explanation page
router.get('/annex_micro_strat', ensureAuthenticated, async (req, res) => {
    res.render('annexMS', { LoginUser: req.user, name: req.user.name});
});

//Experience page that displays all resources
router.get('/experience', ensureAuthenticated, async (req, res) => {
    const AllResource = await Resource.find({ });

    res.render('experience', { LoginUser: req.user, name: req.user.name, TheResources: AllResource });
});

//Create new resource page
router.get('/experience/createNewResource', ensureAuthenticated, async (req, res) => {
    res.render('createNewResource', { LoginUser: req.user, name: req.user.name } );
});

//Create new resource page
//Saving new resource into database
router.post('/experience/createNewResource', ensureAuthenticated, async (req, res) => {
    let addNewResource = new Resource();

    addNewResource.title = req.body.titleOfResourceTb;
    addNewResource.category = req.body.categoryOfResourceTb;
    addNewResource.author = req.user.name;
    addNewResource.authorEmail = req.user.email;
    addNewResource.lastModified = Date.now();

    addNewResource.headerForNotesName = req.body.headerForNotesName;
    addNewResource.colorPickerForNote = req.body.colorPickerForNote;
    addNewResource.goTextArea = req.body.goTextArea;
    addNewResource.headerForEventName = req.body.headerForEventName;
    addNewResource.textAreasForEvents = req.body.textAreasForEvents;
    addNewResource.colorPickerForEvent = req.body.colorPickerForEvent;
    addNewResource.goDuration = req.body.goDuration;
    addNewResource.goMinutes = req.body.goMinutes;
    addNewResource.goTime = req.body.goTime;
    addNewResource.notesLastModifiedBy = req.body.labelForLastModifiedBy;
    addNewResource.eventsLastModifiedBy = req.body.labelSetForLastModified;
    addNewResource.startTime = req.body.startTimeInput;

    addNewResource.save()
    .then(addNewResource => {
        req.flash('success_msg', 'Successfully added new resource');
        res.redirect(`/experience`);
    });
});

//Experience page that displays all resources
//Removes resource by id
router.get('/experience/:_id/delete', ensureAuthenticated, (req, res) => {
    Resource.findByIdAndRemove(req.params._id, (err, doc) => {
        if (!err) {
            req.flash('success_msg', 'Successfully deleted the resource');
            res.redirect('/experience');
        } else {
            console.log('Error in deleting: ' + err)
        }
    });
});

//Read resource LXD Timeline
router.get('/experience/readResource/:_id', ensureAuthenticated, async (req, res) => {
    const thatSpecificResource = await Resource.findById(req.params._id);

    res.render('readResource', { LoginUser: req.user, name: req.user.name, email: req.user.email, TheSelectedResource: thatSpecificResource } );
});

//Read resource LXD Cards
router.get('/experience/readResource/:_id/readResourceCards', ensureAuthenticated, async (req, res) => {
    const thatSpecificResource = await Resource.findById(req.params._id);

    res.render('readResourceCards', { LoginUser: req.user, name: req.user.name, email: req.user.email, TheSelectedResource: thatSpecificResource } );
});

//Edit resource LXD Cards & LXD Timeline page
router.get('/experience/readResource/:_id/edit', ensureAuthenticated, async (req, res) => {
    const thatSpecificResource = await Resource.findById(req.params._id);

    res.render('editResource', { LoginUser: req.user, name: req.user.name, email: req.user.email, TheSelectedResource: thatSpecificResource } );
});

//Edit resource LXD Cards & LXD Timeline page
//Saving the newly updated resource LXD Cards & LXD Timeline
router.post('/experience/readResource/:_id/edit', ensureAuthenticated, async (req, res) => {
    // Author and Author Email from req.user
    var author = req.user.name;
    var authorEmail = req.user.email;
    console.log(author)
    console.log(authorEmail)

    var idToFindHere = req.params._id;
    const theCurrentResource = await Resource.findById(idToFindHere);
    const dateAndTimeCreated = theCurrentResource.dateAndTimeCreated;
    
    // Save in database
    let newAvailableResource = new Resource({
        author,
        authorEmail,
    });
    
    newAvailableResource.dateAndTimeCreated = dateAndTimeCreated;
    newAvailableResource.headerForNotesName = req.body.headerForNotesName;
    newAvailableResource.colorPickerForNote = req.body.colorPickerForNote;
    newAvailableResource.goTextArea = req.body.goTextArea;
    newAvailableResource.headerForEventName = req.body.headerForEventName;
    newAvailableResource.textAreasForEvents = req.body.textAreasForEvents;
    newAvailableResource.colorPickerForEvent = req.body.colorPickerForEvent;
    newAvailableResource.goDuration = req.body.goDuration;
    newAvailableResource.goMinutes = req.body.goMinutes;
    newAvailableResource.goTime = req.body.goTime;
    newAvailableResource.notesLastModifiedBy = req.body.labelForLastModifiedBy;
    newAvailableResource.eventsLastModifiedBy = req.body.labelSetForLastModified;
    newAvailableResource.lastModified = Date.now();
    newAvailableResource.title = req.body.titleOfResourceTb;
    newAvailableResource.category = req.body.categoryOfResourceTb;
    newAvailableResource.startTime = req.body.startTimeInput;

    //Front-end radiobutton choose to update resource
    if(req.body.inlineRadioOptions == 'UpdatedLessonPlan')
    {
        await Resource.findByIdAndUpdate({ _id: req.params._id}, { headerForNotesName: req.body.headerForNotesName,
                    colorPickerForNote: req.body.colorPickerForNote, goTextArea: req.body.goTextArea, headerForEventName: req.body.headerForEventName, textAreasForEvents: req.body.textAreasForEvents,
                    colorPickerForEvent: req.body.colorPickerForEvent, goDuration: req.body.goDuration, goMinutes: req.body.goMinutes, goTime: req.body.goTime,
                    notesLastModifiedBy: req.body.labelForLastModifiedBy, eventsLastModifiedBy: req.body.labelSetForLastModified,
                    author: author, authorEmail: authorEmail, title: req.body.titleOfResourceTb, category: req.body.categoryOfResourceTb,
                    dateAndTimeCreated: dateAndTimeCreated, lastModified: Date.now(), startTime: req.body.startTimeInput }, (err, doc) => {
                    if (!err) {
                        console.log("Updated!")
                        req.flash('success_msg', 'Successfully updated the resource');
                        res.redirect(`/experience`);
                    } else {
                        console.log('Error in updating: ' + err)
                    }
                });
    }
    else
    {
        //Front-end radiobutton choose to duplicate resource
        newAvailableResource.save()
        .then(newAvailableResource => {
        req.flash('success_msg', 'Successfully duplicated the resource');
        res.redirect(`/experience`);
    });
        console.log("Duplicated")
    }
});

//At resource's PDF generation page
router.get('/experience/readResource/:_id/generateResourcePDF', ensureAuthenticated, async (req, res) => {
    const thatSpecificResource = await Resource.findById(req.params._id);

    res.render('generateResourcePDF', { LoginUser: req.user, name: req.user.name, email: req.user.email, TheSelectedResource: thatSpecificResource } );
});

//At resource's PDF generation page
//Generate lesson plan in pdf
router.post('/experience/readResource/:_id/generateResourcePDF/pdflessonplan', ensureAuthenticated, async (req, res) => {
    var idOfResource = req.params._id;
    const ResourceToShow = await Resource.findById(idOfResource);

    const browser = await puppeteer.launch({
        headless: true
        // slowMo: 250
    });
    const page = await browser.newPage();

    var theHTMLString = '<!DOCTYPE html><html>'
    + '<head>'
    + '<script src="https://cdn.tiny.cloud/1/s10q09jxylitz9oiyw1l72vaooxgiiygcnpr4kwryw6uemns/tinymce/5/tinymce.min.js" referrerpolicy="origin"></script>'
    + '<script src="https://code.jquery.com/jquery-3.5.0.min.js"></script>'
    + '<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.3/css/all.css" integrity="sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/" crossorigin="anonymous">'
    + '<link rel="stylesheet" href="https://bootswatch.com/4/journal/bootstrap.min.css">'
    + '<style>'
    + '@page  {margin: 0;size: letter;}'
    + 'html {-webkit-print-color-adjust: exact;}'
    + '.timeline-article .meta-date .date {font-size: 21px;line-height: 20px;}'
    + '.timeline-article .meta-date {position: absolute;top: 0;left: 48.25%;width: 95px;height: 62px;margin-left: -31px;color: #fff;border-radius: 15px;background: #00b0bd;}'
    + '#conference-timeline {position: relative;max-width: 920px;width: 100%;margin: 0 auto;margin-top: 50px;margin-bottom: 50px;}'
    + '#conference-timeline .timeline-start,#conference-timeline .timeline-end {display: table;font-family: "Roboto", sans-serif;font-size: 18px;font-weight: 900;text-transform: uppercase;background: #00b0bd;padding: 15px 23px;color: #fff;max-width: 5%;width: 100%;text-align: center;margin: 0 auto;}'
    + '#conference-timeline .conference-center-line {position: absolute;width: 3px;height: 100%;top: 0;left: 50%;margin-left: -2px;background: #00b0bd;z-index: -1;}'
    + '#conference-timeline .conference-timeline-content {padding-top: 67px}'
    + '.timeline-article {width: 100%;height: 100%;position: relative;overflow: hidden;margin: 20px 0;}'
    + '.timeline-article .content-left-container,.timeline-article .content-right-container {max-width: 44%;width: 100%;}'
    + '.timeline-article .timeline-author {display: block;font-weight: 400;font-size: 14px;line-height: 24px;color: #242424;text-align: right;}'
    + '.timeline-article .content-left,.timeline-article .content-right {position: relative;width: auto;border: 1px solid #ddd;background-color: #fff;box-shadow: 0 1px 3px rgba(0, 0, 0, .03);padding: 27px 25px;}'
    + '.timeline-article p {margin: 0 0 0 60px;padding: 0;font-weight: 400;color: #242424;font-size: 14px;line-height: 24px;position: relative;}'
    + '.timeline-article p span.article-number {position: absolute;font-weight: 300;font-size: 44px;top: 10px;left: -60px;color: #00b0bd;}'
    + '.timeline-article .content-left-container {float: left;}'
    + '.timeline-article .content-right-container {float: right;}'
    + '.timeline-article .content-left:before,.timeline-article .content-right:before {position: absolute;top: 20px;font-size: 23px;font-family: "FontAwesome";color: #fff;}'
    + '.timeline-article .content-left:before {right: -8px;}'
    + '.timeline-article .content-right:before {left: -8px;}'
    + '.timeline-article .meta-date {position: absolute;top: 0;left: 48.5%;width: 90px;height: 62px;margin-left: -31px;color: #fff;border-radius: 25px;background: #00b0bd;}'
    + '.timeline-article .meta-date .date,.timeline-article .meta-date .month {display: block;text-align: center;font-weight: 900;padding-top: 20px;}'
    + '.timeline-article .meta-date .date {font-size: 20px;}'
    + '.timeline-article .meta-date .month {font-size: 12px;line-height: 10px;}'
    + '@media only screen and (max-width: 830px) {#conference-timeline .timeline-start,#conference-timeline .timeline-end {margin: 0;}'
    + '#conference-timeline .conference-center-line {margin-left: 0;left: 50px;}'
    + '.timeline-article .meta-date {margin-left: 0;left: 20px;}'
    + '.timeline-article .content-left-container,.timeline-article .content-right-container {max-width: 100%;width: auto;float: none;margin-left: 110px;min-height: 53px;}'
    + '.timeline-article .content-left-container {margin-bottom: 20px;}'
    + '.timeline-article .content-left,.timeline-article .content-right {padding: 10px 25px;min-height: 65px;}'
    + '.timeline-article .content-left:before {content: "\f0d9";right: auto;left: -8px;}'
    + '.timeline-article .content-right:before {display: none;}}'
    + '@media only screen and (max-width: 400px) {.timeline-article p {margin: 0;}'
    + '.timeline-article p span.article-number {display: none;}}'
    + '</style>'
    + '</head>'
    + '<body>'
    + '<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>'
    + '<p style="text-decoration: underline; text-align:center; font-size: 150px;">Resource</p>'
    + '<table style="margin-left: auto;margin-right: auto;width: 60%; font-size: 30px">'
    + '<tr>'
    + '<td style="font-weight: bold;">Title of Resource: </td>'
    + '<td>' + ResourceToShow.title + '</td>'
    + '</tr>'
    + '<tr>'
    + '<td style="font-weight: bold;">Category of Resource: </td>'
    + '<td>' + ResourceToShow.category + '</td>'
    + '</tr>'
    + '<tr><td colspan="2">&nbsp;<td></tr>'
    + '<tr>'
    + '<td colspan="2">'
    + '<h1 style="text-align:center">LXD Timeline</h1>'
    + '</td>'
    + '</tr>'
    + '</table>'
    + '<p style="page-break-before: always">&nbsp;</p>'
    + '<br/>';
    // + '<h1 style="text-align:center">LXD Timeline</h1>';

    var theContentString;
    theContentString = '<section id="conference-timeline">'
    + '<div class="timeline-start">'
    + '<label>Start Time:</label>'
    + '<br />'
    + '<input name="startTimeInput" id="startTimeInput" type="time" value="' + ResourceToShow.startTime[0] + '" readonly />'
    + '</div>'
    + '<div class="conference-center-line"></div>'
    + '<div class="conference-timeline-content" id="containerBox">'
    var timingIndex = -1;
    var endTime;
    var previousStartTime;
    var circleTiming;
    var NumtoPageBreak = 0;

    for(x = 0; x < ResourceToShow.headerForEventName.length; x+=2){
        timingIndex++;
        if(x == 0){
            circleTiming = ResourceToShow.startTime[0];
            previousStartTime = circleTiming;
            theContentString += "<br/><br/>"
        }
            var previousgoDuration = ResourceToShow.goDuration[timingIndex];
            var previousgoMinutes = ResourceToShow.goMinutes[timingIndex];

            if(previousStartTime != '' && previousgoDuration != '' && previousgoMinutes != ''){
                if(x != 0){
                    circleTiming = theHour + ":" + theMin;
                }
                var strTime = previousStartTime.split(":");
                var theHour = parseInt(strTime[0]);
                var theMin = parseInt(strTime[1]);

                theMin += parseInt(previousgoMinutes);
                var NumberOfHoursIntheMinutes = Math.floor((theMin/60));
                theMin -= (NumberOfHoursIntheMinutes * 60);

                theHour += NumberOfHoursIntheMinutes + parseInt(previousgoDuration);

                if(theHour >= 24){
                    theHour -= 24;
                }

                if(theHour < 10){
                    theHour = "0" + theHour;
                }
                
                if(theMin < 10){
                    theMin = "0" + theMin;
                }

                // var theendTime = $('.endTime').eq(0);
                // theendTime.html(theHour + ":" + theMin);
                endTime = theHour + ":" + theMin;
                previousStartTime = endTime;
           }
        // console.log(circleTiming)
        theContentString += '<div class="timeline-article">'
        + '<div class="content-left-container">'
        + '<div class="content-left" style="background-color:' + ResourceToShow.colorPickerForEvent[x] + '">'
        + '<input name="headerForEventName" class="headerForEvent" value=' + ResourceToShow.headerForEventName[x] + '>'
        + '<textarea contenteditable="true" style="height: 400px" name="textAreasForEvents" readonly>' + ResourceToShow.textAreasForEvents[x] + '</textarea>'
        + '<input type="color" name="colorPickerForEvent" value="' + ResourceToShow.colorPickerForEvent[x] + '" />'
        + '<label style="font-size: small;">Last Modified By:</label>'
        + '<input readonly class="labelSetForLastModified" name="labelSetForLastModified" value="' + ResourceToShow.eventsLastModifiedBy[x] + '">'
        + '</div>'
        + '<label>Duration:</label><br />'
        + '<input type="number" name="goDuration" style="width: 50px" min="0" max="23" value="' + ResourceToShow.goDuration[timingIndex] + '" />&nbsp<label>hour(s)</label>&nbsp<input type="number" name="goMinutes" style="width: 50px" min="0" max="59" value="' + ResourceToShow.goMinutes[timingIndex] + '" />&nbsp<label>minute(s)</label>'
        + '<br />'
        + '</div>'
        //right-content
        + '<div class="content-right-container">'
        + '<div class="content-right" style="background-color: ' +  ResourceToShow.colorPickerForEvent[(x + 1)] + '">'
        + '<input readonly name="headerForEventName" class="headerForEvent" value="' + ResourceToShow.headerForEventName[(x + 1)] + '">'
        + '<textarea readonly style="height: 400px" name="textAreasForEvents">' + ResourceToShow.textAreasForEvents[(x + 1)] + '</textarea>'
        + '<input type="color" name="colorPickerForEvent" value="' + ResourceToShow.colorPickerForEvent[(x + 1)] + '" />'
        + '<label style="font-size: small;">Last Modified By:</label>'
        + '<input readonly class="labelSetForLastModified" name="labelSetForLastModified" value="' + ResourceToShow.eventsLastModifiedBy[(x + 1)] + '">'
        + '</div>'
        + '</div>'
        //after right-content
        + '<div class="meta-date">'
        + '<span class="date">' + circleTiming + '</span>'
        // + '<input name="middleTimeHidden" value="00:00" hidden/>'
        + '</div>'
        // + '<input type="checkbox" name="myCheckEvent" style="width: 18px; height: 18px; margin-top: 100px; margin-left: 45px;">'
        + '<button type="button" name="goRemoveEvents" class="btn clever-btn btn-2" style="display: block; margin-left: auto; margin-right: auto; margin-bottom: 50px; margin-top: 200px; cursor: not-allowed"><i class="fa fa-trash" style="font-size: 18px;"></i></button>'
        + '<input disabled readonly type="button" value="+" class="btn clever-btn btn-2" name="goButton" style="display: block; margin:auto; max-width: 300px; margin-top: 150px; background: #00b0bd; color: rgba(0, 0, 0, 0.50); font-size: xx-large; cursor: not-allowed;" />'
        + '</div>';


        if(x == 0 && ResourceToShow.headerForEventName.length != 2){
            theContentString += '<p style="page-break-before: always">&nbsp;</p>';
        }
        else{
            NumtoPageBreak += 2;
        }
        if((NumtoPageBreak % 4) == 0 && x != 0){
            theContentString += '<p style="page-break-before: always">&nbsp;</p>';
        }
    }


    theContentString += '<br/><br/></div>'
    + '<div class="timeline-end">End Time'
    + '<input class="endTime" type="time" value="' + endTime + '" readonly />'
    + '</div>'
    + '</section>'
    // theContentString = theContentString.replace('undefined','')


    var EndHtmlTagString = '<script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossorigin="anonymous"></script>'
    + '<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>'
    + '<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6" crossorigin="anonymous"></script>'
    + '<script>tinymce.init({selector: "textarea:not(.commentsInput)", readonly: 1, content_css: "//www.tiny.cloud/css/codepen.min.css", plugins: "print preview searchreplace autolink autosave save directionality visualblocks visualchars fullscreen image link media template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists wordcount imagetools textpattern noneditable help charmap emoticons", toolbar: "undo redo | bold italic underline strikethrough | fontselect fontsizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample | a11ycheck ltr rtl | showcomments addcomment", image_title: true, automatic_uploads: true, file_picker_types: "image", file_picker_callback: function (cb, value, meta) {var input = document.createElement("input"); input.setAttribute("type", "file"); input.setAttribute("accept", "image/*"); input.onchange = function () { var file = this.files[0]; var reader = new FileReader(); reader.onload = function () { var id = "blobid" + (new Date()).getTime(); var blobCache = tinymce.activeEditor.editorUpload.blobCache; var base64 = reader.result.split(",")[1]; var blobInfo = blobCache.create(id, file, base64); blobCache.add(blobInfo); cb(blobInfo.blobUri(), { title: file.name }); }; reader.readAsDataURL(file); }; input.click();}});</script>'
    + '</body></html>';


    var FullHTMLString = theHTMLString + theContentString + EndHtmlTagString;
    await page.setContent(FullHTMLString);

    // const pdfDoc = await page.pdf({path: 'hn.pdf', format: 'A4'});
    const pdfDoc = await page.pdf();
    
    await browser.close();
    res.writeHead(200, 
        {
            'Content-Type': 'application/pdf',
            'Content-Disposition':'attachment;filename="LXD_Timeline.pdf"'
        });
    res.end(pdfDoc);
    });


//At resource's PDF generation page
//Generate cards in pdf
router.post('/experience/readResource/:_id/generateResourcePDF/pdfcards', ensureAuthenticated, async (req, res) => {
    var idOfResource = req.params._id;
    const ResourceToShow = await Resource.findById(idOfResource);

    const browser = await puppeteer.launch({
        headless: true
        // slowMo: 250
    });
    const page = await browser.newPage();

    var theHTMLString = '<!DOCTYPE html><html>'
    + '<head>'
    + '<script src="https://cdn.tiny.cloud/1/s10q09jxylitz9oiyw1l72vaooxgiiygcnpr4kwryw6uemns/tinymce/5/tinymce.min.js" referrerpolicy="origin"></script>'
    + '<script src="https://code.jquery.com/jquery-3.5.0.min.js"></script>'
    + '<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.3/css/all.css" integrity="sha384-UHRtZLI+pbxtHCWp1t77Bi1L4ZtiqrqD80Kn4Z8NTSRyMA2Fd33n5dQ8lWUE00s/" crossorigin="anonymous">'
    + '<link rel="stylesheet" href="https://bootswatch.com/4/journal/bootstrap.min.css">'
    + '<style>'
    + '@page  {margin: 0;size: letter;}'
    + 'html {-webkit-print-color-adjust: exact;}'
    + '.labelForLastModifiedBy {height: 40px; width: 250px}'
    + '</style>'
    + '</head>'
    + '<body>'
    + '<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>'
    + '<p style="text-decoration: underline; text-align:center; font-size: 150px;">Resource</p>'
    + '<table style="margin-left: auto;margin-right: auto;width: 60%; font-size: 30px">'
    + '<tr>'
    + '<td style="font-weight: bold;">Title of Resource: </td>'
    + '<td>' + ResourceToShow.title + '</td>'
    + '</tr>'
    + '<tr>'
    + '<td style="font-weight: bold;">Category of Resource: </td>'
    + '<td>' + ResourceToShow.category + '</td>'
    + '</tr>'
    + '<tr><td colspan="2">&nbsp;<td></tr>'
    + '<tr>'
    + '<td colspan="2">'
    + '<h1 style="text-align:center">LXD Notes</h1>'
    + '</td>'
    + '</tr>'
    + '</table>'
    + '<p style="page-break-before: always">&nbsp;</p>'
    + '<br/>';
    // + '<h1 style="text-align:center">LXD Notes</h1>';

    var theContentString;

    for(x = 0; x < ResourceToShow.headerForNotesName.length; x++){
        theContentString += '<div style="border:1px solid transparent; background-color:' + ResourceToShow.colorPickerForNote[x] + '; margin-left:50px; float:left; width:430px; margin-top: 60px">'
        + '<input value="' + ResourceToShow.headerForNotesName[x] + '" style="margin-left:20px; width:250px; height:60px;">'
        + '&nbsp;'
        + '<input type="color" value="' + ResourceToShow.colorPickerForNote[x] + '" style="color:' + ResourceToShow.colorPickerForNote[x] + ';">'
        + '&nbsp;'
        + '<button class="btn btn-danger mt-2"> Delete</button>'
        + '<br/>'
        + '<textarea style="height:300px" readonly>' + ResourceToShow.goTextArea[x] + '</textarea>'
        + '<br/>'
        + '&nbsp;&nbsp;<label style="font-size: large;">Last Modified By:</label>&nbsp;&nbsp;'
        + '<input readonly class="labelForLastModifiedBy" value="' + ResourceToShow.notesLastModifiedBy[x] + '">'
        + '</div>';

        if(((x + 1) % 4) == 0 && (x + 1) != ResourceToShow.headerForNotesName.length){
            theContentString += '<p style="page-break-before: always">&nbsp;</p>';
        }
    }
    theContentString = theContentString.replace('undefined','')

    var EndHtmlTagString = '<script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossorigin="anonymous"></script>'
    + '<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>'
    + '<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6" crossorigin="anonymous"></script>'
    + '<script>tinymce.init({selector: "textarea:not(.commentsInput)", readonly: 1, content_css: "//www.tiny.cloud/css/codepen.min.css", plugins: "print preview searchreplace autolink autosave save directionality visualblocks visualchars fullscreen image link media template codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime advlist lists wordcount imagetools textpattern noneditable help charmap emoticons", toolbar: "undo redo | bold italic underline strikethrough | fontselect fontsizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample | a11ycheck ltr rtl | showcomments addcomment", image_title: true, automatic_uploads: true, file_picker_types: "image", file_picker_callback: function (cb, value, meta) {var input = document.createElement("input"); input.setAttribute("type", "file"); input.setAttribute("accept", "image/*"); input.onchange = function () { var file = this.files[0]; var reader = new FileReader(); reader.onload = function () { var id = "blobid" + (new Date()).getTime(); var blobCache = tinymce.activeEditor.editorUpload.blobCache; var base64 = reader.result.split(",")[1]; var blobInfo = blobCache.create(id, file, base64); blobCache.add(blobInfo); cb(blobInfo.blobUri(), { title: file.name }); }; reader.readAsDataURL(file); }; input.click();}});</script>'
    + '</body></html>';


    var FullHTMLString = theHTMLString + theContentString + EndHtmlTagString;
    await page.setContent(FullHTMLString);

    const pdfDoc = await page.pdf();
    
    await browser.close();
    res.writeHead(200, 
        {
            'Content-Type': 'application/pdf',
            'Content-Disposition':'attachment;filename="LXD_Notes.pdf"'
        });
    res.end(pdfDoc);
});


//"experience" link page
router.get('/exLandingPage', ensureAuthenticated, async (req, res) => {
    res.render('exLandingPage', { LoginUser: req.user, name: req.user.name, email: req.user.email} );
});

module.exports = router;
