const mongoose = require('mongoose');
const fs = require('fs');
const AtlasSearchQueryBuilder = require('../classes/AtlasSearchQueryBuilder');

const searchSamples = async ({ query, phrasePaths, enableFuzzy, multiAnalyser, dbName, collectionName }) => {
    const searchQuery = AtlasSearchQueryBuilder.buildSearchCompoundOperator({ query, phrasePaths, enableFuzzy, multiAnalyser });

    if (!searchQuery) {
        throw new Error('Invalid input or unable to build search query');
    }

    console.log('searchQuery=>', searchQuery);

    const pipeline = [
        {
            $search: searchQuery
        }
    ];

    let data = JSON.stringify(pipeline);
    fs.writeFileSync('pipeline.json', data);

    // Switch to the appropriate database and collection
    const connection = mongoose.connection.useDb(dbName);
    const Collection = connection.collection(collectionName);

    return await Collection.aggregate(pipeline).toArray();
};

module.exports = { searchSamples };

