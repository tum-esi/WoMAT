import { AgentMessage } from "../agentConnector";
import { AgentThing } from "../agentThing";



// class UarnAgentThing extends AgentThing {
//     lowerThing: any = null;
//     lowerTD: any = null;
//     lowerLayerAddress: string = "http://172.16.1.150:8080/uarm";
//     constructor(config: any, path2TD: string, initialKnownAgents: { [key: string]: string}) {
//         super(config, path2TD, initialKnownAgents);
//     }

//     protected async customInit(): Promise<boolean> {
//         // implement longer polling then node-wot would do
//         [this.lowerTD, this.lowerThing] = await this.fetchAgentTD(this.lowerLayerAddress);
//         return true;
//     }

//     protected async handleCustomAgentRequests(data: AgentMessage): Promise<boolean> {
//         if (data.targetAgentId == "uarmThing" && data.content.keyword == "location") {
//             let value
//             try {                    
//                 let location = await this.lowerThing.readProperty("location");
//                 value = await location.value();
//             } catch (error) {
//                 value = {"x": 0, "y": 0, "z": 0};
//             }
//             this.addBelief2Agent("newLocation", value, false, "uarmThing");
//             // setTimeout(async () => {
//             //     let value
//             //     try {                    
//             //         let location = await this.lowerThing.readProperty("location");
//             //         value = await location.value();
//             //     } catch (error) {
//             //         value = {"x": 0, "y": 0, "z": 0};
//             //     }
//             //     this.addBelief2Agent("location", value, "uarmThing");
//             // }, 500);
//             return true;
//         }
//         return false;
//     }
// }


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