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

        if (!this.getAccessToken()){
            let speech = this.speechBuilder()
                .addText("Welcome to Illinois State University\'s Voice Service. Powered by Amazon Alexa. Welcome back " + this.$user.$data.name + ", what can I assist you with? ")
            this.ask(speech);
        }
        else
            var speech = 'Are you an I.S.U student?';
            var reprompt = 'Answer this with a yes or no';
            this.followUpState('InfoState').ask(speech, reprompt);
    },

    InfoState: {

        YesIntent() {
            this.$alexaSkill.showAccountLinkingCard();
            this.tell("Please Link Your Account");
        },

        NoIntent() {
            this.tell('As a guest, you have limited access to the features of Illinois State University\'s voice service.' );

        },
    },

     ObtainUidIntent() {
         this.$user.$data.uid = this.$inputs.uid;
         this.tell("U.I.D has been updated");

    },
     ISUTechProblemsIntent() {
         this.ask("At Illinois State University, for technology related issues, you can visit Tech Zone Service Center located in the Bone, contact I.S.U ResNet, or contact the University Tech Support Center. Which service would you like more information on?")
     },

     ISUTechZoneIntent(){
         let speech = this.speechBuilder()
             .addText([
                 "The TechZone Service Center is the computer repair center for the Illinois State community. Get help connecting to WiFi, configuring email, removing viruses and more at the conveniently-located walk-up counter in the Bone Student Center. Contact Techzone at (309)438-8334",
             ]);

         this.tell(speech)
     },

     ISUResNetIntent() {
         let speech = '<speak><emphasis><phoneme alphabet="ipa" ph="r\ Es.nEt">ResNet</phoneme></emphasis> is the internet service provider for the residence halls at Illinois State University. It also employs student workers, many of whom live in the residence halls and are available by appointment for in-room tech support. Visit <emphasis><phoneme alphabet="ipa" ph="r\ Es.nEt">ResNet</phoneme></emphasis> dot illinois state dot e.d.u for more information </speak>';
         this.tell(speech)
     },

    ISUITHelpIntent() {
         if (!this.getAccessToken()) {
             this.toIntent('LAUNCH');
         }
         let speech = this.speechBuilder()
             .addText([
                 "IT HELP is where you can get hands on help from IT Professionals at Illinois State University. Located in room 145 in Julian Hall. You may contact them at (309)-438-4357"
             ]);
         this.tell(speech)
     },

    ISUFactIntent() {
         let speech = this.speechBuilder()
             .addText([
                 "Illinois State University is the first public university in Illinois, founded in eighteen-fifty-seven.",
                 "In 2007, Milner Library received the John Cotton Dana Library Public Relations Award. One of only seven libraries to win this award nationwide.",
                 "Watterson Towers offers the highest vantage point in Illinois between Chicago and St. Louis.",
             ])

         this.tell(speech)
     },

    FinancialAidIntent() {
         if (!this.getAccessToken()) {
             this.toIntent('LAUNCH');
         }
         this.tell(`The Financial Aid office at Illlinois State University is open Monday 
                    Through Friday from eight a.m to four-thirty p.m. <break time ="1s"/> You can contact them via phone at (309) 438-2231.`)
     },

     FinancialAidAdvisorIntent() {

         if (!this.getAccessToken()){
             this.toIntent('LAUNCH');
         }

         var advisor = '';
         var name = this.user().data.name;
         var firstCharOfLastName = name.toLowerCase().charAt(name.indexOf(' ') + 1);

         switch (firstCharOfLastName) {
             case 'a':
             case 'b':
             case 'c':
             case 'd':
                 advisor = 'Heidi Schmidt';
                 break;
             case 'e':
             case 'f':
             case 'g':
             case 'h':
                 advisor = 'Sharon Carr';
                 break;
             case 'i':
             case 'j':
             case 'k':
             case 'l':
                 advisor = 'Cory Washington';
                 break;
             case 'm':
             case 'n':
             case 'o':
             case 'p':
                 advisor = 'Christopher McDermott';
                 break;
             case 'q':
             case 'r':
             case 's':
             case 't':
             case 'u':
                 advisor = 'Mikalynn Waddell';
                 break;
             case 'v':
             case 'w':
             case 'x':
             case 'y':
             case 'z':
                 advisor = 'Courtney Gallup';
                 break;
         }

         this.tell('Your Financial Aid Advisor is ' + advisor);

     },
     
     RepeatIntent() {
         this.repeat();
     },

    Unhandled() {
        console.log("Data" + this.$inputs)
    },

});

module.exports.app = app;
