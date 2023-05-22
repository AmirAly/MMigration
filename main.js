const { MongoClient } = require('mongodb');

async function copyCollection() {
    const sourceUri = 'mongodb+srv://abc-import-ali-bi:WC2oR3xXJTSoElx9RExIY6b@robodesk2.yzwsp.mongodb.net/robodesk-alfa';
    const targetUri = 'mongodb+srv://doadmin:7206U984MmoRZqI5@robodesk-alfa-lab-73d2f395.mongo.ondigitalocean.com/robodesk?tls=true&authSource=admin&replicaSet=robodesk-alfa-lab';

    const sourceClient = await MongoClient.connect(sourceUri);
    console.log('Connected to source at:', sourceUri);
    const targetClient = await MongoClient.connect(targetUri);
    console.log('Connected to destination at:', targetUri);

    const sourceCollection = sourceClient.db().collection('archiveds');
    const targetCollection = targetClient.db().collection('temp-migration');

    const batchSize = 100;
    let count = 0;

    const startTime = Date.now();
    const filter = {
        creationDate: {
            $gte: new Date('2023-05-01T00:00:00Z')
        }
    };
    console.log('Using filter:', filter);

    const cursor = sourceCollection.find(filter);
    console.log('Reading data ...');
    while (await cursor.hasNext()) {
        console.log('Pushed',);
        const batch = [];
        for (let i = 0; i < batchSize && await cursor.hasNext(); i++) {
            batch.push(await cursor.next());
            console.log('Pushed ' + i);
        }
        console.log('Preparing batch insert for :' + batch.length);
        count += batch.length;
        console.log('Inserting ...');
        await targetCollection.insertMany(batch);
        console.clear();
        console.log(`Inserted ${count} documents`);
    }

    const endTime = Date.now();
    console.log(`Finished copying ${count} documents in ${endTime - startTime}ms`);
    await sourceClient.close();
    await targetClient.close();
}

copyCollection();
