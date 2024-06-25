class AtlasSearchQueryBuilder {
    /**
     * @param {Object} param
     * @param {String} param.query
     * @param {String} param.phrasePaths
     * @param {String} param.enableFuzzy
     * @param {String} param.multiAnalyser
     * @return {Object}
     */
    buildSearchCompoundOperator({ query, phrasePaths, enableFuzzy= true, multiAnalyser="whitespaceAnalyzer"}) {
        if(typeof query != "string" || query.trim().length == 0) return;
        if(!Array.isArray(phrasePaths) || phrasePaths.length == 0) return;

        if(typeof enableFuzzy != "boolean") enableFuzzy = true;

        query = query.toLowerCase();
        query = query.replace(/[^a-zA-Z0-9 _.-]/gi, "");

        query = query.split(/[ ]+/);
        query = query.filter((it) => it.replace(/[_.-]/gi, "").length > 0);
        if(query.length == 0) return;

        const queryComponent = this.#buildSearchQueryComponent({ query, phrasePaths, enableFuzzy });
        if (multiAnalyser == null) return queryComponent;

        const multiQueryComponent = this.#buildSearchQueryComponent({ query, phrasePaths, enableFuzzy, multiAnalyser });
        return { 
            index: "sampleSearch",
            compound: { 
                minimumShouldMatch: 1, 
                should: [queryComponent, multiQueryComponent] 
            } 
        };
    }

    /**
     * @param {Object} param
     * @param {String} param.query
     * @param {Array<String>} param.phrasePaths
     * @param {Boolean} param.enableFuzzy
     * @param {String?} param.multiAnalyser
     * @return {Object}
     */
    #buildSearchQueryComponent({ query, phrasePaths, enableFuzzy=true, multiAnalyser }) {
        query = phrasePaths.map((path)=> {
            let parsedQuery = query.map((element) => {
                if(!element.includes(".") && !element.includes("-") && !element.includes("_")) {
                    return this.#processQueryStringElement({ element: element, path, enableFuzzy, multiAnalyser});
                }

                element = element.split(/[_.-]/);
                element = element.filter((it) => it.length > 0);

                if (element.length == 1) {
                    return this.#processQueryStringElement({ element: element[0], path, enableFuzzy, multiAnalyser });
                }
                if (element.length > 1) {
                    const emptyJoinObject = this.#processQueryStringElement({ element: element.join(""), path, enableFuzzy, multiAnalyser });
                    const andJoinedObject = { compound: { must: element.map((it) => this.#processQueryStringElement({ element: it, path, enableFuzzy, multiAnalyser })) } };

                    return {
                        compound: {
                            minimumShouldMatch: 1,
                            should: [emptyJoinObject, andJoinedObject],
                        },
                    };
                }
            })

            parsedQuery = parsedQuery.filter((it) => it);
            return { compound: { must: parsedQuery } };
        })

        if (query.length == 1) return query[0];

        return { compound: { minimumShouldMatch: 1, should: query } };
    }

    /**
     * @param {Object} param
     * @param {String} param.element
     * @param {String} param.path
     * @param {Boolean} param.enableFuzzy
     * @param {String?} param.multiAnalyser
     * @returns {Object}
     */
    #processQueryStringElement({ element, path, enableFuzzy, multiAnalyser}) {
        const options  = { path: multiAnalyser ? `${path}.${multiAnalyser}` : path };

        // If element is a number or has 3 or less size then don't perform fuzzy or synonym search.
        if(!isNaN(element) || element <=3 ) {
            return { text: { query: element, ...options } };
        }
        
        if(enableFuzzy) options.fuzzy = { maxEdits: 1, prefixLength: 1 };

        if(element.endsWith("s")) {
            return {
                compound: {
                    minimumShouldMatch: 1,
                    should: [{ text: {query: element.slice(0, -1), ...options} }, { text: { query: element, ...options } }],
                }
            };
        }

        return { text: { query: element, ...options }};
    }
}

module.exports = new AtlasSearchQueryBuilder();