const { MongoClient } = require('mongodb');
var prompt = require('prompt');

//function validate conv has an issue or not

function validateConv(_conv) {
    if (!_conv.assignDate || _conv.assignDate == null) {
        console.log('Conversation has assign date issue', _conv._id);
        return true;
    }
    if (!_conv.botTransferUnassigned || _conv.botTransferUnassigned == null) {
        console.log('Conversation has dot transfer issue', _conv._id);
        return true;
    }
    let firstReplay = nextDoc.messages.filter(function (elem) {

        return elem.direction == 'out' && elem.agentName != "";

    }).sort((a, b) => (a.date < b.date ? 1 : -1)).pop();

    if (new Date(_conv.agentFirstReply).getTime() != new Date(firstReplay.date).getTime()) {
        console.log('Conversation has first replay', _conv._id);
        return true;
    }
}
function updateConvCalculations(_conv) {
    let firstReplay = new Date(nextDoc.messages.filter(function (elem) {
        return elem.direction == 'out' && elem.agentName != "";
    }).sort((a, b) => (a.date < b.date ? 1 : -1)).pop().date);
    if (_conv.direction == 'in') {
        _conv.agentFirstReply = firstReplay;
        _conv.agentDelay = _conv.agentFirstReply - _conv.assignDate;
        _conv.clientWaitingTime = _conv.agentFirstReply - _conv.botTransferUnassigned;
        _conv.duration = _conv.closureDate - _conv.assignDate;
        _conv.totalTime = _conv.closureDate - _conv.creationDate;
        _conv.avgResponseTime = 0;
    }
    else {
        _conv.agentFirstReply = _conv.assignDate;
        _conv.agentDelay = 0;
        _conv.clientWaitingTime = 0;
        _conv.duration = _conv.closureDate - _conv.assignDate;
        _conv.totalTime = _conv.closureDate - _conv.creationDate;
        _conv.avgResponseTime = 0;
    }
    return _conv;
}
async function copyCollection() {

    //Here add the connection string you want to check
    const targetUri = 'mongodb+srv://doadmin:7206U984MmoRZqI5@robodesk-alfa-lab-73d2f395.mongo.ondigitalocean.com/robodesk?tls=true&authSource=admin&replicaSet=robodesk-alfa-lab';

    const targetClient = await MongoClient.connect(targetUri);
    console.log('Connected to destination at:', targetUri);

    //read from collection
    const targetCollection = targetClient.db().collection('archiveds');

    //Batch size , prefered 1 as you are erecifiticng data
    let count = 0;
    //this just to calcualte the speed, nothing to do with the logic
    const startTime = Date.now();
    console.log(`start copying in ${startTime}`);
    //Specifiy from when you want to start rectify, lets say below will start from first of May till now
    const filter = {
        creationDate: {
            $gte: new Date('2023-05-01T00:00:00Z')
        }
    };
    const cursor = targetCollection.find(filter);
    console.log('Reading data ...');
    while (await cursor.hasNext()) {
        let nextDoc = await cursor.next();
        //Write some code to check if the document has some issue. validate.
        //If the document has issue, recaculate it and update the values.
        //Items to check, Agent First Reply comparison, no assign time, no bottransfer 
        //validateConv
        if (validateConv(nextDoc) == false) {
            nextDoc = updateConvCalculations(nextDoc);
            try {
                //update the document
                count++;
                await targetCollection.updateOne(nextDoc);
                console.log('Document updated : ', count);
            }
            catch (ex) {
                //Show failed documents
                console.log('Error in this inser: ' + nextDoc._id);
            }
        }
        //calConv

        console.clear();
    }
    const endTime = Date.now();
    console.log(`Finished updating ${count} documents in ${endTime - startTime}ms`);
    await targetClient.close();
}
copyCollection();
prompt.start();