import { AgentConnector, AgentMessage } from "./agentConnector";
import { Servient, Helpers, ExposedThing } from "@node-wot/core";
import { HttpServer } from "@node-wot/binding-http";
import { HttpClientFactory } from "@node-wot/binding-http";

import { planString2OntologyPlanObject, OntologyPlanObject2TargetPlanObject, TargetPlanObject2CommandString, AdditionalOntology, planLabel2OntologyLabel, ontologyLabel2planLabel } from "./plan_translator";

import * as fs from 'fs';
// Function to log data to a file
function logToFile(filename: string, data: string) {
    fs.appendFileSync("performance_log/" + filename, data + '\n', (err) => {
        if (err) throw err;
    });
}

logToFile("translation_time.txt", "Start logging translation times");



export class AgentThing {
    protected agentConnector: AgentConnector;
    protected thingConfig: any;
    protected thingDescrpiption: any;
    protected servient: Servient;
    protected producer: any;
    protected woT: any;
    protected TDurl: string;
    protected parsedTD: object;
    protected wotHelper: any;
    protected knownAgents: { [key: string]: string};
    protected subscriptions: { [targetAgentName: string]: {[keyword: string]: any} };
    protected additionalOntology: AdditionalOntology;  // for plan labels and input that shall be translated (not in TD)
    public logginLevel: number = 1;  // 0: log erros, 1: log erros and IA on me / when I invoke IA on others, 2: log IAs with longer input/output, 3: log everything (also messages to wotCommunicator)

    constructor(config: any, path2TD: string, initialKnownAgents: { [key: string]: string}, additionalOntology: AdditionalOntology) { // later also TD?
        this.thingConfig = config;
        this.thingDescrpiption = require(path2TD);
        this.servient = new Servient();
        this.agentConnector = new AgentConnector(this.thingConfig.websocketPort);
        this.woT = null;
        this.wotHelper = null;
        this.knownAgents = initialKnownAgents;
        this.subscriptions = {};
        this.TDurl = "";
        this.parsedTD = {"actions": {}, "properties": {}, "events": {}};
        this.additionalOntology = additionalOntology;
    }

    // Custom functions to be overwritten by subclasses.
    protected customInit() {
        if (this.logginLevel > 0) {
            console.log("No custom initialization implemented.");
        }
    }

    protected async handleCustomAgentRequests(data: AgentMessage): Promise<boolean> {
        /* Handles requests from the local agent to the agentThing.
        This can be used to customly set how an agent request should be translated into the WoT world. */

        // return true if the request was handled, else false
        if (this.logginLevel > 0) {
            console.log("No custom handling of agent requests implemented.");
        }
        return false;
    }

    protected async setCustomInteractionAffordanceHandlers(producer: ExposedThing) {
        /* Sets custom interaction affordance handlers for the Thing.
        Here should be defined how InteractionAffordances shall be signaled to the local agent, besides the ways set in this.produce */
        if (this.logginLevel > 0) { console.log("No custom Interaction Affordance Handlers set."); }
    }

    public async init() {
        // init to the producer part
        this.servient.addServer(new HttpServer({ port: this.thingConfig.TDPort }));
        Helpers.setStaticAddress(this.thingConfig.staticAddress);
        
        // init the consumer part
        this.servient.addClientFactory(new HttpClientFactory(null));
        this.wotHelper = new Helpers(this.servient);

        this.servient.start().then(async (WoT: any) => {
            this.woT = WoT;
            // start agent connector server to be able to communicate locally with the agent
            this.agentConnector.connect(this.handleAgentRequests.bind(this));
            // start the producer part
            this.producer = await this.produce();
        });

        // // Start handling keyboard input                 
        // process.stdin.on('data', (data) => {
        //     const key = data.toString();
        //     console.log("Key pressed: ", key)
        //     if (key == 'q') { process.exit(); } 
        //     else {
        //         console.log('Invalid key pressed. Press q to quit.');
        //         return;
        //     }                     
        // });

        this.customInit();
    }

    private isArrayOfStrings(array: any): array is Array<string> {
        return Array.isArray(array) && array.every(item => typeof item === 'string');
    }

