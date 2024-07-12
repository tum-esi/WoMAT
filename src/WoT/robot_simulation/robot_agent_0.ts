
import { RobotAgentThing } from "./robot_agents";

async function main() {
        const config = require("./../../../config.json");

        // start robot 0 agent td
        const ownTD = "./../../src/td/robot_simulation/robot_0.td.json"; 
        const lowerLayerAddress0 = "http://192.168.56.1:8081/coppeliasim_virtualrobot_ur3_robot_0";   
        let initialKnownAgents0 = {
            "coppeliasim_sensor_agent": "http://192.168.56.1:8084/coppeliasim_sensor_agent", 
            "coppeliasim_robot_agent_1": "http://192.168.56.1:8086/coppeliasim_robot_agent_1"
        };       
        // ontology for values that are not represented in the TD 
        const additionalOntology = {
            "blue": "ObjectBlue",
            "process": "Process"
        };
        let robot_0 = new RobotAgentThing(config.robotArm0, ownTD, initialKnownAgents0, lowerLayerAddress0, additionalOntology);
        robot_0.homePosition =  {"x": 0.0, "y": 0.05, "z": 0.6} 
        await robot_0.init(); 
}

main();