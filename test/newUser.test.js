'use strict';
const { App, Util } = require('jovo-framework');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
const { Alexa } = require('jovo-platform-alexa');
jest.setTimeout(500);

for (const p of [new Alexa()]) {
    const testSuite = p.makeTestSuite();

    describe(`PLATFORM: ${p.constructor.name} INTENTS`, () => {
        test('Launch intent', async () => {
            const conversation = testSuite.conversation();

            const launchRequest = await testSuite.requestBuilder.launch()
            const responseLaunchRequest = await conversation.send(launchRequest);
            console.log(responseLaunchRequest.isAsk('Are you an I.S.U student'));
        });
    });
}
