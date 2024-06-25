const { searchSamples } = require('../usecases/searchSamples');

const searchController = async (req, res) => {
    const { query, phrasePaths, enableFuzzy, multiAnalyser, dbName, collectionName } = req.body;

    console.log(query, phrasePaths, enableFuzzy, multiAnalyser, dbName, collectionName);

    if (!query || !phrasePaths || !dbName || !collectionName) {
        return res.status(400).json({ error: 'query, phrasePaths, dbName, and collectionName must be provided' });
    }

    try {
        const results = await searchSamples({ query, phrasePaths, enableFuzzy, multiAnalyser, dbName, collectionName });
        res.send({ results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { searchController };
