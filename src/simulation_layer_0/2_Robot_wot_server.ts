
import { Servient } from '@node-wot/core';
import { HttpServer } from '@node-wot/binding-http';
import { Helpers } from '@node-wot/core';
import * as fs from 'fs';
import * as path from 'path';
const { RemoteAPIClient } = require("./remoteApi/RemoteAPIClient.js");

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class SimulationThings {
    sim: any;
    sceneName: string;
    pickupAreaStatus: string = "no object detected";
    pickupAreaColor: string = "null";
    constructor() {
        this.sim = null;
        this.sceneName = "two_robots_digital_twins_with_gripper.ttt"; // Update to just the filename
    }

    protected async initSim(address: string) {
        console.log('Hello...');
        const client = new RemoteAPIClient('localhost', 23050, 'json');
        console.log('Connecting...');
        await client.websocket.open();
        console.log('Getting proxy object "sim"...');
        let sim = await client.getObject('sim');

        // check the simulation state
        let simState = Number(await sim.getSimulationState());

        try {
            if (simState == Number(await sim.simulation_advancing_running)) {
                // if the simulation is running, stop the simulation first
                await sim.stopSimulation();
                await delay(500);
                await sim.loadScene(address);
            } else if (simState == Number(await sim.simulation_stopped)) {
                // if the simulation is not running, the load the CoppeliaSim scene
                await sim.loadScene(address);
                await delay(500);
            }
        } catch (error) {
            console.error(`Failed to load scene: ${error.message}`);
            throw error;
        }

        await delay(500);
        this.sim = sim;
        return sim;
    }

    async init() {
        try {
            // Use the correct path relative to the dist folder
            let sceneAddress = path.join(__dirname, '../..', 'src', 'simulation_layer_0', this.sceneName);
            if (!fs.existsSync(sceneAddress)) {
                throw new Error(`Scene file does not exist at ${sceneAddress}`);
            }
            var sim = await this.initSim(sceneAddress); // initialize scene and sim        

            // robot WoT server 
            // create Servient add HTTP binding with port configuration

            // add robot servients.
            let server1 = new Servient();
            server1.addServer(
                new HttpServer({
                    port: 8081, // set port 8081 as request
                })
            );
            server1.start().then(async (WoT) => {
                await this.connectRobotThing2Simulation(WoT, sim, "/ur3_robot_0");
            });
            console.log("Robot 0 exposed on 192.168.56.1:8081");

            let server2 = new Servient();
            server2.addServer(
                new HttpServer({
                    port: 8082, // set port 8082 as request
                })
            );
            server2.start().then(async (WoT) => {
                await this.connectRobotThing2Simulation(WoT, sim, "/ur3_robot_1");
            });
            console.log("Robot 1 exposed on 192.168.56.1:8082");

            // add "sensor" servients
            let server3 = new Servient();
            server3.addServer(
                new HttpServer({
                    port: 8083, // set port 8081 as request
                })
            );
            let wot = await server3.start();
            let [thing, sensorScriptHandle] = await this.connectSensor(wot, sim);
            console.log("Sensor exposed on  192.168.56.1:8083");

            // wait until everything is running
            await delay(1000);
            console.log("Starting to poll Sensor values.")
            setInterval(async () => {
                let response = await sim.callScriptFunction("SenseDicePickupArea", sensorScriptHandle);
                let color = response[1];
                let detected = response[0]; // the simulation script returns an array, the first element is the detection status
                if (detected != "no changes") {
                    let content = { "status": detected, "x": 0.2, "y": 0.4, "z": 0.1, "color": color };
                    this.pickupAreaStatus = detected;
                    this.pickupAreaColor = color;
                    thing.emitEvent("objectDetected", content);
                    thing.emitPropertyChange("objectPresent", content);
                    console.log("emit PropertyChange objectDetected: " + content["status"]);
                }
            }, 500);

        } catch (error) {
            console.error(`Initialization failed: ${error.message}`);
        }
    }


    async getScriptHandle(sim: any, objectName: string) {
        console.log("Getting Script for: " + objectName)
        let fileName;
        if (objectName == "PickupAreaManager") {
            fileName = "./src/simulation_layer_0/pickupAreaManager_driver.txt";   
        }else {
            console.log("Error: Invalid object name");
            return -1;
        }

        objectName= "/" + objectName

        let fileContent = fs.readFileSync(fileName, 'utf8');
        let scriptHandle = Number(await sim.addScript(1)); // add sim.scripttype_childscript 1
        // let objectHandle = Number(await sim.getObject(objectName));
        let objectHandle
        try {
            objectHandle = Number(await sim.getObject(objectName));
            // Proceed with the rest of your operations using objectHandle
        } catch (error) {
            console.error("Failed to get object handle:", error);
            return;
        }
        

        let checkScripthandle = await sim.getScript(1, objectHandle, objectName);
        if (checkScripthandle[0] != -1){
            console.log(checkScripthandle);
            await sim.removeScript(checkScripthandle[0]); // when the script exists
        }

        await sim.setScriptStringParam(scriptHandle,Number(await sim.scriptstringparam_text),fileContent); // load code to script
    
        await sim.associateScriptWithObject(scriptHandle, objectHandle); // success 
    
        let Scripthandle = Number(await sim.getScript(1, objectHandle,objectName));
        
        return Scripthandle;
    }

    async loadRobotdriver(sim:any, robotName:string) {
        console.log("Robot Name: " + robotName)
        const fileName = "./src/simulation_layer_0/robot_driver.txt";
        let fileContent = fs.readFileSync(fileName, 'utf8');
        
        let scriptHandle = Number(await sim.addScript(1)); // add sim.scripttype_childscript 1
    
        let objectHandle = Number(await sim.getObject(robotName));
    
        let checkScripthandle = await sim.getScript(1, objectHandle, robotName);
        if (checkScripthandle[0] != -1){
            console.log(checkScripthandle);
            await sim.removeScript(checkScripthandle[0]); // when the script exists
        }
    
        await sim.setScriptStringParam(scriptHandle,Number(await sim.scriptstringparam_text),fileContent); // load code to script
    
        await sim.associateScriptWithObject(scriptHandle, objectHandle); // success 
    
        let robotScripthandle = Number(await sim.getScript(1, objectHandle,robotName));
        
        return robotScripthandle
    }

    async connectSensor(WoT: any, sim: any) {
        let td = JSON.parse(fs.readFileSync("./src/simulation_layer_0/object_sensor.td.json", "utf8"));

        const thing = await WoT.produce(td);

        // WoT.produce(td).then(async(thing: any) => {
            console.log("Produced " + thing.getThingDescription().title);

            //  get script handle 
            // let scriptHandle = await this.getScriptHandle(sim, "DummyObjectSensor");
            let scriptHandle = await this.getScriptHandle(sim, "PickupAreaManager");

            thing.setPropertyReadHandler("objectPresent", async() => {
                let content = {"status": this.pickupAreaStatus, "x": 0.2, "y": 0.4, "z": 0.1, "color": this.pickupAreaColor};
                return content;
            });

            thing.setPropertyObserveHandler("objectPresent", async() => {
            });

            thing.setEventSubscribeHandler("objectDetected", async() => {
            });

            // expose the thing
            await thing.expose();
            console.log("Exposed " + thing.getThingDescription().title);
            return [thing, scriptHandle];
        
    }

    async connectRobotThing2Simulation(WoT: any, sim: any, robotName: string) {
        let robotInstance;
        if (robotName == "/ur3_robot_0") {
            robotInstance = JSON.parse(fs.readFileSync("./src/simulation_layer_0/ur3_robot_instance_0.json", "utf8"));
        } else if (robotName == "/ur3_robot_1") {
            robotInstance = JSON.parse(fs.readFileSync("./src/simulation_layer_0/ur3_robot_instance_1.json", "utf8"));
        } else {
            console.log("Error: Invalid robot name");
            return;
        }
        WoT.produce(robotInstance).then(async(thing: any) => {
            console.log("Produced " + thing.getThingDescription().title);
           
            let scriptHandle = await this.loadRobotdriver(sim, robotName); // robot could be fetched from the td 
            // let scriptHandle_1 = await loadRobotdriver(sim,"/ur3_robot_1"); // robot could be fetched from the td 
    
            console.log("loadScript" + scriptHandle);
            await sim.startSimulation();
            await delay(1000);
    
            // set property handlers (using async-await)
            // set getJointposition propety handlers
            thing.setPropertyReadHandler("getJointposition", async() => 
            (await sim.callScriptFunction("getJointposition", scriptHandle))[0]);
    
            // set getCartesianposition property handlers
            thing.setPropertyReadHandler("getCartesianposition", async() => 
            (await sim.callScriptFunction("getCartesianposition", scriptHandle))[0]);

            thing.setActionHandler("moveToJointPosition", async(data: any) => {
                let jointPosition = await data.value();
                let payload = [jointPosition["joint1"], jointPosition["joint2"], jointPosition["joint3"], jointPosition["joint4"], jointPosition["joint5"], jointPosition["joint6"]];
                console.log("moveToJointPosition: " + payload);
                await sim.callScriptFunction("moveTojoint", scriptHandle, payload);
                await this.waitToStopMovement(sim, scriptHandle);
                return "success";
            });
    
    
            // set moveTocartesianPosition action handlers
            thing.setActionHandler("moveTocartesianPosition", async(data: any) =>{
                try {
                    let cartPos:any = await data.value();
                    // let cartPosval = [cartPos["x"], cartPos["y"], cartPos["z"],0,-0.707,0,-0.707];
                    let cartPosval = [cartPos["x"], cartPos["y"], cartPos["z"],0.707,0,0.707,0.];
                    await sim.callScriptFunction("moveToPosition", scriptHandle, cartPosval);

                    // wait until the robot has stopped moving
                    await this.waitToStopMovement(sim, scriptHandle);  
                    return "success";
                }
                catch{
                    return "failed";
                }
            });   
            
            thing.setActionHandler("gripObject", async(data: any) =>{
                try {
                    // grip on dice object that is close to the suctionPad.                
                    let result = await sim.callScriptFunction("gripDynamicObject", scriptHandle);
                    await this.waitToStopMovement(sim, scriptHandle);
                    result = result[0];
                    console.log("gripObject: " + result);
                    return result;
                }
                catch{
                    return "error";
                }
            });  
    
            thing.setActionHandler("dropObject", async(data: any) =>{
                try {  
                    // drop the dice object that is gripped by the suctionPad.           
                    let result = await sim.callScriptFunction("dropDynamicObject", scriptHandle);
                    result = result[0];
                    console.log("dropObject: " + result);
                    return result;
                }
                catch{
                    return "error";
                }
            });  
    
    
            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                // console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });
        });
    
    }

    async waitToStopMovement(sim: any, scriptHandle: any) {
        let moving = true;
        while (moving) {
            await delay(100); // it is important to wait at the beginning to allow the simScript to set the moving variable to true
            let response = await sim.callScriptFunction("isRobotMoving", scriptHandle);
            moving = response[0];
        }
        return;
    }
}

async function main() {
    let simulationThings = new SimulationThings();
    await simulationThings.init();
}

main().catch(error => {
    console.error(`Main function failed: ${error.message}`);
});
