﻿interface ICard {
    id: number;
    demande: number;
    titre: string;
    description: string;    
    currentUser: User;
    lastViewed: moment.Moment;  
    isArchive: boolean;
    user?: User;
    messages?: Array<Message>;
    attachments?: Array<Attachment>;
    steps?: Array<Step>;
}
class Card {
    id: number;
    demande: KnockoutObservable<number>;
    titre: KnockoutObservable<string>;
    description: KnockoutObservable<string>;
    user: User;
    currentUser: User;
    messages: KnockoutObservableArray<Message>;
    attachments: KnockoutObservableArray<Attachment>;
    lastViewed: KnockoutObservable<moment.Moment>;
    steps: KnockoutObservableArray<Step>;
    isArchive: KnockoutObservable<boolean>;

    newMessage: KnockoutObservable<Message>;
    newStep: KnockoutObservable<Step>;

    UnreadMessages: KnockoutComputed<Array<Message>>;
    estimation: KnockoutComputed<number>;
    totalUnseenFiles: KnockoutComputed<number>;
    totalMessages: KnockoutComputed<number>;
    totalUnreadMessages: KnockoutComputed<number>;
    totalFiles: KnockoutComputed<number>;
    hasUnseenFilesOrMsg: KnockoutComputed<boolean>;
    totalUnseenFilesAndMsg: KnockoutComputed<number>;
    hasTime: KnockoutComputed<boolean>;
    timeText: KnockoutComputed<string>;
    messagesText: KnockoutComputed<string>;
    unseenFilesOrMsgText: KnockoutComputed<string>;
    attachementsText: KnockoutComputed<string>;
    uploadFilePath: KnockoutComputed<string>;
    percentComplete: KnockoutComputed<number>;

    // inline edit
    editingTitre: KnockoutObservable<boolean>;
    previousTitre: string;
    editingDescription: KnockoutObservable<boolean>;
    previousDescription: string;

    // Methods
    isOwner: (data: Message) => void;
    toReadableTime: () => string;
    uploadId: () => string;
    editEstimation: () => void;
    editTitre: () => void;
    saveTitre: () => void;
    cancelTitre: () => void;
    clearTitre: () => void;
    editDescription: () => void;
    saveDescription: () => void;
    cancelDescription: () => void;
    addMessage: () => void;
    deleteMessage: (data: Message) => void;
    saveEditedCard: () => void;
    deleteStep: (data: Step) => boolean;
    addStep: () => void;
    archiveCard: () => void;
    
