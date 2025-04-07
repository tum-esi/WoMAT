import { AgentThing } from "../agentThing";


async function main() {
    const config = require("./../../../config.json");
    
    const ownTD = "./../../src/td/manufacturing_demo/ur10_agent.td.json";
    let initialKnownAgents = {
        "ur10Thing": "http://127.0.0.1:8080/ur10",
        "infraredThing": "http://172.16.1.152:8080/InfraredSensor2"
    };
    let agent = new AgentThing(config.ur10, ownTD, initialKnownAgents);
    await agent.init();
}

main();