import { AgentThing } from "../agentThing";
import { AgentMessage } from "../agentConnector";

async function main() {
    const config = require("./../../../config.json");
    
    const ownTD = "./../../src/td/agent2ThingTest/agent2Thing.td.json";
    let initialKnownAgents = {
        "coffeeMachine1": "http://remotelab.esi.cit.tum.de:8080/virtual-coffee-machine-1_2"
    };
    let agent = new AgentThing(config.agent2Thing, ownTD, initialKnownAgents);
    await agent.init();
}

main();