    constructor(data: ICard) {
        var self = this;

        this.id = data.id;
        this.demande = ko.observable(data.demande);
        this.titre = ko.observable(data.titre);
        this.description = ko.observable(data.description);
        this.user = data.user;
        this.currentUser = data.currentUser;
        this.messages = ko.observableArray(data.messages);
        this.attachments = ko.observableArray(data.attachments);
        this.lastViewed = ko.observable(data.lastViewed);
        this.steps = ko.observableArray(data.steps);
        this.isArchive = ko.observable(data.isArchive);

        this.newMessage = ko.observable(Global.emptyMessage(this.currentUser, this.lastViewed));
        this.newStep = ko.observable(Global.emptyStep());

        // COMPUTED
        this.UnreadMessages = ko.computed(function () {
            var unread = new Array<Message>();
            $.each(self.messages(), function (index, msg) {
                if (msg.date() > self.lastViewed())
                    unread.push(msg);
            });
            return unread;
        }, self);
        this.estimation = ko.computed(function () {
            var estimationTotale = 0;
            $.each(self.steps(), function (index, step) {
                if (step.estimation() > 0)
                    estimationTotale += step.estimation();
            });

            return estimationTotale;
        }, self);
        this.totalFiles = ko.computed(function () {
            return self.attachments().length;
        }, self);
        this.totalMessages = ko.computed(function () {
            return self.messages().length;
        }, self);
        this.totalUnreadMessages = ko.computed(function () {
            var nbNew = 0;
            $.each(self.messages(), function (index, msg) {
                if (msg.date() > self.lastViewed())
                    nbNew++;
            });
            return nbNew;
        }, self);
        this.totalUnseenFiles = ko.computed(function () {
            var nbNew = 0;
            $.each(self.attachments(), function (index, file) {
                if (file.date() > self.lastViewed())
                    nbNew++;
            });
            return nbNew;
        }, self);
        this.hasUnseenFilesOrMsg = ko.computed(function () {
            return self.totalUnreadMessages() > 0 || self.totalUnseenFiles() > 0;
        }, self);
        this.totalUnseenFilesAndMsg = ko.computed(function () {
            return self.totalUnseenFiles() + self.totalUnreadMessages();
        }, self);
        this.hasTime = ko.computed(function () {
            return parseInt(this.estimation()) > 0;
        }, this);
        this.timeText = ko.computed(function () {
            return "Card Estimation";
        }, self);
        this.messagesText = ko.computed(function () {
            return "This card contains " + this.totalUnreadMessages().toString() + " messages";
        }, this);
        this.unseenFilesOrMsgText = ko.computed(function () {
            return "This card contains " + this.totalUnreadMessages().toString() + " unread messages and " + this.totalUnseenFiles() + " new files";
        }, this);
        this.attachementsText = ko.computed(function () {
            return "This card have " + this.totalFiles().toString() + " attachments";
        }, this);
        this.uploadFilePath = ko.computed(function () {
            return '/Api/Fichier/' + self.id;
        }, self);
        this.percentComplete = ko.computed(function () {
            if (self.steps().length > 0) {
                var stepsDone = 0;
                var stepsTotal = self.estimation();

                $.each(self.steps(), function (index, step) {
                    if (step.isDone())
                        stepsDone += step.estimation();
                });

                return stepsDone * 100 / stepsTotal;
            }
            else
                return 0;
        }, self);

        // inline edit
        this.editingTitre = ko.observable(false);
        this.previousTitre = '';
        this.editingDescription = ko.observable(false);
        this.previousDescription = '';

        // Methods
        this.isOwner = (data: Message) => {
            return data.user().id == this.currentUser.id;
            return false;
        }
        this.toReadableTime = () => {
            var seconds = this.estimation();
            var numyears = Math.floor(seconds / 31536000);
            var numdays = Math.floor((seconds % 31536000) / 86400);
            var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
            var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
            var numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
            var output = (numyears > 0 ? numyears + " y " : '') + (numdays > 0 ? numdays + " d" : '') + (numhours > 0 ? numhours + " h" : '') + (numminutes > 0 ? numminutes + " m" : '') + (numseconds > 0 ? numseconds + " s" : '');
            return output.length == 0 ? '<unestimated>' : output;
        }
        this.uploadId = () => {
            return 'dropzone-' + this.id.toString();
        }

        // inline edit estimation
        this.editEstimation = () => {
            $('#add-step-input').focus();
        }

        // inline edit titre
        this.editTitre = () => {
            this.previousTitre = this.titre();
            this.editingTitre(true);
        }
        this.saveTitre = () => {
            this.editingTitre(false);
            this.saveEditedCard();
        }
        this.cancelTitre = () => {
            this.titre(this.previousTitre);
            this.editingTitre(false);
        }
        this.clearTitre = () => {
            this.titre(null);
            $('#edit-titre').focus();
        }

        // inline edit description
        this.editDescription = () => {
            this.previousDescription = this.description();
            this.editingDescription(true);
        }
        this.saveDescription = () => {
            this.editingDescription(false);
            this.saveEditedCard();
        }
        this.cancelDescription = () => {
            this.description(this.previousDescription);
            this.editingDescription(false);
        }

        // SERVER
        this.addMessage = () => {
            var currentDate = moment();
            this.newMessage().date(currentDate);
            OllertApi.addMessage(self.newMessage(), self.id, function (messageServer) {
                // change la date de vue de la carte pour eviter la notification
                self.lastViewed(moment());
                // Change la date de vue de la carte cote serveur
                OllertApi.updateCard(self);

                // Met a jour l'id du message
                self.newMessage().id = messageServer.Id;
                // Ajoute a la liste
                self.messages.push(self.newMessage());

                // Rebind avec un nouveeau message
                self.newMessage(Global.emptyMessage(self.currentUser, self.lastViewed));
            });
        }
        this.deleteMessage = (data: Message) => {
            OllertApi.deleteMessage(data.id, function () {
                // AJAX CALLBACK
                var msgToDeleteIndex = -1;
                $.each(self.messages(), function (index, msg) {
                    if (msg.id == data.id)
                        msgToDeleteIndex = index;
                });

                if (msgToDeleteIndex >= 0)
                    self.messages.splice(msgToDeleteIndex, 1);
            });

            return false;
        }

        this.saveEditedCard = () => {
            // Sauvegarde le changement sur le serveur
            OllertApi.updateCard(this);
        }

        this.addStep = () => {
            OllertApi.addStep(this.newStep(), this.id, function (serverStep) {
                // change la date de vue de la carte pour eviter la notification
                self.lastViewed(moment());
                // Change la date de vue de la carte
                OllertApi.updateCard(self);

                // Met a jour l'id de l'etape
                self.newStep().id = serverStep.Id;
                // Ajoute a la liste
                self.steps.push(self.newStep());

                // Rebind avec une nouvelle etape
                self.newStep(Global.emptyStep());

                // Reapplique le javascript
                Global.initializeEtapes();
            });
        }
        this.deleteStep = (data: Step) => {
            OllertApi.deleteStep(data.id, function () {
                var stepIndex = -1;
                $.each(self.steps(), function (index, step) {
                    if (step.id == data.id)
                        stepIndex = index;
                });

                if (stepIndex >= 0)
                    self.steps.splice(stepIndex, 1);
            });

            return false;
        }

        this.archiveCard = () => {
            this.isArchive(!this.isArchive());
            OllertApi.updateCard(this);
        }
    }
} 