    private async autoSetIAHandlers(producer: ExposedThing, TD: string) {
        /* Automatically Set Interaction Affordance Handlers to forward requests to it to the agent. 
        Crawl the own TD and set handlers for all Interaction Affordances.
        */

        const TDparsed = JSON.parse(TD);
        this.parsedTD = TDparsed;
        let actions = TDparsed.actions;
        let properties = TDparsed.properties;
        let events = TDparsed.events;

        // Set property read handlers
        // No observe handler is necessary. emitPropertyChange is called always when property changes
        Object.entries(properties).forEach(([propertyName,propertyDetails]) => {
            producer.setPropertyReadHandler(propertyName, async () => {
                if (this.logginLevel > 0) { console.log("Reading property: ", propertyName); }

                let response = await this.addTestGoal2Agent(propertyName, [],  true, "unknown");
                if (this.logginLevel > 1 ) { console.log("Answer for readProperty: ", propertyName, " :", response);}
                else if (this.logginLevel > 0) { console.log("Answer for readProperty: ", propertyName); }

                if (response == null) {
                    return;
                } else {
                    return response;
                }  
            });
        });

        Object.entries(actions).forEach(([actionName, actionDetails]) => {
            let hasInput = actionDetails?.input?? false;
            let hasOutput = actionDetails?.output?? false;
            producer.setActionHandler(actionName, async (params: any) => {
                // first see if the action has an input
                let inputValue = null;
                // check if the action takes an input
                let valueType = "none";
                if (hasInput == false) {
                    inputValue = null;
                } else {
                    inputValue = await params.value();
                }
                if (this.logginLevel > 1) { console.log("Action: ", actionName, " with input: ", inputValue); }
                else if (this.logginLevel > 0) { console.log("Action was invoked: ", actionName); }  

                let content = {"keyword": actionName, "value": inputValue};
                let response = await this.addAchieveGoal2Agent(actionName, inputValue, hasOutput, "unknown");
                if (this.logginLevel > 1 ) { console.log("Answer for action: ", actionName, " :", response);}
                else if (this.logginLevel > 0) { console.log("Answer for action: ", actionName); }
                if (response == null) {
                    return;
                } else {
                    return response;
                }        
            });
        });

        // overwrite the auto set handlers
        producer.setActionHandler("askHow", async (params: any) => {
            let total_execution_time = 0;
            let label_translation_time = 0;
            let plan_translation_time = 0;
            let end_time = 0
            let total_start = performance.now();


            let input = await params.value();
            let planLabel = input["planLabel"];
            let label_start_time = performance.now();
            planLabel = ontologyLabel2planLabel(planLabel, this.additionalOntology);
            label_translation_time = performance.now() - label_start_time;
            let targetTDAdress = input["targetTDAdress"];
            // if (this.logginLevel > 1) { console.log("Action askHow for planLabel: ", planLabel, " and target TD: ", targetTDAdress); }
            // else if (this.logginLevel > 0) { console.log("Action askHow was invoked for planLabel: ", planLabel); }
            // first ask the agent for the plans matching the label
            let content = {"keyword": "{ +" + planLabel + "} "};  // adjust the plan Trigger to match the literal needed in .relevant_plans
            let agentMessage = new AgentMessage("askHow", "", "", content);
            let data = await this.agentConnector.send2AgentAndWaitForResponse(agentMessage)

            if (! this.isArrayOfStrings(data.content)) {
                if (this.logginLevel > 0) { console.log("No plans found for planLabel: ", planLabel, " and targetTD: ", targetTDAdress); }
                return [];
            } else {
                let [target_td, otherAgent] = await this.fetchAgentTD(targetTDAdress);
                let response = [];
                for (let planString of data.content ) {
                    let plan_translation_start_time = performance.now();
                    if (planString.includes("wotExchangable")) {
                        let reduced = this.stripMetadataFromPlanString(planString);
                        let planStringOntology = planString2OntologyPlanObject(reduced, TDparsed, this.additionalOntology);
                        let targetPlanObject = OntologyPlanObject2TargetPlanObject(planStringOntology, target_td);
                        response.push(targetPlanObject);
                    }
                    plan_translation_time = performance.now() - plan_translation_start_time;
                } 
                if (this.logginLevel == 1) { console.log("Plans found for planLabel: ", planLabel, " and targetTD: ", targetTDAdress); }
                else if (this.logginLevel >= 2) { console.log("Plans found for planLabel: ", planLabel, " and targetTD: ", targetTDAdress, " : ", response); }
                total_execution_time = performance.now() - total_start;
                let log_message = "label: " + planLabel + " label_translation_time: " + label_translation_time + " plan_translation_time: " + plan_translation_time + " total_execution_time: " + total_execution_time;
                console.log(log_message);
                logToFile("translation_time_1.txt", log_message);
                return response;
            }
        });
        producer.setActionHandler("tell", async (params: any) => {
            try {
                let message = await params.value();
                let keyword = message["belief"];
                let values = message["values"]?? null;
                if (this.logginLevel > 1) { console.log("Action tell was invoked with params: ", message); }
                else if (this.logginLevel > 0) { console.log("Action tell was invoked"); }
                await this.addBelief2Agent(keyword, values, false, "unknown");
            } catch (error) {
                console.error("Error in action handler for 'tell':", error);
                // Re-throw the error or handle it appropriately
                throw error; // This will ensure that the error is communicated back to the consumer.
            }
            return;
            
        });
        producer.setActionHandler("send", async (params: any) => {
            try {
                let message = await params.value();
                if (this.logginLevel > 0) { console.log("Action send was invoked"); }
                else if (this.logginLevel > 1) { console.log("Action send was invoked with params: ", message); }
                this.agentConnector.forward2Agent(message);
            } catch (error) {
                console.error("Error in action handler for 'send':", error);
                // Re-throw the error or handle it appropriately
                throw error; // This will ensure that the error is communicated back to the consumer.
            }
            return;
        });

    }

