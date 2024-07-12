
import { RobotAgentThing } from "./robot_agents";

async function main() {
        const config = require("./../../config.json");

        // start robot 1 agent td
        // const ownTD1 = "./../src/td/robot_simulation/robot_1.td.json";
        const ownTD1 = "./../src/td/robot_simulation/robot_1_other_names.td.json";
        const lowerLayerAddress1 = "http://192.168.56.1:8082/coppeliasim_virtualrobot_ur3_robot_1";
        let initialKnownAgents1 = {
            "coppeliasim_sensor_agent": "http://192.168.56.1:8084/coppeliasim_sensor_agent", 
            "coppeliasim_robot_agent_0": "http://192.168.56.1:8085/coppeliasim_robot_agent_0"
        };
        const additionalOntology = {
            "blue": "ObjectBlue",
            "dealWith": "Process"
        };
            
        let robot_1 = new RobotAgentThing(config.robotArm1, ownTD1, initialKnownAgents1, lowerLayerAddress1, additionalOntology);
        robot_1.homePosition =  {"x": 0.45, "y": 0.05, "z": 0.6};
        await robot_1.init();
    
}

main();