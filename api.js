'use strict';

import {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLList,
    GraphQLString,
    GraphQLFloat,
    GraphQLNonNull
} from 'graphql';
import express from 'express';
import graphqlHTTP from 'express-graphql';
import request from 'request';
import Promise from 'bluebird';

const app = express();
const getNflApiEndpoint = (week) => {
    return `http://api.fantasy.nfl.com/v1/players/stats?statType=weekStats&season=2016&format=json&week=${week}`;
};
const fetch = Promise.promisify(request.get);

const getNFLData = (w) => fetch(getNflApiEndpoint(w));
const sortByPoints = (p1, p2) => p2.weekPts - p1.weekPts;
const parsePlayerData = (res) => {
    return JSON.parse(res.body).players
        .slice(0, 100)
        .filter(
            (p) => pos ? p.position === pos : true
        )
        .sort(sortByPoints);
};

let week, pos;

const playerFields = () => {
    return {
        name: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'Player name.',
            resolve: (p) => p.name || '',
        },
        points: {
            type: new GraphQLNonNull(GraphQLFloat),
            description: 'Player actual points',
            resolve: (p) => p.weekPts || 0
        },
        projectedPoints: {
            type: new GraphQLNonNull(GraphQLFloat),
            description: 'Player projected points',
            resolve: (p) => p.weekProjectedPts
        },
        position: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'Player position',
            resolve: (p) => p.position
        },
        team: {
            type: new GraphQLNonNull(GraphQLString),
            description: 'Player team',
            resolve: (p) => p.teamAbbr
        },
        week: {
            type: new GraphQLNonNull(GraphQLFloat),
            description: 'Week of season',
            resolve: () => week
        }
    }
};

const PlayerType = new GraphQLObjectType({
    name: 'PlayerType',
    description: 'Player from NFL Fantasy API.',
    fields: () => {
        const pf = playerFields();
        return {
            name: pf.name,
            points: pf.points,
            projectedPoints: pf.projectedPoints,
            position: pf.position,
            team: pf.team,
            week: pf.week
        }
    }
});



var nfqlSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'RootQueryType',

        fields: {
            players: {
                type: new GraphQLList(PlayerType),
                description: 'Player performances for the current week.',
                args: {
                    position:{ type: new GraphQLNonNull(GraphQLString) },
                    week: { type: new GraphQLNonNull(GraphQLFloat) }
                },
                resolve(source, args) {
                    week = args.week; // better way to do this?
                    pos = args.position;
                    return getNFLData(week).then(parsePlayerData);
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
