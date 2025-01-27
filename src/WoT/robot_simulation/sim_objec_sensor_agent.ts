import { AgentThing} from "../agentThing_performance_eval";
import { AgentMessage } from "../agentConnector";

// import for types
import { Servient, Helpers, ExposedThing } from "@node-wot/core";


// At this time, this is just a simple Thing that acts as a proxy for the layer below, not an agent

class ObjectSensorAgentThing extends AgentThing {
    areaStatus = "nothing";

    constructor(config: any, path2TD: string, initialKnownAgents: { [key: string]: string}) {
        super(config, path2TD, initialKnownAgents);
    }

    protected async setCustomInteractionAffordanceHandlers(producer: ExposedThing) {
        console.log("Setting custom handlers for the object sensor");

        // First setup connection to own Thing of the simulation and subscribe to changes.
        

        producer.setPropertyReadHandler("PickupAreaStatus", async () => {
            return this.areaStatus;
        });
        
        producer.setEventSubscribeHandler("objectDetected", async () => { 
             console.log("Subscribing to objectDetected event");
        });
    } 
    
    async run (): Promise<boolean> {

        let TD2Consume = "http://localhost:8083/coppeliasim_virtual_object_sensor"
        const [td, lowerThing] = await this.fetchAgentTD(TD2Consume);

        lowerThing.readProperty("objectPresent").then(async (data: any) => {
            let value = await data.value();
            let status = value["status"];
            if (status != "dice removal detected" && value["color"] != "null") {
                value = value["color"];
            } else {
                value = "nothing";
            }
            this.areaStatus = value;
            console.log("Initialized objectPresent with: ", value);
        });

        lowerThing.observeProperty("objectPresent", async (data: any) => {
            let value = await data.value();
            let status = value["status"];
            if (status != "dice removal detected" && value["color"] != "null") {
                value = value["color"];
            } else {
                value = "nothing";
            }
            console.log("Received property change from lower thing: ", value);
            this.areaStatus = value;
            this.producer.emitPropertyChange("PickupAreaStatus", value);
        });

        lowerThing.subscribeEvent("objectDetected", async (data: any) => {
            let value = await data.value();
            console.log("Received event from lower thing: ", value);
            this.producer.emitEvent("objectDetected", value);
        });

        return true;
    }
}

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}



async function main() {
    
        const path2TD = "./../../src/td/robot_simulation/object_sensor.td.json";
        const config = require("./../../../config.json");
    
        let initialKnownAgents = {};
        let sensorAgent = new ObjectSensorAgentThing(config.objectSensor, path2TD, initialKnownAgents);
        await sensorAgent.init();
        await delay(2000);
        await sensorAgent.run();
    
}

main();