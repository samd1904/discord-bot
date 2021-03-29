//init packages
const Discord = require('discord.js');
const dotenv = require('dotenv');
const MongoClient = require('mongodb').MongoClient;
var service = require('./service.js');

//Define globals

var ex = dotenv.config();
const dsClient = new Discord.Client();
const activator = "~";
const dbURI = ex.parsed.MONGOPATH;
const dbClient = new MongoClient(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });
var dbStat = false;
var tOut;

function closeConnection() {
    dbStat = false;
    globalLogs("database connection closed");
    dbClient.close();
}

//bot code

dsClient.login(ex.parsed.TOKEN);
dsClient.once('ready', async () => {
    globalLogs("Badger is online!");
    //connect to database
    try {
        await dbClient.connect();
        dbStat = true;
        globalLogs("Connected to database");
    } catch (err) {
        globalLogs("DB connection error: " + err);
    }finally{
        tOut = setTimeout(closeConnection, 60000);
    }
});
dsClient.on("message", async msg => {
    if (msg.content.startsWith(activator)) {
        if (dbStat) {
            clearTimeout(tOut);
        } else {
            try {
                await dbClient.connect();
                dbStat = true;
                globalLogs("Connected to database");
            } catch (err) {
                globalLogs("DB connection error: " + err);
            }
        }
        var str = msg.content.split(" ");
        var action = str[0];
        var preReqs = {
            "dbClient": dbClient,
            "globalLogs": globalLogs
        };
        switch (action) {
            case activator + "add":
                try {
                    var data = {
                        "_id": msg.author.id,
                        "gId": msg.guild.id,
                        "links": [{
                            "platform": str[1],
                            "url": str[2]
                        }]
                    };
                    var success = await service.add(data, preReqs);
                    if (success) {
                        msg.channel.send("Done");
                    } else {
                        msg.channel.send("Something went wrong, please contact my maker!!");
                    }
                } catch (error) {
                    globalLogs("Error creating entry " + error);
                    msg.channel.send("Something went wrong, please contact my maker!!");
                }
                break;
            case activator + "info":
                try {
                    var tagged_user = str[1].slice(3, -1);
                    var payload = {
                        "tUser": tagged_user,
                        "gId": msg.guild.id
                    }
                    var result = await service.search(payload, preReqs);
                    if (!result) {
                        msg.channel.send("Found nothing sorry :(");
                    } else {
                        var fstring = "";
                        for (var i of result.links) {
                            fstring = fstring + i.platform + " : " + i.url + "\n";
                        }
                        msg.channel.send(fstring);
                    }
                } catch (error) {
                    globalLogs("Error getting info " + error);
                    msg.channel.send("Something went wrong, please contact my maker!!");
                }
                break;
            case activator + "remove":
                break;
            case activator + "flip-table":
                var roll = Math.trunc(Math.random() * 20 + 1);
                if (roll > 15) {
                    msg.channel.send("<@" + msg.author.id + "> rolled a " + roll + " and flipped the table (╯°□°）╯︵ ┻━┻ (╯°□°）╯︵ ┻━┻");
                } else {
                    msg.channel.send("<@" + msg.author.id + "> rolled a " + roll + " ability check failed :(");
                }
                break;
            case activator + "h":
            case activator + "help":
                msg.channel.send("Here to help");
                break;
            default:
                msg.channel.send("Sorry, can't help you with that :(");
        }
        tOut = setTimeout(closeConnection, 60000);
    }
});

//Log function

function globalLogs(msg) {
    var d = new Date()
    var ts = "[" + d.getDate() + "/" + (parseInt(d.getMonth()) + 1) + "/" + d.getFullYear() + "-" + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "]";
    console.log(ts + " " + msg);
}