    private stripMetadataFromPlanString(planString: string) {
        // Regular expression targets the pattern starting with '@p' followed by any characters
        // until it reaches the closing ']' bracket.

        // makes this { @p__11[source(self),url("file:src/agt/robot_0_agent.asl"),wotExchangable] +!process(blue) <- !moveTo(0.05,-0.05,0.4); !dropObject }
        // to this: { +!process(blue) <- !moveTo(0.05,-0.05,0.4); !dropObject }
        // needed for plan exchange
        const regex = /@\w+\[[^\]]+\]\s*/g;  // The 'g' flag is used to replace all occurrences
    
        // Replace the identified pattern with an empty string
        const cleanedString = planString.replace(regex, '');
    
        return cleanedString;
    }

    private async produce() {
        // write this function such that it can be also written in another file from the developer
        const producer = await this.woT.produce(this.thingDescrpiption);
        
        this.autoSetIAHandlers(producer, JSON.stringify(this.thingDescrpiption));

        // Set custom interaction affordance handler after automatic handlers to overwrite them if necceassary
        await this.setCustomInteractionAffordanceHandlers(producer);

        await producer.expose()
        let title = producer.getThingDescription().title.toLowerCase();
        this.TDurl = "http://" + this.thingConfig.staticAddress + ":" + this.thingConfig.TDPort + "/" + title
        console.info("TD is exposed at " + this.TDurl)
        return producer;
    }

    protected async fetchAgentTD(TD2Consume: string) {
        /* Fetches the TD of the agent to consume. 
        
        Also returns the agent object on which interaction affordances can be invoked. */
        const td = await this.wotHelper.fetch(TD2Consume);
        const otherAgent = await this.woT.consume(td);
        return [td, otherAgent];
    }

    private async consumeTargetAgent(targetAgentId: string) {
        // get the target agent from the known agents
        let targetAgent = this.knownAgents[targetAgentId];
        if (targetAgent == undefined) {
            console.log("Unknown target agent: ", targetAgentId);
            return [null, null];
        }
        let [td, otherAgent] = await this.fetchAgentTD(targetAgent);
        return [td, otherAgent];
    }

    private async handleAgentRequests(agentMessage: AgentMessage) {
        // handles the requests from the agent artifact behind the local websocket
        // forwards the agent requests to other TDs
        if (this.logginLevel > 2) { console.log("Received message from local agent: ", agentMessage); }
        // First execute custom handlers
        let customHandled = await this.handleCustomAgentRequests(agentMessage);

        if (customHandled == false) {
            const keyword = agentMessage.content?.keyword ?? false;
            const performative = agentMessage.performative;
            // the agent performatives are matched to the affordances of the TD.    

            // Here happens the part where agent performatives are translated into invoking affordances on a TD of some other Thing.
            if ((performative ==  "askOne" || "askAll" || "achieve" || "tell" || "askHow") && keyword != false) {

                let path = agentMessage.content?.path ?? false;
                
                if (performative == "askOne") {
                    let targetAgentName = agentMessage.targetAgentId;
                    let [td, otherAgent] = await this.consumeTargetAgent(targetAgentName);
                    if (otherAgent == null) {
                        console.log("Error: Unknown target agent: ", targetAgentName);
                        return;
                    }

                    // if the agent parses a AgentBeliefName, this should be used as the keyword signaled back to the agent and then used to add the belief.
                    let AgentBeliefName = agentMessage.content?.AgentBeliefName ?? keyword;             

                    let observe = agentMessage.content?.observe ?? null;
                    if (observe == true) { 
                        // start observing the property
                        let [ia2invoke, property2read] = await this.findIA2InvokeInTD(td, keyword, path);
                        if (this.logginLevel > 0 ) { console.log("Observing: ", ia2invoke, ":", property2read, " for my name: ", keyword); }
                        if (ia2invoke == "properties") {
                            // first read the property to get the initial value
                            let answer = await otherAgent.readProperty(property2read);
                            let value = await answer.value();
                            await this.addBelief2Agent(AgentBeliefName, value, false, targetAgentName);
                            // then observe the property
                            let subscription = await otherAgent.observeProperty(property2read, async (data) => {
                                // Immediately-Invoked Function Expression (IIFE) to use async/await inside the callback
                                let value = await data.value();
                                if (this.logginLevel > 0) { console.log("Observed ", property2read, " for my name: ", keyword, ": ", value); }
                                await this.addBelief2Agent(AgentBeliefName, value, false, targetAgentName);
                            });
                            // store the subscription to be able to stop it later
                            if (this.subscriptions[targetAgentName] == undefined) {
                                this.subscriptions[targetAgentName] = {};
                            }
                            this.subscriptions[targetAgentName][keyword] = subscription;
                        } else if (ia2invoke == "events") {
                            let subscription = await otherAgent.subscribeEvent(property2read, async (data) => {
                                // Immediately-Invoked Function Expression (IIFE) to use async/await inside the callback
                                let value = await data.value();
                                if (this.logginLevel > 0) { console.log("Got event ", keyword, ": ", value);}
                                await this.addBelief2Agent(AgentBeliefName, value, false, targetAgentName);
                            });
                            if (this.subscriptions[targetAgentName] == undefined) {
                                this.subscriptions[targetAgentName] = {};
                            }
                            this.subscriptions[targetAgentName][keyword] = subscription;
                        }
                    } else if (observe == false && this.subscriptions[targetAgentName][keyword] != undefined) {
                        // stop observing
                        if (this.logginLevel > 0) { console.log("Stop observing: ", keyword);}
                        let subscription = this.subscriptions[targetAgentName][keyword];
                        await subscription.stop();
                        await this.subscriptions[targetAgentName][keyword].stop();
                    }  else { 
                        // if no observe or unobserve, just a simple read
                        let [ia2invoke, property2read] = await this.findIA2InvokeInTD(td, keyword, path);
                        let answer = await otherAgent.readProperty(property2read);
                        let value = await answer.value();
                        await this.addBelief2Agent(AgentBeliefName, value, false, targetAgentName);          
                    }
                    
                } else if (performative == "askAll") {
                    Object.entries(this.knownAgents).forEach(async ([agentName, agenturl]) => {
                        let AgentBeliefName = agentMessage.content?.AgentBeliefName ?? keyword;  
                        let [td, otherAgent] = await this.consumeTargetAgent(agentName);
                        let [ia2invoke, property2read] = await this.findIA2InvokeInTD(td, keyword, path);
                        let answer = await otherAgent.readProperty(property2read);
                        let value = await answer.value();
                        await this.addBelief2Agent(AgentBeliefName, value, false, agentName);  
                    });
                } else if (performative == "achieve") {
                    if (this.logginLevel > 0) {console.log("Achieve: ", agentMessage.content);}
                    // forward the request to the other agent as agent message
                    let targetAgentName = agentMessage.targetAgentId;
                    let [td, otherAgent] = await this.consumeTargetAgent(targetAgentName);
                    if (otherAgent == null) {
                        console.log("Achieve: ", agentMessage.content, "failed. Unknown target agent: ", targetAgentName);
                        return;
                    }
                    let [ia2invoke, action2invoke] = await this.findIA2InvokeInTD(td, keyword, path);

                    // invoke action either with or without value
                    let value = agentMessage.content?.value ?? null;
                    let data = null
                    if (value != null) {
                        data = await otherAgent.invokeAction(action2invoke, value);
                    } else {
                        data = await otherAgent.invokeAction(action2invoke);
                    }
                    // if the action has an output, return the output to the agent
                    // ToDo: this is not yet implemented
                
                } else if (performative == "tell") {
                    // if this tell is a property of my own, change the value in the property and emitPropertyChange if its observeable
                    let targetAgentName = agentMessage.targetAgentId;
                    if (this.parsedTD.properties[keyword] != undefined && targetAgentName == "") {
                        this.producer.emitPropertyChange(keyword, agentMessage.content.value);
                        return;
                    }
                    // else try to write the property of the other agent or invoke the tell action


                    // tell the other agent is translated to writing the property of name keyword
                    // if this property does not exists, the tell action is invoked
                    // let targetAgentName = agentMessage.targetAgentId;
                    let [td, otherAgent] = await this.consumeTargetAgent(targetAgentName);
                    if (otherAgent == null) {
                        console.log("Tell failed. Unknown target agent: ", targetAgentName);
                        return;
                    }
                    let keyword = agentMessage.content?.keyword ?? null;
                    let value = agentMessage.content?.value ?? null;
                    let [ia2invoke, property2write] = await this.findIA2InvokeInTD(td, keyword, path);
                    if (ia2invoke == "properties" && property2write != null && value != null) {
                        if (this.logginLevel > 0) {console.log("Writing property: ", property2write, " with value: ", value);}
                        await otherAgent.writeProperty(property2write, value);
                    } else {
                        let content;
                        if (value == null) {
                            content = {"keyword": keyword};
                        } else { 
                            if (Array.isArray(value)) {
                                content = {"belief": keyword, "values": value}; 
                            } else {
                                content = {"belief": keyword, "values": [value]}; 
                            }
                        }
                        if (this.logginLevel > 0) {console.log("Invoking tell action with content: ", content);}
                        await otherAgent.invokeAction("tell", content);
                    }
                
                } else if (performative == "askHow") {
                    let targetAgentName = agentMessage.targetAgentId;
                    let [td, otherAgent] = await this.consumeTargetAgent(targetAgentName);
                    if (otherAgent == null) {
                        console.log("Unknown target agent: ", targetAgentName);
                        return;
                    }
                    let planTrigger = agentMessage.content?.keyword ?? null;
                    planTrigger = planLabel2OntologyLabel(planTrigger, this.additionalOntology);
                    let content = { "planLabel": planTrigger,
                                    "targetTDAdress": this.TDurl
                    };
                    let data = await otherAgent.invokeAction("askHow", content);
                    let PlanObjects = await data.value();
                    if (PlanObjects.empty) {
                        if (this.logginLevel > 0) { console.log("No plans found for planLabel: ", planTrigger); }
                        return;
                    }
                    PlanObjects.forEach(planObject => {
                        if (this.logginLevel > 1) { console.log("Received Plan Object for ", planTrigger); }
                        else if (this.logginLevel > 0) { console.log("Received Plan Object for ", planTrigger, ": ", planObject); }
                        let planString = TargetPlanObject2CommandString(planObject, this.additionalOntology);
                        let content = {"keyword": "askHowResponse", "planString": planString};  // Creating content for each plan
                        this.agentConnector.forward2Agent(new AgentMessage("askHowResponse", targetAgentName, "", content));
                    });
                    return;
                
                } else {
                    console.log("Unknown performative: ", performative);
                }
            } else {
                 // forward the request to the other agent as agent message
                let targetAgent = agentMessage.targetAgentId;  // this should be the TD2Consume
                if (targetAgent == undefined) {
                    console.log("Unknown target agent: ", agentMessage.targetAgentId);
                    return;
                }
                let [td, otherAgent] = await this.fetchAgentTD(targetAgent);
                // console.log("Fetched TD of target agent: ", td.title, " invoking: ", data.content);
                await otherAgent.invokeAction("send", {
                    performative: agentMessage.performative,
                    sourceAgentId: agentMessage.sourceAgentId,
                    targetAgentId: agentMessage.targetAgentId,
                    content: agentMessage.content,
                    messageId: -1,
                });
            }
             // todo: add logic to match target agent with TD2Consume
        }        
    }

    protected async addBelief2Agent(beliefName: string, values: Array<string | number>, response_expected: boolean = false, source: string = "unknown") {
        // sends a message to the artifact that then adds the belief
        let agentMessage = new AgentMessage("tell", source, "", {"keyword": beliefName, "values": values});
        if (response_expected == true) {
            let data = await this.agentConnector.send2AgentAndWaitForResponse(agentMessage);
            let response = data.content?.value?? null;
            return response;
        } else {
            await this.agentConnector.send2Agent(agentMessage);
        }
    }

    protected async addAchieveGoal2Agent(goalName: string, values: Array<string | number>, response_expected: boolean = false, source: string = "unknown") {
        // sends a message to the artifact that then adds the goal
        let agentMessage = new AgentMessage("achieve", source, "", {"keyword": goalName, "values": values});
        if (response_expected == true) {
            let data = await this.agentConnector.send2AgentAndWaitForResponse(agentMessage);
            let response = data.content?.value?? null;
            return response;
        } else {
            await this.agentConnector.send2Agent(agentMessage);
            return null;
        }        
    }

    protected async addTestGoal2Agent(goalName: string, values: Array<string | number> = [], response_expected: boolean = false, source: string = "unknown") {
        // sends a message to the artifact that then adds the goal
        let agentMessage = new AgentMessage("ask", source, "", {"keyword": goalName, "values": values});
        if (response_expected == true) {
            let data = await this.agentConnector.send2AgentAndWaitForResponse(agentMessage);
            let response = data.content?.value?? null;
            return response;
        } else {
            await this.agentConnector.send2Agent(agentMessage);
            return null;
        }
    }
    
    protected async readProperty(ThingURL: string, keyword: string, path: string) { 
        let [td, otherAgent] = await this.fetchAgentTD(ThingURL); 
        // 1. find the property to read
        let [ia2invoke, property2read] = await this.findIA2InvokeInTD(td, keyword, path);
        if (ia2invoke == "properties") {
            // 2. read the property
            let answer = await otherAgent.readProperty(property2read);
            let value = await answer.value();
            // 3. send the value back to the agent
            let content = {"keyword": keyword, "value": value};
            return content;
        } else {
            return -1;
        }
    }

    protected async findIA2InvokeInTD(td: any, keyword: string, path: string) {
        /* Find the Interaction Affordance to invoke in a TD based on a keyword and a path.
            It can also find the Interaction Affordance based on an ontology annotiation.

            E.g. A property of name brighntess with "saref:measuresProperty": "saref:Light" can be found with keyword: "saref:Light" and path: "saref:measuresProperty".
            This can then be used to invoke the according Interaction Affordance.
        */

        let paths = this.findKeyValuePath(td, path, keyword);   
        // Check if paths is not empty and the first element of paths has at least two elements
        if (paths.length > 0 && paths[0].length > 1) {
            if (this.logginLevel > 2) {console.log("Found IA2Invoke: ", paths[0][1], " with name: ", paths[0][1], "for keyword: ", keyword, " and path: ", path);}
            return [paths[0][0], paths[0][1]];
        } else {
            console.log("No IA2Invoke found for keyword: ", keyword, " and path: ", path);
            // Return [null, null] if no paths found or paths are not valid
            return [null, null];
        }
    }

    protected findKeyValuePath(obj: object, key2find: string= "", value2find: string = "", path = []) {
    /* find the path to a specific key value pair in a json object.
    
    This can be used to e.g. find which property of a TD is of a specific type of ontology. 
    */

    let result:string[] = [];
  
    // Iterate over each property in the object
    Object.entries(obj).forEach(([key, value]) => {
      // Construct a new path for this property
      const newPath = path.concat([key]);

      // Check if this property is the one we're looking for
      if (key2find === "" && value === value2find) {
        result.push(newPath);
      } else if (key === key2find && value === value2find) {
        // If it is, add the path to the result set
        result.push(newPath);
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (Object.keys(value).includes(value2find)) {
            // If the object's key matches value2find, add the path to the result set
            newPath.push(value2find);
            result.push(newPath);
        } else {
            // If the value is an object, recurse into it
            result = result.concat(this.findKeyValuePath(value, key2find, value2find, newPath));
        }
      }
    });
  
    return result;
  }   

}
