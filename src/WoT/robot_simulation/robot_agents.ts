import { AgentThing } from "../agentThing_performance_eval";
import { AgentMessage } from "../agentConnector";


// import for types
import { Servient, Helpers, ExposedThing } from "@node-wot/core";



// let ownTD = require("./../src/td/robot_simulation/robot_0.td.json");

let pickupPosition = {"x": 0.2, "y": 0.4, "z": 0.1};
let dropPosition = {"x": 0.23, "y": -0.35, "z": 0.3} 
let redDropPostion = {"x": 0.3, "y": -0.05, "z": 0.4}
let blueDropPosition = {"x": 0.05, "y": -0.05, "z": 0.4} 

export class RobotAgentThing extends AgentThing {
    lowerThing: any = null;
    lowerTD: any = null;
    homePosition = {"x": -0.1, "y": 0.0, "z": 0.4};
    lowerLayerAddress: string = "";

    constructor(config: any, path2TD: string, initialKnownAgents: { [key: string]: string}, lowerLayerAddress: string = "", additionalOntology: any = {}) {
        super(config, path2TD, initialKnownAgents, additionalOntology);
        this.lowerLayerAddress = lowerLayerAddress;
    }

    protected async customInit(): Promise<boolean> {
        try {
            [this.lowerTD, this.lowerThing] = await this.fetchAgentTD(this.lowerLayerAddress);
        } catch (error) {
            console.error("Failed to connect to own lower level Thing. Please start it first. \n Error fetching TD of lower thing: ", error);
            return false;
        }
        await this.lowerThing.invokeAction("moveTocartesianPosition", this.homePosition);
        return true;
    }

    protected async handleCustomAgentRequests(data: AgentMessage): Promise<boolean> {
        // return true if the request was handled, else false
        let targetAgentId = data.targetAgentId;
        let keyword = data.content.keyword;
        let value = data.content?.value?? false;
        if (targetAgentId == "ownLayer1") { 
            // always allow both keywords to handle both naming conventions
            if (keyword == "moveTo" || keyword == "moveAt") {
                let payload = {"x": value[0], "y": value[1], "z": value[2]};
                console.log("Received request to move to position: ", payload);
                let result = await this.lowerThing.invokeAction("moveTocartesianPosition", payload);
                await this.addBelief2Agent("movedTo", value, "ownLayer1");
                return true;
            } else if  (keyword == "gripObject" || keyword == "take") {
                let result = await this.lowerThing.invokeAction("gripObject");
                this.addBelief2Agent("grippedObject", [], "ownLayer1");
                return true;
            } else if  (keyword == "dropObject" || keyword == "release") {
                let result = await this.lowerThing.invokeAction("dropObject");
                this.addBelief2Agent("droppedObject", [], "ownLayer1");
                return true;
            } else if  (keyword == "goHome" || keyword == "homeing") {
                let result = await this.lowerThing.invokeAction("moveTocartesianPosition", this.homePosition);
                this.addBelief2Agent("movedTo", ["home"], "ownLayer1");
                return true;
            }
        }

        
        return false;
    }

}

// async function main() {
//         const config = require("./../../config.json");

//         // start robot 0 agent td
//         const ownTD = "./../src/td/robot_simulation/robot_0.td.json"; 
//         const lowerLayerAddress0 = "http://192.168.56.1:8081/coppeliasim_virtualrobot_ur3_robot_0";   
//         let initialKnownAgents0 = {
//             "coppeliasim_sensor_agent": "http://192.168.56.1:8084/coppeliasim_sensor_agent", 
//             "coppeliasim_robot_agent_1": "http://192.168.56.1:8086/coppeliasim_robot_agent_1"
//         };
//         let robot_0 = new RobotAgentThing(config.robotArm0, ownTD, initialKnownAgents0, lowerLayerAddress0);
//         await robot_0.init();
//         robot_0.homePosition = {"x": -0.1, "y": -0.2, "z": 0.4};

//         // start robot 1 agent td
//         const ownTD1 = "./../src/td/robot_simulation/robot_1.td.json";
//         const lowerLayerAddress1 = "http://192.168.56.1:8082/coppeliasim_virtualrobot_ur3_robot_1";
//         let initialKnownAgents1 = {
//             "coppeliasim_sensor_agent": "http://192.168.56.1:8084/coppeliasim_sensor_agent", 
//             "coppeliasim_robot_agent_0": "http://192.168.56.1:8085/coppeliasim_robot_agent_0"
//         };
//         let robot_1 = new RobotAgentThing(config.robotArm1, ownTD1, initialKnownAgents1, lowerLayerAddress1);
//         await robot_1.init();
//         robot_1.homePosition = {"x": 0.6, "y": 0.2, "z": 0.4};
    
// }

// main();