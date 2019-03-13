'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const { App } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
const { JovoDebugger } = require('jovo-plugin-debugger');
const { FileDb } = require('jovo-db-filedb');

const iso = require('iso8601-duration');
const axios = require('axios');
const rp = require('request-promise');
const xml2json = require('xml2json');
const moment = require('moment');

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
    async LAUNCH() {
        if (this.$user.isNew()){
            if (!this.$request.getAccessToken()) {
                let speech = 'Welcome to Illinois State University\'s Voice Service. Powered by Amazon Alexa. Before we get started, I have to ask,  Are you an I.S.U student?';
                var reprompt = 'Answer this with a yes or no';
                this.followUpState('InfoState').ask(speech, reprompt);
            }
            else {
                let token = this.$request.getAccessToken();
                let options = {
                    method: 'GET',
                    uri: 'https://alexa-isu.auth0.com/userinfo', // You can find your URL on Client --> Settings --> 
                    // Advanced Settings --> Endpoints --> OAuth User Info URL
                    headers: {
                        authorization: 'Bearer ' + token,
                    }
                };
                await rp(options).then((body) => {
                    let data = JSON.parse(body);
                    this.$user.$data.name = data.name;
                     let speech = 'Welcome to Illinois State University\'s Voice Service. Powered by Amazon Alexa. I can see that you are a brand new user. I want you to create a 4 digit pin to keep your personal information more secure. Please say your four digit pin now.';
                     var reprompt = 'Please say your four digit pin code';
                     this.followUpState('PinState').ask(speech, reprompt);
                });
            }
        }
        else{
            let speech3 = this.speechBuilder()
                .addText("Welcome to Illinois State University\'s Voice Service. Powered by Amazon Alexa. Welcome back " + this.$user.$data.name + ", what can I assist you with? ")
            this.ask(speech3);
        }
    },

    InfoState: {
        YesIntent() {
            this.$alexaSkill.showAccountLinkingCard();
            this.tell("Okay, please link Your Account so that we know a little more about you.");
        },

        NoIntent() {
            this.tell('As a guest, you have limited access to the features of Illinois State University\'s voice service.');
        },
    },

    PinState: {
        PinCodeIntent() {
            this.$user.$data.pin = this.$inputs.pin;
            let speech = "Your pin code has been created. If the pin code  " + this.$user.$data.pin.value + " is correct, please confirm by saying , correct. If not, say reset";
            this.followUpState('ConfirmPinState').ask(speech);
        },
    },
    ConfirmPinState: {
        ConfirmPinIntent() {
                this.tell("You have successfully created a four digit pin for your account");
        },
        DeclinePinIntent() {
             let speech = 'I can see that you are a brand new user. I want you to create a 4 digit pin to keep your personal information more secure. Please say your four digit pin now.';
             var reprompt = 'Please say your four digit pin code';
             this.followUpState('PinState').ask(speech, reprompt);
        }
    },
    async ISUStudyIntent() {
        let duration = this.$inputs.duration;
        var now = new Date();
        const reminder = {
            "requestTime":  now.toISOString(),
                "trigger": {
                    "type": "SCHEDULED_RELATIVE",
                    "offsetInSeconds": iso.toSeconds(iso.parse(duration.value)),
                },
                "alertInfo": {
                    "spokenInfo": {
                        "content": [{
                            "locale": "en-US",
                            "text": "You have studied for " + iso.toSeconds(iso.parse(duration.value)) / 3600 + " hour."
                        }]
                    }
                },
                "pushNotification": {
                    "status": "ENABLED"
                }

            };

            try {
                const result = await this.$alexaSkill.$user.setReminder(reminder);

                this.tell('You are now in study mode. Focus and cut off all distractions');

            } catch (error) {
                if (error.code === 'NO_USER_PERMISSION') {
                    this.tell('Please grant the permission to set reminders.');
                } else {
                    console.error(error);
                    // Do something
                }
            }
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
         var name = this.$user.$data.name;
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
    
    ISUSportsIntent() {
        if (this.$inputs.period.value == "this week") {
            let speech = 'Which sport would you like to know more about?';
            let reprompt = 'Answer this a sport of your choice';
            this.followUpState("ISUSportsEventsThisWeekState").ask(speech, reprompt);
        }
        if (this.$inputs.period.value == "today") {
            let speech = 'Which sport would you like to know more about?';
            let reprompt = 'Answer this a sport of your choice';
            this.followUpState("ISUSportsEventsTodayState").ask(speech, reprompt);
        }
    },

    ISUSportsEventsThisWeekState: {
        async ISUBaseballIntent() {
            var my_xml_string = "";
            var options = {
                method: 'GET',
                uri: 'https://goredbirds.com/rss.aspx?path=baseball',
                headers: {
                    'User-Agent': 'Request-Promise',
                    'Content-Type': 'text/xml',
                    'Content-Length': Buffer.byteLength(my_xml_string)
                },
                body: my_xml_string,
                json: true
            };

            await rp(options).then((body) => {
                let data = JSON.parse(xml2json.toJson(body));
                let items = data.rss.channel.item;
                let speech = this.speechBuilder();
                items.forEach((item) => {
                    var date = moment(new Date(item.pubDate)).format('MMMM Do YYYY');
                    if (date > moment().startOf('week').format('MMMM Do YYYY') && date < moment().endOf('week').format('MMMM Do YYYY')) {
                        speech.addText("On " + date + ", " + item.title)
                                .addBreak('1s');
                    }
                })
            this.tell(speech);
            });
        },
        async ISUMensGolfIntent() {
            var my_xml_string = "";
            var options = {
                method: 'GET',
                uri: 'https://goredbirds.com/rss.aspx?path=mgolf',
                headers: {
                    'User-Agent': 'Request-Promise',
                    'Content-Type': 'text/xml',
                    'Content-Length': Buffer.byteLength(my_xml_string)
                },
                body: my_xml_string,
                json: true
            };

            await rp(options).then((body) => {
                let data = JSON.parse(xml2json.toJson(body));
                let items = data.rss.channel.item;
                let speech = this.speechBuilder();
                items.forEach((item) => {
                    var date = moment(new Date(item.pubDate)).format('MMMM Do YYYY');
                    if (date > moment().startOf('week').format('MMMM Do YYYY') && date < moment().endOf('week').format('MMMM Do YYYY')) {
                        speech.addText("On " + date + ", " + item.title)
                            .addBreak('1s');
                    }
                })
                this.tell(speech);
            });
        },
        async ISUMensTennisIntent() {
            var my_xml_string = "";
            var options = {
                method: 'GET',
                uri: 'https://goredbirds.com/rss.aspx?path=mten',
                headers: {
                    'User-Agent': 'Request-Promise',
                    'Content-Type': 'text/xml',
                    'Content-Length': Buffer.byteLength(my_xml_string)
                },
                body: my_xml_string,
                json: true
            };

            await rp(options).then((body) => {
                let data = JSON.parse(xml2json.toJson(body));
                let items = data.rss.channel.item;
                let speech = this.speechBuilder();
                items.forEach((item) => {
                    var date = moment(new Date(item.pubDate)).format('MMMM Do YYYY');
                    if (date > moment().startOf('week').format('MMMM Do YYYY') && date < moment().endOf('week').format('MMMM Do YYYY')) {
                        speech.addText("On " + date + ", " + item.title)
                            .addBreak('1s');
                    }
                })
                this.tell(speech);
            });
        },
        async ISUSoftballIntent() {
            var my_xml_string = "";
            var options = {
                method: 'GET',
                uri: 'https://goredbirds.com/rss.aspx?path=softball',
                headers: {
                    'User-Agent': 'Request-Promise',
                    'Content-Type': 'text/xml',
                    'Content-Length': Buffer.byteLength(my_xml_string)
                },
                body: my_xml_string,
                json: true
            };

            await rp(options).then((body) => {
                let data = JSON.parse(xml2json.toJson(body));
                let items = data.rss.channel.item;
                let speech = this.speechBuilder();
                items.forEach((item) => {
                    var date = moment(new Date(item.pubDate)).format('MMMM Do YYYY');
                    if (date > moment().startOf('week').format('MMMM Do YYYY') && date < moment().endOf('week').format('MMMM Do YYYY')) {
                        speech.addText("On " + date + ", " + item.title)
                            .addBreak('1s');
                    }
                })
                this.tell(speech);
            });
        }
    },
    ISUSportsEventsTodayState: {
        async ISUBaseballIntent() {
            var my_xml_string = "";
            var options = {
                method: 'GET',
                uri: 'https://goredbirds.com/rss.aspx?path=baseball',
                headers: {
                    'User-Agent': 'Request-Promise',
                    'Content-Type': 'text/xml',
                    'Content-Length': Buffer.byteLength(my_xml_string)
                },
                body: my_xml_string,
                json: true
            };

            await rp(options).then((body) => {
                let data = JSON.parse(xml2json.toJson(body));
                let items = data.rss.channel.item;
                let speech = this.speechBuilder();
                items.forEach((item) => {
                    var date = moment(new Date(item.pubDate)).format('MMMM Do YYYY');
                    if (moment(new Date(item.pubDate)).isBetween(moment().startOf('day'), moment().endOf('day'))) {
                        speech.addText("On " + date + ", " + item.title)
                                .addBreak('1s');
                    }
                })
                this.tell(speech);
            });
        },
        async ISUMensGolfIntent() {
            var my_xml_string = "";
            var options = {
                method: 'GET',
                uri: 'https://goredbirds.com/rss.aspx?path=mgolf',
                headers: {
                    'User-Agent': 'Request-Promise',
                    'Content-Type': 'text/xml',
                    'Content-Length': Buffer.byteLength(my_xml_string)
                },
                body: my_xml_string,
                json: true
            };

            await rp(options).then((body) => {
                let data = JSON.parse(xml2json.toJson(body));
                let items = data.rss.channel.item;
                let speech = this.speechBuilder();
                items.forEach((item) => {
                    var date = moment(new Date(item.pubDate)).format('MMMM Do YYYY');
                    if (moment(new Date(item.pubDate)).isBetween(moment().startOf('day'), moment().endOf('day'))) {
                        speech.addText("On " + date + ", " + item.title)
                            .addBreak('1s');
                    }
                })
                this.tell(speech);
            });
        },
        async ISUMensTennisIntent() {
            var my_xml_string = "";
            var options = {
                method: 'GET',
                uri: 'https://goredbirds.com/rss.aspx?path=mten',
                headers: {
                    'User-Agent': 'Request-Promise',
                    'Content-Type': 'text/xml',
                    'Content-Length': Buffer.byteLength(my_xml_string)
                },
                body: my_xml_string,
                json: true
            };

            await rp(options).then((body) => {
                let data = JSON.parse(xml2json.toJson(body));
                let items = data.rss.channel.item;
                let speech = this.speechBuilder();
                items.forEach((item) => {
                    var date = moment(new Date(item.pubDate)).format('MMMM Do YYYY');
                    if (moment(new Date(item.pubDate)).isBetween(moment().startOf('day'), moment().endOf('day'))) {
                        speech.addText("On " + date + ", " + item.title)
                            .addBreak('1s');
                    }
                })
                this.tell(speech);
            });
        },
        async ISUSoftballIntent() {
            var my_xml_string = "";
            var options = {
                method: 'GET',
                uri: 'https://goredbirds.com/rss.aspx?path=softball',
                headers: {
                    'User-Agent': 'Request-Promise',
                    'Content-Type': 'text/xml',
                    'Content-Length': Buffer.byteLength(my_xml_string)
                },
                body: my_xml_string,
                json: true
            };

            await rp(options).then((body) => {
                let data = JSON.parse(xml2json.toJson(body));
                let items = data.rss.channel.item;
                let speech = this.speechBuilder();
                items.forEach((item) => {
                    var date = moment(new Date(item.pubDate)).format('MMMM Do YYYY');
                    if (moment(new Date(item.pubDate)).isBetween(moment().startOf('day'), moment().endOf('day'))) {
                        speech.addText("On " + date + ", " + item.title)
                            .addBreak('1s');
                    }
                })
                this.tell(speech);
            });
        }
    },
    async ISURedbirdCardIntent() {
         let options = {
             method: 'POST',
             uri: 'https://tools.illinoisstate.edu/RedbirdCardBackend/PortalBalanceXML?ulid=tprince', 
         };
         await rp(options).then((body) => {
             let data = JSON.parse(xml2json.toJson(body));
             this.$user.$data.balance = data.person.plans.plan.balance;
             this.tell("Your redbird card has a balance of " + this.$user.$data.balance);
         });
    },
     
     RepeatIntent() {
         this.repeat();
     },

    Unhandled() {
        console.log("Data" + this.$inputs)
    },

});

module.exports.app = app;
