import { AgentThing } from "../agentThing";
async function main() {
    const config = require("./../../../config.json");
    
    const ownTD = "./../../src/td/manufacturing_demo/conveyor2_agent.td.json";
    let initialKnownAgents = {
        "conveyorThing": "http://172.16.1.154:8080/ConveyorBelt2",
        "infraredThing": "http://172.16.1.152:8080/InfraredSensor2"
    };
    let agent = new AgentThing(config.conveyor2, ownTD, initialKnownAgents);
    await agent.init();
}

main();