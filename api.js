'use strict';

import {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString
} from 'graphql';
import express from 'express';
import graphqlHTTP from 'express-graphql';
import request from 'request';
import Promise from 'bluebird';

const app = express();
const nflApiEndpoint = 'http://api.fantasy.nfl.com/v1/game/stats?format=json';
const fetch = Promise.promisify(request.get);


const getNFLData = () => fetch(nflApiEndpoint);

var nfqlSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'RootQueryType',
        fields: {
            hello: {
                type: GraphQLString,
                resolve() {
                    return getNFLData().then(
                        res => JSON.parse(res.body).stats[0].name
                    );
                }
            }
        }
    })
});


app.use('/graphql', graphqlHTTP({
    schema: nfqlSchema,
    graphiql: true
}));

app.listen(3000);
