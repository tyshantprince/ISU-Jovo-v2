'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const { App } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
const { JovoDebugger } = require('jovo-plugin-debugger');
const { FileDb } = require('jovo-db-filedb');

const app = new App();

app.use(
    new Alexa(),
    new GoogleAssistant(),
    new JovoDebugger(),
    new FileDb()
);


// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

app.setHandler({
    LAUNCH() {

        if (!this.$user.isNew()) {
            let speech = this.speechBuilder()
                // .addText("Welcome to Illinois State University\'s Voice Service. Powered by Amazon Alexa. Welcome back " + this.$user.$data.name + ", what can I assist you with? ")
            this.ask(speech);
        }
        else
            var speech = 'Are you an I.S.U student?';
            var reprompt = 'Answer this with a yes or no';
            this.followUpState('InfoState').ask(speech, reprompt);
    },

    InfoState: {

        YesIntent() {
            this.ask('What is your eight digit U.I.D number?');
        },

        NoIntent() {
            this.tell('I said no');

        },
        ObtainUidIntent() {
            this.$user.$data.uid = this.$inputs.ulid;
            this.tell("U.I.D has been updated");

        }

    },

    Unhandled() {
        console.log("Data" + this.$inputs)
    },

});

module.exports.app = app;
