import { AgentThing } from "../agentThing";
async function main() {
    const config = require("./../../../config.json");
    
    const ownTD = "./../../src/td/manufacturing_demo/conveyor1_agent.td.json";
    let initialKnownAgents = {
        "conveyorThing": "http://172.16.1.153:8080/ConveyorBelt1",
        "infraredThing": "http://172.16.1.153:8081/InfraredSensor1"
    };
    let agent = new AgentThing(config.conveyor1, ownTD, initialKnownAgents);
    await agent.init();
}

main();